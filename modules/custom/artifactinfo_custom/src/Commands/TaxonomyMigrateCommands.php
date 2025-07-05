<?php

declare(strict_types=1);

namespace Drupal\artifactinfo_custom\Commands;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Database\Connection;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\taxonomy\Entity\Term;
use Drupal\node\Entity\Node;
use Drush\Commands\DrushCommands;
use Drush\Exceptions\UserAbortException;

/**
 * Drush commands for migrating keywords to taxonomy hierarchy.
 */
class TaxonomyMigrateCommands extends DrushCommands {

  use StringTranslationTrait;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The database connection.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * The vocabulary machine name.
   *
   * @var string
   */
  protected $vocabularyId = 'search_categories';

  /**
   * The content type machine name.
   *
   * @var string
   */
  protected $contentType = 'artifacts';

  /**
   * Constructs a new TaxonomyMigrateCommands object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Database\Connection $database
   *   The database connection.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager, Connection $database, LoggerChannelFactoryInterface $logger_factory) {
    $this->entityTypeManager = $entity_type_manager;
    $this->database = $database;
    $this->loggerFactory = $logger_factory;
  }

  /**
   * Migrate keywords to taxonomy hierarchy.
   *
   * @param array $options
   *   The command options.
   *
   * @option dry-run
   *   Preview changes without executing them.
   * @option batch-size
   *   Number of nodes to process per batch (default: 50).
   * @option content-type
   *   Content type machine name (default: artifacts).
   * @option vocabulary
   *   Vocabulary machine name (default: search_categories).
   *
   * @command taxonomy:migrate-keywords
   * @aliases tmk
   * @usage taxonomy:migrate-keywords
   *   Migrate keywords to taxonomy hierarchy.
   * @usage taxonomy:migrate-keywords --dry-run
   *   Preview the migration without making changes.
   * @usage taxonomy:migrate-keywords --batch-size=100
   *   Process 100 nodes per batch.
   */
  public function migrateKeywords(array $options = [
    'dry-run' => FALSE,
    'batch-size' => 50,
    'content-type' => 'artifacts',
    'vocabulary' => 'search_categories',
  ]) {
    
    $this->contentType = $options['content-type'];
    $this->vocabularyId = $options['vocabulary'];
    $batchSize = (int) $options['batch-size'];
    $dryRun = $options['dry-run'];

    if ($dryRun) {
      $this->output()->writeln('<info>Running in DRY-RUN mode. No changes will be made.</info>');
    }

    // Validate prerequisites.
    if (!$this->validatePrerequisites()) {
      return;
    }

    try {
      // Step 1: Analyze current data.
      $this->output()->writeln('<info>Analyzing current data...</info>');
      $parentChildMap = $this->analyzeData();
      
      if (empty($parentChildMap)) {
        $this->output()->writeln('<warning>No parent-child relationships found. Exiting.</warning>');
        return;
      }

      $this->displayAnalysis($parentChildMap);

      // Confirm before proceeding.
      if (!$dryRun && !$this->io()->confirm('Do you want to proceed with the migration?', FALSE)) {
        throw new UserAbortException();
      }

      // Step 2: Create taxonomy hierarchy.
      $this->output()->writeln('<info>Creating taxonomy hierarchy...</info>');
      $termMapping = $this->createTaxonomyHierarchy($parentChildMap, $dryRun);

      // Step 3: Update nodes.
      $this->output()->writeln('<info>Updating nodes...</info>');
      $this->updateNodes($termMapping, $batchSize, $dryRun);

      $this->output()->writeln('<success>Migration completed successfully!</success>');

    } catch (UserAbortException $e) {
      $this->output()->writeln('<comment>Migration cancelled by user.</comment>');
    } catch (\Exception $e) {
      $this->output()->writeln('<error>Migration failed: ' . $e->getMessage() . '</error>');
      $this->loggerFactory->get('taxonomy_migrate')->error('Migration failed: @message', [
        '@message' => $e->getMessage(),
      ]);
    }
  }

  /**
   * Validate prerequisites for the migration.
   *
   * @return bool
   *   TRUE if prerequisites are met, FALSE otherwise.
   */
  protected function validatePrerequisites() {
    $nodeStorage = $this->entityTypeManager->getStorage('node');
    $termStorage = $this->entityTypeManager->getStorage('taxonomy_term');

    // Check if content type exists.
    $contentTypes = $nodeStorage->getQuery()
      ->accessCheck(FALSE)
      ->condition('type', $this->contentType)
      ->range(0, 1)
      ->execute();

    if (empty($contentTypes)) {
      $this->output()->writeln('<error>Content type "' . $this->contentType . '" not found.</error>');
      return FALSE;
    }

    // Check if vocabulary exists.
    $vocabulary = $this->entityTypeManager->getStorage('taxonomy_vocabulary')->load($this->vocabularyId);
    if (!$vocabulary) {
      $this->output()->writeln('<error>Vocabulary "' . $this->vocabularyId . '" not found.</error>');
      return FALSE;
    }

    // Check if required fields exist.
    $fieldManager = \Drupal::service('entity_field.manager');
    $fields = $fieldManager->getFieldDefinitions('node', $this->contentType);
    
    if (!isset($fields['field_search_categories'])) {
      $this->output()->writeln('<error>Field "field_search_categories" not found on content type "' . $this->contentType . '".</error>');
      return FALSE;
    }

    if (!isset($fields['field_keyword'])) {
      $this->output()->writeln('<error>Field "field_keyword" not found on content type "' . $this->contentType . '".</error>');
      return FALSE;
    }

    return TRUE;
  }

