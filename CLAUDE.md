# Agent rules for this project

## Project

- What it is: a sandbox Drupal 11 site used to build `ls_events`, a Drupal
  Recipe. Applying it to a fresh site adds a complete Events feature:
  - Event content type, category taxonomy and an Event editor role
  - a View with an upcoming events page and a "Next 3 events" block
  - Pathauto URL aliases
  - a companion module with an Event card SDC component and teaser/full
    templates
  - 5 sample events as default content
- Stack: Drupal 11.4 (drupal/recommended-project), PHP 8.4, Drush 13,
  MariaDB 11.8, Node.js 24 (Playwright tests).
- Local environment: DDEV, project name `ls-events`,
  URL https://ls-events.ddev.site. Always run PHP, Composer and Drush
  through `ddev` (e.g. `ddev drush cr`, `ddev composer require ...`).
- Ticket and acceptance criteria: see `docs/PLAN.md` and `docs/ADR-001.md`.

## Project layout

- `recipes/ls_events/` — our recipe (`recipe.yml`, `composer.json` with
  `"type": "drupal-recipe"`, `config/`, `content/`). Tracked in git; other
  directories in `recipes/` are Composer-installed and ignored.
- `web/modules/custom/ls_events_ui/` — companion module (SDC component,
  templates, CSS).
- `web/core/recipes/` — core recipes; use them as the reference for correct
  recipe syntax and config actions.
- `scripts/` — helper scripts (e.g. recipe apply test).
- `tests/` — Playwright smoke test.
- `docs/` — ADR, plan, AI log, retro. `transcripts/` — exported sessions.

## Commands

- Start environment: `ddev start`
- Install fresh site: `ddev drush site:install minimal -y` (or `standard`)
- One-time login link: `ddev drush uli`
- Apply the recipe: `ddev drush recipe ../recipes/ls_events`
  (path is relative to the docroot `web/`)
- Clear cache: `ddev drush cr`
- Export config from the prototype: `ddev drush config:export -y`
- Run recipe test: `scripts/test-recipe.sh` (added in plan step 9)
- Run Playwright smoke tests (on the host, not in DDEV):
  `npm run test:e2e`. First time: `npm ci && npm run test:e2e:install`.
  Other site: `BASE_URL=https://… npm run test:e2e`.
- Lint: `ddev exec vendor/bin/phpcs` (uses `phpcs.xml.dist`, which covers
  `web/modules/custom` with Drupal + DrupalPractice). Auto-fix:
  `ddev exec vendor/bin/phpcbf`.

## Coding standards

- Follow Drupal coding standards (PHPCS with Drupal and DrupalPractice).
- Use dependency injection in services, controllers, forms and plugins;
  avoid `\Drupal::` static calls in classes.
- Add correct cache metadata (tags, contexts, max-age) to anything rendered.
- Twig: keep logic out of templates; add classes via `attributes.addClass()`.
- JavaScript: Drupal behaviors with `once()`; no jQuery unless already required.
- Accessibility: WCAG 2.2 AA is the minimum.

## Recipe rules

- Config files in `recipes/ls_events/config/` must have no `uuid`, no
  `_core` keys and no site-specific values. Every file must belong to the
  Events feature.
- Compose existing core recipes (e.g. `image_media_type`,
  `basic_html_format_editor`) instead of copying their config.
- Change config that may already exist (roles, permissions, existing
  vocabularies) through config actions in `recipe.yml`, not full config
  files. Use, for example, `createIfNotExists` + `grantPermissions` for the
  Event editor role.
- Never invent a config action. Before using one, find its plugin in
  `web/core/lib/Drupal/Core/Config/Action/Plugin/ConfigAction/` (or an
  entity method marked `#[ActionMethod]`) or an example in
  `web/core/recipes/`. Say so if you could not verify it.
- The recipe must apply cleanly twice and on a `standard` install (which
  already has a Tags vocabulary and a content editor role). Use our own
  machine names (`event`, `event_category`, `event_editor`) to avoid
  clashes.
- After every change to the recipe, apply it to a fresh site and report the
  result.

## Working rules for the agent

- Propose a plan before writing code for anything larger than a small change.
- Do not add new Composer or npm dependencies without asking first.
- Verify that any Drupal API, hook, module or config key you use actually
  exists for Drupal 11.4; say so if you are not sure.
- Write or update tests together with the code, and run them.
- Never put secrets in code, config or commits; read them from `.env`.
- Keep commits small, with a clear message describing one change.

## Known pitfalls in this project

- `ddev composer create-project` refuses to run in a non-empty directory;
  the starter files had to be moved out and back in.
- Composer has no `-y` option (that is a Drush flag).
- `strict` defaults to TRUE: a config action on config that the same
  recipe ships as a file makes the second apply fail (tested). Put the
  final values in the YAML file; use actions only for config the recipe
  doesn't ship. See docs/RESEARCH.md §4.
- Default *content* files must keep their UUIDs (file name and `_meta`).
  The "no UUIDs" rule is for config only.
- Recipes can't contain code: PHP, Twig and SDC files go in the companion
  module, installed via `install:`.
- Export content with `ddev drush content:export node --bundle=event -W
  --dir=../recipes/ls_events/content` (core exporter, 11.3+; not tried
  yet, so check where the relative `--dir` path ends up). Don't add
  the contrib `default_content` module.
