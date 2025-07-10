<?php

declare(strict_types=1);

namespace Drupal\artifactinfo_custom\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Messenger\MessengerTrait;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\artifactinfo_custom\Service\StatesMappingService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for updating states surrounding areas via XLSX upload.
 */
final class StatesMappingForm extends FormBase {

  use MessengerTrait;
  use StringTranslationTrait;

  /**
   * The entity type manager.
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The file system service.
   */
  protected FileSystemInterface $fileSystem;

  /**
   * The states mapping service.
   */
  protected StatesMappingService $statesMappingService;

  /**
   * Constructs a new StatesMappingForm.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\File\FileSystemInterface $file_system
   *   The file system service.
   * @param \Drupal\artifactinfo_custom\Service\StatesMappingService $states_mapping_service
   *   The states mapping service.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    FileSystemInterface $file_system,
    StatesMappingService $states_mapping_service,
  ) {
    $this->entityTypeManager     = $entity_type_manager;
    $this->fileSystem           = $file_system;
    $this->statesMappingService = $states_mapping_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('file_system'),
      $container->get('artifactinfo_custom.states_mapping'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'artifactinfo_custom_states_mapping_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form['description'] = [
      '#type'   => 'item',
      '#markup' => $this->t('<p>Upload an XLSX file with two columns:</p>
        <ul>
          <li><strong>State:</strong> The state name (must match existing taxonomy terms)</li>
          <li><strong>Surrounding Areas:</strong> Comma-separated list of surrounding states</li>
        </ul>
        <p><strong>Example:</strong></p>
        <p>Alabama | Tennessee, Georgia, Mississippi, Florida</p>
        <p>Alaska | none</p>
        <p>Arizona | New Mexico, Colorado, Utah, Nevada</p>'),
    ];

    $form['xlsx_file'] = [
      '#type'              => 'managed_file',
      '#title'             => $this->t('XLSX File'),
      '#description'       => $this->t('Upload an XLSX file with State and Surrounding Areas columns.'),
      '#upload_validators' => [
        'file_validate_extensions' => ['xlsx', 'xls'],
        'file_validate_size'       => [5 * 1024 * 1024], // 5MB max
      ],
      '#upload_location'   => 'temporary://states-mapping/',
      '#required'          => TRUE,
      '#multiple'          => FALSE,
    ];

    $form['update_mode'] = [
      '#type'          => 'radios',
      '#title'         => $this->t('Update Mode'),
      '#description'   => $this->t('Choose how to handle existing field_related_states values.'),
      '#options'       => [
        'replace' => $this->t('Replace existing values (recommended for full updates)'),
        'append'  => $this->t('Append to existing values (merge with current data)'),
      ],
      '#default_value' => 'replace',
      '#required'      => TRUE,
    ];

    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['submit'] = [
      '#type'  => 'submit',
      '#value' => $this->t('Process States Mapping'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    $xlsx_file_id = $form_state->getValue(['xlsx_file', 0]);
    
    if (!$xlsx_file_id) {
      $form_state->setErrorByName('xlsx_file', $this->t('Please upload an XLSX file.'));
      return;
    }

    $file = $this->entityTypeManager->getStorage('file')->load($xlsx_file_id);
    if (!$file) {
      $form_state->setErrorByName('xlsx_file', $this->t('Invalid file uploaded.'));
      return;
    }

    // Validate file extension.
    $file_extension = pathinfo($file->getFilename(), PATHINFO_EXTENSION);
    if (!in_array(strtolower($file_extension), ['xlsx', 'xls'], TRUE)) {
      $form_state->setErrorByName('xlsx_file', $this->t('Only XLSX and XLS files are allowed.'));
      // Clean up invalid file.
      $file->delete();
      return;
    }

    // Validate file structure using the service.
    try {
      $validation_result = $this->statesMappingService->validateXlsxFile($file);
      
      if (!$validation_result['valid']) {
        $form_state->setErrorByName('xlsx_file', $this->t('File validation failed: @message', [
          '@message' => $validation_result['message'],
        ]));
        // Clean up invalid file.
        $file->delete();
      }
    }
    catch (\Exception $e) {
      $form_state->setErrorByName('xlsx_file', $this->t('Error validating file: @message', [
        '@message' => $e->getMessage(),
      ]));
      // Clean up file that caused errors.
      $file->delete();
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $xlsx_file_id = $form_state->getValue(['xlsx_file', 0]);
    $update_mode  = $form_state->getValue('update_mode');

    $file = $this->entityTypeManager->getStorage('file')->load($xlsx_file_id);

    try {
      $result = $this->statesMappingService->processStatesMapping($file, $update_mode);

      // Clean up temporary file.
      $file->delete();

      // Display results.
      if ($result['processed'] > 0) {
        $this->messenger()->addMessage($this->t('Successfully processed @count state terms.', [
          '@count' => $result['processed'],
        ]));
      }

      if ($result['skipped'] > 0) {
        $this->messenger()->addWarning($this->t('Skipped @count states (terms not found in vocabulary).', [
          '@count' => $result['skipped'],
        ]));
      }

      if ($result['errors'] > 0) {
        $this->messenger()->addError($this->t('Encountered @count errors during processing.', [
          '@count' => $result['errors'],
        ]));
      }

      if (!empty($result['skipped_states'])) {
        $this->messenger()->addWarning($this->t('Skipped states: @states', [
          '@states' => implode(', ', $result['skipped_states']),
        ]));
      }

    }
    catch (\Exception $e) {
      $this->messenger()->addError($this->t('Error processing file: @message', [
        '@message' => $e->getMessage(),
      ]));
      
      $this->getLogger('artifactinfo_custom')->error('Error processing states mapping: @message', [
        '@message' => $e->getMessage(),
      ]);
    }
  }

}