# Plan

> Agent version, written 2026-11-12, committed unchanged. My review edits
> follow in a separate commit and are listed at the bottom.

## Goal

Apply one command to a fresh Drupal 11.4 site (minimal or standard):

```bash
ddev drush recipe ../recipes/ls_events
```

The result is a working, styled Events feature:

- an Event content type
- an Event category vocabulary
- an Event editor role
- an upcoming events page with a category filter and a pager
- a "Next 3 events" block
- Pathauto URL aliases
- an Event card component
- 5 sample events

Applying the recipe a second time gives no errors. Tests prove all of
this.

## Approach

A Drupal Recipe plus a small companion module, as in
[ADR-001](ADR-001.md); facts are in [RESEARCH.md](RESEARCH.md).

- `recipes/ls_events/`:
  - `recipe.yml`, `composer.json` (`drupal-recipe`)
  - `config/` holds *our own* config only: node type, fields, displays,
    vocabulary, view, Pathauto pattern
  - `content/` holds the sample content
- `web/modules/custom/ls_events_ui/` holds the code a recipe can't:
  - the `event-card` SDC component
  - node teaser/full templates
  - CSS

  The recipe installs it via `install:`.
- Reuse core recipes: `image_media_type`, `basic_html_format_editor`.
- Config actions only for config we don't own:
  - `user.role.event_editor`: `createIfNotExists` + `grantPermissions`
  - block placement: `placeBlockInDefaultTheme`
  - text format permission: comes from the core recipe

### Content model (proposed names)

| Item | Machine name | Type / notes |
| --- | --- | --- |
| Content type | `event` | title, body, revisions on |
| Date | `field_event_date` | **daterange** (`datetime_range`), start + end in one field, required |
| Location | `field_event_location` | plain text (string, 255); no Address module, to avoid another dependency |
| Image | `field_event_image` | entity reference → media `image`, media library widget |
| Category | `field_event_category` | entity reference → taxonomy `event_category` (own vocabulary, so we never touch `tags`) |
| Body | `body` | text with summary, shared storage `field.storage.node.body` as core's page/article recipes do |
| Role | `event_editor` | create/edit/delete own + any `event`, view own unpublished, access content overview, use media library, create media `image`, use `basic_html`, access toolbar. **No** `administer *` permissions |
| View | `ls_events` | page `/events` (start date ≥ now, sorted ascending, exposed `field_event_category` filter, full pager, 10 per page) and block `next_3` (3 items, no pager) |
| Pathauto | `pathauto.pattern.event` | `/events/[node:title]` |
| View modes | `teaser`, `full` (default) | both rendered with the `event-card` component in different variants |

## Decisions I need from you before building

> 2026-11-12: all three recommendations approved by me (Pathauto,
> Playwright and Coder yes, core-dev no; module in `web/modules/custom`;
> single daterange field).

1. **Dependencies** (CLAUDE.md says to ask first):
   - `drupal/pathauto` (+ `token`, `ctools`): required by the task. Recommended yes.
   - `@playwright/test` (npm, dev): required by the task. Recommended yes.
   - `drupal/coder` (dev, PHPCS): for linting the module. Recommended yes.
   - `drupal/core-dev` (dev, PHPUnit): only needed for core's
     `RecipeTestTrait`. Recommended **no**; use the scripted test in
     step 9 instead (lighter, and it covers minimal and standard
     installs).
2. **Module location:** `web/modules/custom/ls_events_ui` in this repo.
   The recipe's `composer.json` lists `drupal/pathauto`. Publishing the
   module and recipe as their own Composer packages is optional extra
   work.
3. **Date field:** a single daterange field (recommended) instead of two
   separate datetime fields.

## Steps

Each step is one small commit and is verified before the next step
starts.

1. [ ] **Add dependencies** agreed above.
   `ddev composer require drupal/pathauto`,
   `ddev composer require --dev drupal/coder`, and
   `npm init` + `npm i -D @playwright/test`.
2. [ ] **Hand-build the prototype** on the current standard site, via
   the admin UI (by me or by the agent with drush):
   - apply the core recipes `image_media_type` and
     `basic_html_format_editor`
   - build the content type, fields, displays, vocabulary, role, view
     and Pathauto pattern
3. [ ] **Export and clean config.**
   1. `ddev drush config:export` to a temp folder.
   2. Copy only the Events files into `recipes/ls_events/config/`.
   3. Strip `uuid`, `_core` and site-specific values.
   4. Drop the role file (it is created by actions).
   5. **I review every YAML file kept.**
4. [ ] **Write `recipe.yml`:**
   - `recipes:` image_media_type, basic_html_format_editor
   - `install:` node, taxonomy, datetime_range, media_library, views,
     path, pathauto, ls_events_ui
   - `config.strict:` list only our own field storages
   - `config.actions:` the role, block placement
   - `composer.json` with `"type": "drupal-recipe"`

   Run `ddev composer validate recipes/ls_events/composer.json`.
