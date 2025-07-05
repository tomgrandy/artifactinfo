<?php

declare(strict_types=1);

namespace Drupal\artifactinfo_custom\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\pathauto\PathautoState;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for updating vocabulary terms via CSV upload.
 */
final class VocabularyUpdateForm extends FormBase {

  /**
   * The entity type manager.
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The file system service.
   */
  protected FileSystemInterface $fileSystem;

  /**
   * Constructs a new VocabularyUpdateForm.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\File\FileSystemInterface $file_system
   *   The file system service.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    FileSystemInterface $file_system,
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->fileSystem        = $file_system;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('file_system'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'artifactinfo_custom_vocabulary_update_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form['csv_file'] = [
      '#type'              => 'managed_file',
      '#title'             => $this->t('CSV File'),
      '#description'       => $this->t('Upload a CSV file with columns: system_term_name, Updated_term_name'),
      '#upload_validators' => [
        'file_validate_extensions' => ['csv'],
      ],
      '#upload_location'   => 'temporary://csv-uploads/',
      '#required'          => TRUE,
    ];

    $vocabulary_options = $this->getVocabularyOptions();
    $form['vocabulary'] = [
      '#type'          => 'select',
      '#title'         => $this->t('Vocabulary'),
      '#description'   => $this->t('Select the vocabulary to update'),
      '#options'       => $vocabulary_options,
      '#required'      => TRUE,
      '#empty_option'  => $this->t('- Select a vocabulary -'),
    ];

    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['submit'] = [
      '#type'  => 'submit',
      '#value' => $this->t('Update Vocabulary Terms'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    $csv_file_id = $form_state->getValue(['csv_file', 0]);
    
    if (!$csv_file_id) {
      $form_state->setErrorByName('csv_file', $this->t('Please upload a CSV file.'));
      return;
    }

    $file = $this->entityTypeManager->getStorage('file')->load($csv_file_id);
    if (!$file) {
      $form_state->setErrorByName('csv_file', $this->t('Invalid file uploaded.'));
      return;
    }

    // Validate CSV structure.
    $file_uri = $file->getFileUri();
    $file_path = $this->fileSystem->realpath($file_uri);
    
    if (($handle = fopen($file_path, 'r')) !== FALSE) {
      $header = fgetcsv($handle);
      
      if (!$header || count($header) < 2) {
        $form_state->setErrorByName('csv_file', $this->t('CSV file must have at least 2 columns.'));
        fclose($handle);
        return;
      }

      // Check if file has data rows.
      $has_data = FALSE;
      while (($row = fgetcsv($handle)) !== FALSE) {
        if (!empty($row[0]) && !empty($row[1])) {
          $has_data = TRUE;
          break;
        }
      }
      
      if (!$has_data) {
        $form_state->setErrorByName('csv_file', $this->t('CSV file must contain valid data rows with both system_term_name and Updated_term_name.'));
      }
      
      fclose($handle);
    }
    else {
      $form_state->setErrorByName('csv_file', $this->t('Unable to read the uploaded CSV file.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $csv_file_id = $form_state->getValue(['csv_file', 0]);
    $vocabulary_id = $form_state->getValue('vocabulary');

    $file = $this->entityTypeManager->getStorage('file')->load($csv_file_id);
    $file_uri = $file->getFileUri();
    $file_path = $this->fileSystem->realpath($file_uri);

    $updated_count = 0;
    $error_count = 0;

    if (($handle = fopen($file_path, 'r')) !== FALSE) {
      // Skip header row.
      fgetcsv($handle);

      while (($row = fgetcsv($handle)) !== FALSE) {
        if (count($row) >= 2 && !empty($row[0]) && !empty($row[1])) {
          $system_term_name = trim($row[0]);
          $updated_term_name = trim($row[1]);

          try {
            if ($this->updateTerm($vocabulary_id, $system_term_name, $updated_term_name)) {
              $updated_count++;
            }
            else {
              $error_count++;
            }
          }
                     catch (\Exception $e) {
             $error_count++;
             $this->getLogger('artifactinfo_custom')
               ->error('Error updating term @term: @message', [
                 '@term' => $system_term_name,
                 '@message' => $e->getMessage(),
               ]);
           }
        }
      }
      fclose($handle);
    }

    // Clean up temporary file.
    $file->delete();

    if ($updated_count > 0) {
      $this->messenger()->addMessage($this->t('Updated @count terms successfully.', ['@count' => $updated_count]));
    }

    if ($error_count > 0) {
      $this->messenger()->addWarning($this->t('Failed to update @count terms.', ['@count' => $error_count]));
    }
  }

  /**
   * Get vocabulary options for the select field.
   *
   * @return array
   *   An array of vocabulary options keyed by vocabulary ID.
   */
  private function getVocabularyOptions(): array {
    $vocabularies = $this->entityTypeManager->getStorage('taxonomy_vocabulary')->loadMultiple();
    $options = [];

    foreach ($vocabularies as $vocabulary) {
      $options[$vocabulary->id()] = $vocabulary->label();
    }

    return $options;
  }

  /**
   * Update a taxonomy term.
   *
   * @param string $vocabulary_id
   *   The vocabulary ID.
   * @param string $system_term_name
   *   The current term name to search for.
   * @param string $updated_term_name
   *   The new term name.
   *
   * @return bool
   *   TRUE if the term was updated, FALSE otherwise.
   */
  private function updateTerm(string $vocabulary_id, string $system_term_name, string $updated_term_name): bool {
    $term_storage = $this->entityTypeManager->getStorage('taxonomy_term');

    // Find the term by name.
    $terms = $term_storage->loadByProperties([
      'vid' => $vocabulary_id,
      'name' => $system_term_name,
    ]);

    if (empty($terms)) {
      return FALSE;
    }

    $term = reset($terms);
    $term->setName($updated_term_name);

    // Update the URL alias by setting pathauto state.
    if ($term->hasField('path')) {
      $term->path->pathauto = PathautoState::CREATE;
    }

    $term->save();

    return TRUE;
  }

} 