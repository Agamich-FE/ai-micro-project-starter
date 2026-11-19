<?php

/**
 * @file
 * Assertions for the ls_events recipe, run by scripts/test-recipe.sh.
 *
 * Run inside the site with:
 *   ddev drush php:script ../scripts/recipe-assertions.php
 *
 * Prints "ok - ..." for each passing check and throws on the first failure,
 * so drush exits non-zero.
 */

declare(strict_types=1);

use Drupal\field\Entity\FieldConfig;

$check = function (bool $condition, string $message): void {
  if (!$condition) {
    throw new \RuntimeException("not ok - $message");
  }
  echo "ok - $message\n";
};

$etm = \Drupal::entityTypeManager();

// Content model.
$check($etm->getStorage('node_type')->load('event') !== NULL, 'node type "event" exists');
$expected_fields = [
  'body' => 'text_with_summary',
  'field_event_date' => 'daterange',
  'field_event_location' => 'string',
  'field_event_image' => 'entity_reference',
  'field_event_category' => 'entity_reference',
];
foreach ($expected_fields as $name => $type) {
  $field = FieldConfig::loadByName('node', 'event', $name);
  $check($field !== NULL && $field->getType() === $type, "field $name ($type) exists on event");
}
$check($etm->getStorage('taxonomy_vocabulary')->load('event_category') !== NULL, 'vocabulary "event_category" exists');

// View and block.
$view = $etm->getStorage('view')->load('ls_events');
$check($view !== NULL, 'view "ls_events" exists');
$displays = $view->get('display');
$check(isset($displays['page']) && ($displays['page']['display_options']['path'] ?? '') === 'events', 'view has a "page" display at /events');
$check(isset($displays['next_3']), 'view has a "next_3" block display');
$default_theme = \Drupal::config('system.theme')->get('default');
$block = $etm->getStorage('block')->load('ls_events_next_3');
$check($block !== NULL && $block->getTheme() === $default_theme, "\"Next 3 events\" block is placed in the default theme ($default_theme)");

// Pathauto.
$pattern = $etm->getStorage('pathauto_pattern')->load('event');
$check($pattern !== NULL && $pattern->getPattern() === '/events/[node:title]', 'Pathauto pattern "event" is /events/[node:title]');

// Default content: exactly 5, so a second apply must not duplicate them.
$events = $etm->getStorage('node')->loadByProperties(['type' => 'event']);
$check(count($events) === 5, 'exactly 5 event nodes (found ' . count($events) . ')');
foreach ($events as $event) {
  $alias = $event->toUrl()->toString();
  $check(str_starts_with($alias, '/events/') && (int) $event->get('path')->pathauto === 1, "event \"{$event->label()}\" has a Pathauto alias ($alias)");
  $media = $event->get('field_event_image')->entity;
  $file = $media?->get('field_media_image')->entity;
  $check($file !== NULL && file_exists($file->getFileUri()), "event \"{$event->label()}\" has an image file on disk");
}
$terms = $etm->getStorage('taxonomy_term')->loadByProperties(['vid' => 'event_category']);
$check(count($terms) === 4, 'exactly 4 event categories (found ' . count($terms) . ')');

// Event editor role.
$role = $etm->getStorage('user_role')->load('event_editor');
$check($role !== NULL, 'role "event_editor" exists');
foreach (['create event content', 'edit own event content', 'delete own event content', 'use text format basic_html'] as $permission) {
  $check($role->hasPermission($permission), "event_editor has \"$permission\"");
}
foreach (['administer site configuration', 'administer nodes'] as $permission) {
  $check(!$role->hasPermission($permission), "event_editor does NOT have \"$permission\"");
}
$admin_permissions = preg_grep('/^administer /', $role->getPermissions());
$check($admin_permissions === [], 'event_editor has no "administer *" permissions');
// Only grantable where the Navigation module exists (see docs/PLAN.md step 4).
$has_navigation = \Drupal::moduleHandler()->moduleExists('navigation');
$check($role->hasPermission('access navigation') === $has_navigation, 'event_editor has "access navigation" only if Navigation is installed (' . ($has_navigation ? 'yes' : 'no') . ')');

// Companion module.
$check(\Drupal::moduleHandler()->moduleExists('ls_events_ui'), 'module ls_events_ui is installed');
$registry = \Drupal::service('theme.registry')->get();
$check(isset($registry['node__event__teaser'], $registry['node__event__full']), 'event teaser/full templates are registered');
