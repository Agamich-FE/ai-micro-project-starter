# ls_events — Drupal Events recipe

> AI micro-project: a Drupal 11.4 Recipe that adds a complete, styled
> Events feature to any fresh site with one command.

## Requirements

- DDEV 1.25+ and Docker
- Node.js 24 on the host (only for the Playwright tests)

## Install and run

```bash
git clone https://github.com/Agamich-FE/ai-micro-project-starter.git ls-events
cd ls-events
ddev start
ddev composer install
ddev drush site:install standard -y
ddev drush recipe ../recipes/ls_events
ddev launch /events
```

Expected result: the "Upcoming events" page with 5 sample events, a
category filter and a "Next events" block. On a fresh clone these steps
took 55 seconds with DDEV images and the Composer cache already
downloaded; a first-ever DDEV run also pulls images, which adds a few
minutes. Log in with `ddev drush uli`.

`minimal` works as well as `standard`. The recipe path is relative to
the docroot `web/`. Applying it a second time changes nothing.

No `.env` is needed: the project uses no secrets.

## How to run tests and checks

```bash
# Recipe test: reinstalls the site (wipes the DB) on minimal and standard,
# applies the recipe twice and runs ~40 assertions per profile.
scripts/test-recipe.sh

# Playwright smoke tests against the running site (on the host).
npm ci && npm run test:e2e:install   # first time only
npm run test:e2e

# PHPCS (Drupal + DrupalPractice) on the module and scripts.
ddev exec vendor/bin/phpcs
```

`BASE_URL=https://… npm run test:e2e` runs the smoke tests against another
site. `scripts/test-recipe.sh -y minimal` skips the prompt and tests one
profile.

## What was built

The recipe `recipes/ls_events/` adds:

- **Event** content type: date range, location, media image, category, body
- **Event category** vocabulary (separate from Tags)
- **Event editor** role: create/edit/delete events, media and Basic HTML,
  no `administer *` permissions
- **View** `ls_events`: `/events` (upcoming only, soonest first, category
  filter, 10 per page) and a "Next 3 events" block placed in the default
  theme
- **Pathauto** pattern `/events/[node:title]`
- **5 sample events** with images and 4 categories (default content)

It composes the core recipes `image_media_type` and
`basic_html_format_editor`, and installs the companion module
`web/modules/custom/ls_events_ui/`. That module holds what a recipe can't:
an `event-card` single-directory component and the event teaser/full
templates.

## Project docs

- [Plan](docs/PLAN.md), with what was done in each step
- [Architecture decision](docs/ADR-001.md): recipe vs install profile vs
  config module
- [Research notes](docs/RESEARCH.md)
- [AI log](docs/AI_LOG.md)
- [Retro](docs/RETRO.md)
- [Agent transcripts](transcripts/)

## Known limitations

- On a site without the Navigation module (e.g. `minimal`), the role's
  `access navigation` permission is dropped and one error is logged per
  apply. This was a deliberate choice (PLAN step 4).
- The "Next 3 events" block's cards use `h2` under the block's own `h2`
  title.
- The `/events` listing caches for 1 hour, so an event can stay listed
  for up to an hour after it starts.
- The Composer package name `custom/ls_events` is a placeholder; the
  recipe isn't published as its own package.
- Only Olivero and Stark were checked; the block region map covers those
  two and falls back to `content` elsewhere.
