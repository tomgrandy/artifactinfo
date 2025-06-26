<?php

declare(strict_types=1);

namespace Drupal\artifactinfo_custom\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\file\Entity\File;

/**
 * Configure learning page settings.
 */
final class LearningPageConfigForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'artifactinfo_custom_learning_config';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['artifactinfo_custom.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('artifactinfo_custom.settings');

    $form['learning_page_background_image'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('Learning Page Background Image'),
      '#description' => $this->t('Upload an image to use as the background for the learning center page.'),
      '#default_value' => $config->get('learning_page_background_image') ? [$config->get('learning_page_background_image')] : [],
      '#upload_location' => 'public://learning-page-backgrounds/',
      '#upload_validators' => [
        'file_validate_is_image' => [],
        'file_validate_extensions' => ['png jpg jpeg gif webp'],
      ],
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $file_id = $form_state->getValue('learning_page_background_image');

    if (!empty($file_id) && is_array($file_id)) {
      $file_id = reset($file_id);
      $file = File::load($file_id);
      if ($file) {
        $file->setPermanent();
        $file->save();
      }
    }

    $this->config('artifactinfo_custom.settings')
      ->set('learning_page_background_image', $file_id)
      ->save();

    parent::submitForm($form, $form_state);
  }

}
