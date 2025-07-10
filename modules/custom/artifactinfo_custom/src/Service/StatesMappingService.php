<?php

declare(strict_types=1);

namespace Drupal\artifactinfo_custom\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\file\FileInterface;
use Drupal\taxonomy\Entity\Term;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Exception as ReaderException;

/**
 * Service for processing states mapping from XLSX files.
 */
final class StatesMappingService {

  use StringTranslationTrait;

  /**
   * The vocabulary ID for Place of Origin.
   */
  private const VOCABULARY_ID = 'place_of_origin';

  /**
   * The field name for related states.
   */
  private const RELATED_STATES_FIELD = 'field_related_states';

  /**
   * The entity type manager.
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The file system service.
   */
  protected FileSystemInterface $fileSystem;

  /**
   * The logger factory.
   */
  protected LoggerChannelFactoryInterface $loggerFactory;

  /**
   * Constructs a StatesMappingService.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\File\FileSystemInterface $file_system
   *   The file system service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    FileSystemInterface $file_system,
    LoggerChannelFactoryInterface $logger_factory,
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->fileSystem        = $file_system;
    $this->loggerFactory     = $logger_factory;
  }

  /**
   * Validates the XLSX file structure.
   *
   * @param \Drupal\file\FileInterface $file
   *   The uploaded XLSX file.
   *
   * @return array
   *   Validation result with 'valid' boolean and 'message' string.
   */
  public function validateXlsxFile(FileInterface $file): array {
    try {
      $file_path = $this->fileSystem->realpath($file->getFileUri());
      
      if (!$file_path || !file_exists($file_path)) {
        return [
          'valid'   => FALSE,
          'message' => 'File not found or cannot be accessed.',
        ];
      }

      $reader = IOFactory::createReaderForFile($file_path);
      $reader->setReadDataOnly(TRUE);
      $spreadsheet = $reader->load($file_path);
      $worksheet = $spreadsheet->getActiveSheet();
      
      // Check if we have at least 2 columns.
      $highest_column = $worksheet->getHighestColumn();
      $highest_column_index = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highest_column);
      
      if ($highest_column_index < 2) {
        return [
          'valid'   => FALSE,
          'message' => 'File must have at least 2 columns (State and Surrounding Areas).',
        ];
      }

      // Check if we have data rows (at least header + 1 data row).
      $highest_row = $worksheet->getHighestRow();
      if ($highest_row < 2) {
        return [
          'valid'   => FALSE,
          'message' => 'File must contain at least a header row and one data row.',
        ];
      }

      // Check for data in the first row after header.
      $state_value = $worksheet->getCell('A2')->getCalculatedValue();
      if (empty($state_value)) {
        return [
          'valid'   => FALSE,
          'message' => 'No data found in State column.',
        ];
      }

      return [
        'valid'   => TRUE,
        'message' => 'File validation successful.',
      ];

    }
    catch (ReaderException $e) {
      return [
        'valid'   => FALSE,
        'message' => 'Invalid XLSX file format: ' . $e->getMessage(),
      ];
    }
    catch (\Exception $e) {
      return [
        'valid'   => FALSE,
        'message' => 'Error reading file: ' . $e->getMessage(),
      ];
    }
  }

  /**
   * Processes the states mapping from XLSX file.
   *
   * @param \Drupal\file\FileInterface $file
   *   The uploaded XLSX file.
   * @param string $update_mode
   *   The update mode: 'replace' or 'append'.
   *
   * @return array
   *   Processing results with counts and messages.
   *
   * @throws \Exception
   *   If file processing fails.
   */
  public function processStatesMapping(FileInterface $file, string $update_mode): array {
    $file_path = $this->fileSystem->realpath($file->getFileUri());
    
    if (!$file_path || !file_exists($file_path)) {
      throw new \Exception('File not found or cannot be accessed.');
    }

    try {
      $reader = IOFactory::createReaderForFile($file_path);
      $reader->setReadDataOnly(TRUE);
      $spreadsheet = $reader->load($file_path);
      $worksheet = $spreadsheet->getActiveSheet();
      
      $processed     = 0;
      $skipped       = 0;
      $errors        = 0;
      $skipped_states = [];

      // Get all existing taxonomy terms for reference.
      $existing_terms = $this->loadAllTermsByName();

      // Process each row (skip header row).
      $highest_row = $worksheet->getHighestRow();
      for ($row = 2; $row <= $highest_row; $row++) {
        $state_name      = trim((string) $worksheet->getCell("A{$row}")->getCalculatedValue());
        $surrounding_raw = trim((string) $worksheet->getCell("B{$row}")->getCalculatedValue());

        // Debug logging for troubleshooting.
        $this->loggerFactory->get('artifactinfo_custom')->info(
          'Processing row @row: State="@state" (length: @state_len), Surrounding="@surrounding" (length: @surr_len)',
          [
            '@row'         => $row,
            '@state'       => $state_name,
            '@state_len'   => strlen($state_name),
            '@surrounding' => $surrounding_raw,
            '@surr_len'    => strlen($surrounding_raw),
          ]
        );

        if (empty($state_name)) {
          continue; // Skip empty rows.
        }

        try {
          $result = $this->processStateTerm($state_name, $surrounding_raw, $existing_terms, $update_mode);
          
          if ($result['processed']) {
            $processed++;
          }
          elseif ($result['skipped']) {
            $skipped++;
            $skipped_states[] = $state_name;
          }
        }
        catch (\Exception $e) {
          $errors++;
          $this->loggerFactory->get('artifactinfo_custom')->error(
            'Error processing state @state: @message',
            [
              '@state'   => $state_name,
              '@message' => $e->getMessage(),
            ]
          );
        }
      }

      return [
        'processed'      => $processed,
        'skipped'        => $skipped,
        'errors'         => $errors,
        'skipped_states' => $skipped_states,
      ];

    }
    catch (ReaderException $e) {
      throw new \Exception('Invalid XLSX file format: ' . $e->getMessage());
    }
  }

  /**
   * Processes a single state term and its surrounding areas.
   *
   * @param string $state_name
   *   The state name.
   * @param string $surrounding_raw
   *   The raw surrounding areas string.
   * @param array $existing_terms
   *   Array of existing terms keyed by normalized name.
   * @param string $update_mode
   *   The update mode: 'replace' or 'append'.
   *
   * @return array
   *   Processing result with 'processed' and 'skipped' booleans.
   */
  private function processStateTerm(string $state_name, string $surrounding_raw, array $existing_terms, string $update_mode): array {
    // Find the state term using case-insensitive comparison.
    $normalized_state_name = strtoupper(trim($state_name));
    if (!isset($existing_terms[$normalized_state_name])) {
      return ['processed' => FALSE, 'skipped' => TRUE];
    }

    $state_term = $existing_terms[$normalized_state_name];

    // Parse surrounding states.
    $surrounding_states = $this->parseSurroundingStates($surrounding_raw, $existing_terms);

    // Update the field_related_states field.
    $current_values = [];
    if ($update_mode === 'append' && $state_term->hasField(self::RELATED_STATES_FIELD)) {
      $current_field_values = $state_term->get(self::RELATED_STATES_FIELD)->getValue();
      $current_values = array_column($current_field_values, 'target_id');
    }

    // Prepare new values.
    $new_values = [];
    if ($update_mode === 'append') {
      $new_values = $current_values;
    }

    // Add surrounding state term IDs.
    foreach ($surrounding_states as $surrounding_term_id) {
      if (!in_array($surrounding_term_id, $new_values, TRUE)) {
        $new_values[] = $surrounding_term_id;
      }
    }

    // Update the term.
    $state_term->set(self::RELATED_STATES_FIELD, $new_values);
    $state_term->save();

    return ['processed' => TRUE, 'skipped' => FALSE];
  }

  /**
   * Parses surrounding states string and returns valid term IDs.
   *
   * @param string $surrounding_raw
   *   The raw surrounding states string.
   * @param array $existing_terms
   *   Array of existing terms keyed by normalized name.
   *
   * @return array
   *   Array of valid term IDs.
   */
  private function parseSurroundingStates(string $surrounding_raw, array $existing_terms): array {
    $trimmed_lower = strtolower(trim($surrounding_raw));
    
    // Debug logging for 'none' handling.
    $this->loggerFactory->get('artifactinfo_custom')->info(
      'Parsing surrounding states: Raw="@raw", Trimmed lowercase="@trimmed", Is empty=@empty, Is none=@none',
      [
        '@raw'     => $surrounding_raw,
        '@trimmed' => $trimmed_lower,
        '@empty'   => empty($surrounding_raw) ? 'YES' : 'NO',
        '@none'    => ($trimmed_lower === 'none') ? 'YES' : 'NO',
      ]
    );
    
    if (empty($surrounding_raw) || $trimmed_lower === 'none') {
      $this->loggerFactory->get('artifactinfo_custom')->info('Returning empty array for none/empty value');
      return [];
    }

    $surrounding_names = array_map('trim', explode(',', $surrounding_raw));
    $surrounding_term_ids = [];

    foreach ($surrounding_names as $surrounding_name) {
      if (!empty($surrounding_name)) {
        $normalized_surrounding_name = strtoupper(trim($surrounding_name));
        if (isset($existing_terms[$normalized_surrounding_name])) {
          $surrounding_term_ids[] = $existing_terms[$normalized_surrounding_name]->id();
        }
      }
    }

    return $surrounding_term_ids;
  }

  /**
   * Loads all taxonomy terms from the Place of Origin vocabulary.
   *
   * @return array
   *   Array of taxonomy terms keyed by normalized (uppercase) name.
   */
  private function loadAllTermsByName(): array {
    $terms = [];
    
    try {
      $term_storage = $this->entityTypeManager->getStorage('taxonomy_term');
      $term_ids = $term_storage->getQuery()
        ->condition('vid', self::VOCABULARY_ID)
        ->accessCheck(FALSE)
        ->execute();

      if (!empty($term_ids)) {
        $loaded_terms = $term_storage->loadMultiple($term_ids);
        
        foreach ($loaded_terms as $term) {
          if ($term instanceof Term) {
            // Use normalized (uppercase) name as key for case-insensitive comparison.
            $normalized_name = strtoupper(trim($term->getName()));
            $terms[$normalized_name] = $term;
          }
        }
      }
    }
    catch (\Exception $e) {
      $this->loggerFactory->get('artifactinfo_custom')->error(
        'Error loading taxonomy terms: @message',
        ['@message' => $e->getMessage()]
      );
    }

    return $terms;
  }

}