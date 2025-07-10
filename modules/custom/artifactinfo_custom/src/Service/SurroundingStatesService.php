<?php

declare(strict_types=1);

namespace Drupal\artifactinfo_custom\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\taxonomy\TermInterface;

/**
 * Service for handling surrounding states functionality.
 */
final class SurroundingStatesService {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  private EntityTypeManagerInterface $entityTypeManager;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  private LoggerChannelFactoryInterface $loggerFactory;

  /**
   * Constructs a SurroundingStatesService object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    LoggerChannelFactoryInterface $logger_factory
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->loggerFactory = $logger_factory;
  }

  /**
   * Get related states for given taxonomy term IDs.
   *
   * @param array $term_ids
   *   Array of taxonomy term IDs.
   *
   * @return array
   *   Array of related state term IDs.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  public function getRelatedStates(array $term_ids): array {
    if (empty($term_ids)) {
      return [];
    }

    $related_state_ids = [];

    try {
      $terms = $this->entityTypeManager
        ->getStorage('taxonomy_term')
        ->loadMultiple($term_ids);

      foreach ($terms as $term) {
        if ($term instanceof TermInterface && $term->bundle() === 'place_of_origin') {
          $related_states = $this->extractRelatedStates($term);
          $related_state_ids = array_merge($related_state_ids, $related_states);
        }
      }

      // Remove duplicates and original term IDs to avoid conflicts.
      $related_state_ids = array_unique($related_state_ids);
      $related_state_ids = array_diff($related_state_ids, $term_ids);

      return array_values($related_state_ids);

    } catch (\Exception $e) {
      $this->loggerFactory
        ->get('artifactinfo_custom')
        ->error('Error fetching related states: @message', [
          '@message' => $e->getMessage(),
        ]);

      return [];
    }
  }

  /**
   * Extract related states from a taxonomy term.
   *
   * @param \Drupal\taxonomy\TermInterface $term
   *   The taxonomy term.
   *
   * @return array
   *   Array of related state term IDs.
   */
  private function extractRelatedStates(TermInterface $term): array {
    $related_state_ids = [];

    // Check if the term has the field_related_states field.
    if ($term->hasField('field_related_states')) {
      $related_states = $term->get('field_related_states')->referencedEntities();
      foreach ($related_states as $related_state) {
        if ($related_state instanceof TermInterface) {
          $related_state_ids[] = (int) $related_state->id();
        }
      }
    }

    return $related_state_ids;
  }

} 