  /**
   * Analyze current data to build parent-child mapping.
   *
   * @return array
   *   Array mapping parent term IDs to child term data.
   */
  protected function analyzeData() {
    $query = $this->database->select('node__field_search_categories', 'sc');
    $query->join('node__field_keyword', 'kw', 'sc.entity_id = kw.entity_id');
    $query->join('node_field_data', 'n', 'sc.entity_id = n.nid');
    $query->join('taxonomy_term_field_data', 'td', 'kw.field_keyword_target_id = td.tid');
    $query->fields('sc', ['field_search_categories_target_id']);
    $query->fields('td', ['name']);
    $query->condition('n.type', $this->contentType);
    $query->condition('n.status', 1);
    $query->condition('td.status', 1);
    $query->groupBy('sc.field_search_categories_target_id');
    $query->groupBy('td.name');

    $results = $query->execute()->fetchAll();

    $parentChildMap = [];
    foreach ($results as $result) {
      $parentId = $result->field_search_categories_target_id;
      $childName = trim($result->name);
      
      if (!empty($childName)) {
        $parentChildMap[$parentId][$childName] = $childName;
      }
    }

    return $parentChildMap;
  }

  /**
   * Display analysis results.
   *
   * @param array $parentChildMap
   *   The parent-child mapping.
   */
  protected function displayAnalysis(array $parentChildMap) {
    $termStorage = $this->entityTypeManager->getStorage('taxonomy_term');
    
    $this->output()->writeln('<info>Analysis Results:</info>');
    $this->output()->writeln('');

    foreach ($parentChildMap as $parentId => $children) {
      $parent = $termStorage->load($parentId);
      if ($parent) {
        $this->output()->writeln('<comment>Parent: ' . $parent->getName() . ' (ID: ' . $parentId . ')</comment>');
        foreach ($children as $childName) {
          $this->output()->writeln('  - ' . $childName);
        }
        $this->output()->writeln('');
      }
    }

    $totalParents = count($parentChildMap);
    $totalChildren = array_sum(array_map('count', $parentChildMap));
    $this->output()->writeln('<info>Total parent terms: ' . $totalParents . '</info>');
    $this->output()->writeln('<info>Total child terms to create: ' . $totalChildren . '</info>');
  }

  /**
   * Create taxonomy hierarchy.
   *
   * @param array $parentChildMap
   *   The parent-child mapping.
   * @param bool $dryRun
   *   Whether this is a dry run.
   *
   * @return array
   *   Mapping of child names to term IDs.
   */
  protected function createTaxonomyHierarchy(array $parentChildMap, $dryRun = FALSE) {
    $termStorage = $this->entityTypeManager->getStorage('taxonomy_term');
    $termMapping = [];
    $created = 0;
    $skipped = 0;

    foreach ($parentChildMap as $parentId => $children) {
      $parent = $termStorage->load($parentId);
      if (!$parent) {
        $this->output()->writeln('<warning>Parent term with ID ' . $parentId . ' not found. Skipping.</warning>');
        continue;
      }

      foreach ($children as $childName) {
        // Check if child term already exists.
        $existing = $termStorage->loadByProperties([
          'name' => $childName,
          'vid' => $this->vocabularyId,
        ]);

        if (!empty($existing)) {
          $existingTerm = reset($existing);
          $termMapping[$childName] = $existingTerm->id();
          $skipped++;
          continue;
        }

        if (!$dryRun) {
          // Create new child term.
          $childTerm = Term::create([
            'name' => $childName,
            'vid' => $this->vocabularyId,
            'parent' => $parentId,
          ]);
          $childTerm->save();
          $termMapping[$childName] = $childTerm->id();
        } else {
          // In dry run, use a placeholder ID.
          $termMapping[$childName] = 'new_term_' . $created;
        }

        $created++;
      }
    }

    $this->output()->writeln('<info>Created ' . $created . ' new terms, skipped ' . $skipped . ' existing terms.</info>');
    return $termMapping;
  }