5. [ ] **First apply check.** Fresh `site:install minimal`, apply, apply
   again. Then the same with `standard`, which already has `tags` and
   `content_editor`. Fix and log every import error in AI_LOG.
6. [ ] **Companion module `ls_events_ui`:**
   - `.info.yml` (core ^11)
   - `components/event-card/` (`event-card.component.yml` with a props
     schema, `.twig`, `.css`)
   - `templates/node--event--teaser.html.twig` and
     `node--event--full.html.twig`, which embed the component
   - `hook_theme` suggestions only if templates aren't picked up
     automatically. Core SDC is used; do **not** enable the obsolete
     `sdc` module.
   - Cache metadata stays on the node render array.
   - Accessible markup: `<article>`, heading level, `<time datetime>`,
     image alt from media.
7. [ ] **Default content:**
   1. Create 5 events (dates relative to 2026-11, all in the future,
      except optionally one past event to prove the filter), 3–4
      categories and 5 images.
   2. Export them with `drush content:export node --bundle=event -W`
      into `recipes/ls_events/content/`, with file attachments.
   3. Check the `--dir` path base on the first run.
8. [ ] **Re-apply and robustness check:**
   - apply twice on minimal and on standard
   - check that content isn't duplicated (`Existing::Skip`)
   - `grep -rE "^uuid:|_core:" recipes/ls_events/config` returns
     nothing
9. [ ] **Recipe test script** `scripts/test-recipe.sh`. For each of
   `minimal` and `standard`:
   1. `site:install`
   2. apply the recipe, then **apply it again** (each must exit 0)
   3. run assertions via `drush php:eval`/`config:get`:
      - node type, fields and vocabulary exist
      - 5 event nodes
      - the view has `page` + `next_3`
      - the alias pattern exists and an event has an alias
      - `event_editor` has `create event content` and does **not** have
        `administer site configuration` / `administer nodes`

   It exits non-zero on the first failure. Prove it by breaking one
   assertion on purpose.
10. [ ] **Playwright smoke test** `tests/e2e/events.spec.ts` against
    `https://ls-events.ddev.site`:
    - `/events` shows ≥ 1 event card with a title, date and link
    - the category filter narrows the results
    - an event's alias URL opens the full view

    `playwright.config.ts` sets `ignoreHTTPSErrors` for DDEV's local CA.
11. [ ] **Lint:** PHPCS (Drupal, DrupalPractice) on the module, clean.
12. [ ] **Docs:**
    - README install/run in under 5 minutes, timed on a fresh clone
    - AI_LOG
    - RETRO
    - transcripts
    - remove placeholders and `HOW_TO_USE_THIS_TEMPLATE.md`

Optional, only if time is left: a recipe `input` for the listing path;
a second recipe `ls_events_registration` that extends `ls_events`.

## How each part will be verified

| Part | Verification |
| --- | --- |
| Recipe applies on fresh site | `scripts/test-recipe.sh` (minimal + standard), exit 0 |
| Second apply | same script, applied twice, exit 0 |
| Existing Tags / editor role | standard-profile run of the script; `tags` and `content_editor` untouched (config hash before/after) |
| Clean config | `grep` for `uuid` / `_core` in `config/` = 0 hits; manual review of every file |
| Editor permissions | script assertions + manual login as a test editor: can create/edit an event, gets 403 on `/admin/config` |
| Listing and block | Playwright test + manual check of the block on Olivero and on Claro/minimal (Stark) |
| Styled output | screenshot on Olivero and Stark; Playwright checks the card markup |
| Module code quality | PHPCS clean |
| Composer packaging | `composer validate` on the recipe's `composer.json` |

## Risks and unknowns

- **`field.storage.node.body` strictness.** On `standard` it already
  exists. If our copy differs, the default strict check fails. → Export
  it from a standard site (as core's page recipe ships it), keep it
  identical, and test on standard in step 5.
- **Shared view modes / `image_media_type` config may differ on
  standard.** Core already handles this in its own recipes. → Covered
  by the step 5 test.
- **Content export of media files.** The exporter copies attachments,
  but I haven't tried it yet. → Try it in step 7 early, with one event.
- **Daterange in Views.** The "start date ≥ now" filter needs the
  datetime views filter with the `now` offset. → Check in the prototype
  (step 2) before exporting.
- **Block placement on any theme.** `placeBlockInDefaultTheme` uses the
  theme that is the default at apply time. → Confirm on Olivero and
  Stark.
- **Time box.** If over budget, drop the optional extras first, then
  reduce Playwright to a single assertion.

## My changes to the agent's plan

- <what you changed and why>
