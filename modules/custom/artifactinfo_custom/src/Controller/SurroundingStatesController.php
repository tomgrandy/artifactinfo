<?php

declare(strict_types=1);

namespace Drupal\artifactinfo_custom\Controller;

use Drupal\artifactinfo_custom\Service\SurroundingStatesService;
use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for surrounding states functionality.
 */
final class SurroundingStatesController extends ControllerBase {

  /**
   * The surrounding states service.
   *
   * @var \Drupal\artifactinfo_custom\Service\SurroundingStatesService
   */
  private SurroundingStatesService $surroundingStatesService;

  /**
   * Constructs a SurroundingStatesController object.
   *
   * @param \Drupal\artifactinfo_custom\Service\SurroundingStatesService $surrounding_states_service
   *   The surrounding states service.
   */
  public function __construct(SurroundingStatesService $surrounding_states_service) {
    $this->surroundingStatesService = $surrounding_states_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('artifactinfo_custom.surrounding_states')
    );
  }

  /**
   * Get related states for given term IDs.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with related state IDs.
   */
  public function getRelatedStates(Request $request): JsonResponse {
    // Get term_ids from request - handle both array and individual values.
    $term_ids = $request->request->all('term_ids');
    
    // If term_ids is not an array or is empty, try to get it as a single value.
    if (!is_array($term_ids) || empty($term_ids)) {
      $single_term_id = $request->request->get('term_ids');
      if ($single_term_id !== null) {
        $term_ids = [$single_term_id];
      } else {
        $term_ids = [];
      }
    }
    
    if (empty($term_ids)) {
      return new JsonResponse(['error' => 'No valid term IDs provided'], 400);
    }

    // Convert to integers for security.
    $term_ids = array_map('intval', $term_ids);
    $term_ids = array_filter($term_ids);

    if (empty($term_ids)) {
      return new JsonResponse(['error' => 'No valid term IDs provided'], 400);
    }

    try {
      $related_state_ids = $this->surroundingStatesService->getRelatedStates($term_ids);

      return new JsonResponse([
        'success' => TRUE,
        'related_state_ids' => $related_state_ids,
      ]);

    } catch (\Exception $e) {
      $this->getLogger('artifactinfo_custom')->error('Error fetching related states: @message', [
        '@message' => $e->getMessage(),
      ]);
      
      return new JsonResponse(['error' => 'Server error occurred'], 500);
    }
  }

} 