  /**
   * Update nodes with new taxonomy terms.
   *
   * @param array $termMapping
   *   Mapping of child names to term IDs.
   * @param int $batchSize
   *   Number of nodes to process per batch.
   * @param bool $dryRun
   *   Whether this is a dry run.
   */
  protected function updateNodes(array $termMapping, $batchSize, $dryRun = FALSE) {
    $nodeStorage = $this->entityTypeManager->getStorage('node');
    
    // Get all nodes that need updating.
    $query = $nodeStorage->getQuery()
      ->accessCheck(FALSE)
      ->condition('type', $this->contentType)
      ->condition('status', 1)
      ->exists('field_keyword')
      ->exists('field_search_categories');

    $nids = $query->execute();
    $totalNodes = count($nids);

    if ($totalNodes === 0) {
      $this->output()->writeln('<warning>No nodes found to update.</warning>');
      return;
    }

    $this->output()->writeln('<info>Found ' . $totalNodes . ' nodes to update.</info>');

    $batches = array_chunk($nids, $batchSize);
    $updated = 0;
    $errors = 0;

    foreach ($batches as $batchIndex => $batch) {
      $this->output()->writeln('<info>Processing batch ' . ($batchIndex + 1) . ' of ' . count($batches) . '...</info>');

      $nodes = $nodeStorage->loadMultiple($batch);

      foreach ($nodes as $node) {
        try {
          if ($this->updateNode($node, $termMapping, $dryRun)) {
            $updated++;
          }
        } catch (\Exception $e) {
          $errors++;
          $this->output()->writeln('<error>Error updating node ' . $node->id() . ': ' . $e->getMessage() . '</error>');
        }
      }

      // Clear entity cache to prevent memory issues.
      $nodeStorage->resetCache();
    }

    $this->output()->writeln('<info>Updated ' . $updated . ' nodes with ' . $errors . ' errors.</info>');
  }

  /**
   * Update a single node.
   *
   * @param \Drupal\node\Entity\Node $node
   *   The node to update.
   * @param array $termMapping
   *   Mapping of child names to term IDs.
   * @param bool $dryRun
   *   Whether this is a dry run.
   *
   * @return bool
   *   TRUE if the node was updated, FALSE otherwise.
   */
  protected function updateNode(Node $node, array $termMapping, $dryRun = FALSE) {
    $keywordField = $node->get('field_keyword');
    if ($keywordField->isEmpty()) {
      return FALSE;
    }

    $keywordTerm = $keywordField->entity;
    if (!$keywordTerm) {
      return FALSE;
    }

    $keyword = trim($keywordTerm->getName());
    if (!isset($termMapping[$keyword])) {
      $this->output()->writeln('<warning>No term mapping found for keyword "' . $keyword . '" on node ' . $node->id() . '</warning>');
      return FALSE;
    }

    $currentTerms = $node->get('field_search_categories')->getValue();
    $currentTermIds = array_column($currentTerms, 'target_id');

    // Add the child term if it's not already there.
    $childTermId = $termMapping[$keyword];
    if (!in_array($childTermId, $currentTermIds) && !$dryRun) {
      $currentTerms[] = ['target_id' => $childTermId];
      $node->set('field_search_categories', $currentTerms);
      $node->save();
    }

    if ($dryRun) {
      $this->output()->writeln('Would update node ' . $node->id() . ' with child term: ' . $keyword);
    }

    return TRUE;
  }

  /**
   * Clean up orphaned field_keyword data.
   *
   * @param array $options
   *   The command options.
   *
   * @option dry-run
   *   Preview changes without executing them.
   * @option content-type
   *   Content type machine name (default: artifacts).
   *
   * @command taxonomy:cleanup-keywords
   * @aliases tck
   * @usage taxonomy:cleanup-keywords
   *   Clear field_keyword values after successful migration.
   * @usage taxonomy:cleanup-keywords --dry-run
   *   Preview the cleanup without making changes.
   */
  public function cleanupKeywords(array $options = [
    'dry-run' => FALSE,
    'content-type' => 'artifacts',
  ]) {
    
    $this->contentType = $options['content-type'];
    $dryRun = $options['dry-run'];

    if ($dryRun) {
      $this->output()->writeln('<info>Running in DRY-RUN mode. No changes will be made.</info>');
    }

    $nodeStorage = $this->entityTypeManager->getStorage('node');
    
    $query = $nodeStorage->getQuery()
      ->accessCheck(FALSE)
      ->condition('type', $this->contentType)
      ->condition('status', 1)
      ->exists('field_keyword');

    $nids = $query->execute();
    $totalNodes = count($nids);

    if ($totalNodes === 0) {
      $this->output()->writeln('<warning>No nodes found with field_keyword data.</warning>');
      return;
    }

    $this->output()->writeln('<info>Found ' . $totalNodes . ' nodes with field_keyword data.</info>');

    if (!$dryRun && !$this->io()->confirm('Are you sure you want to clear all field_keyword values?', FALSE)) {
      throw new UserAbortException();
    }

    $updated = 0;
    $nodes = $nodeStorage->loadMultiple($nids);

    foreach ($nodes as $node) {
      if ($dryRun) {
        $this->output()->writeln('Would clear field_keyword for node ' . $node->id());
      } else {
        $node->set('field_keyword', []);
        $node->save();
      }
      $updated++;
    }

    $this->output()->writeln('<info>Cleared field_keyword for ' . $updated . ' nodes.</info>');
  }

}