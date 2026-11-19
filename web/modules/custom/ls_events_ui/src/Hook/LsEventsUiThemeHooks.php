<?php

declare(strict_types=1);

namespace Drupal\ls_events_ui\Hook;

use Drupal\Core\Hook\Attribute\Hook;

/**
 * Theme hook implementations for ls_events_ui.
 */
final class LsEventsUiThemeHooks {

  /**
   * Implements hook_theme().
   *
   * Registers the event node suggestions so the module's templates are used
   * for the teaser and full view modes, unless a theme overrides them.
   */
  #[Hook('theme')]
  public function theme(): array {
    return [
      'node__event__teaser' => [
        'base hook' => 'node',
      ],
      'node__event__full' => [
        'base hook' => 'node',
      ],
    ];
  }

}
