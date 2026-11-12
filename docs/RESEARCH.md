# Research notes: Drupal Recipes in Drupal 11.4

Research spike for `ls_events`, done 2026-11-12. Every claim below was
checked in the Drupal 11.4.12 source in this repo (file paths given) and
against the official Recipes Initiative docs. Claims marked **tested** were
also tried on this site.

Sources:

- Drupal.org recipes overview:
  https://www.drupal.org/docs/extending-drupal/drupal-recipes
- Recipes Initiative docs:
  https://project.pages.drupalcode.org/distributions_recipes/recipe.html
- Default content: https://project.pages.drupalcode.org/distributions_recipes/default_content.html
- Config action list: https://project.pages.drupalcode.org/distributions_recipes/config_action_list.html

## 1. Recipe lifecycle (verified order)

Source: `web/core/lib/Drupal/Core/Recipe/RecipeRunner.php::processRecipe()`.

1. **Composed recipes** (`recipes:`) are applied first, recursively, each
   one going through these same steps.
2. **Install** (`install:`). Modules, then themes, are installed in chunks.
   A module's own `config/install` is created, but the recipe's
   `config/` storage overrides it.
3. **Config import** (`RecipeConfigInstaller::installRecipeConfig()`).
   Config from the recipe's `config/` folder and from `config.import` is
   created, **only for names that don't exist yet**
   (`array_diff(recipe, active)`). Fully validatable config is validated.
4. **Config actions** (`config.actions`). These run for every config name,
   on every apply. `${input}` placeholders are replaced first.
5. **Default content** (`content/`). It is imported by
   `DefaultContent\Importer` with `Existing::Skip`: an entity whose UUID
   already exists is skipped, so content is not duplicated on re-apply.
6. A `RecipeAppliedEvent` is fired.

The **strict check** happens earlier still, when the recipe is loaded
(`ConfigConfigurator::__construct()`):

- `strict` defaults to `TRUE` (a core `@todo` mentions changing that
  default).
- Every config file in the recipe that already exists on the site must be
  identical, ignoring `uuid`, `_core`, empty `dependencies` and key order.
- If it isn't identical, the recipe throws `RecipePreExistingConfigException`.
- `strict: false` skips the check (existing config is left alone).
- `strict: [list of names]` checks only the names in the list.

## 2. recipe.yml keys (verified)

Source: `Recipe::parse()` (a Symfony Validator `Collection`). The allowed
keys are:

- `name` (required)
- `description`
- `type`
- `recipes`
- `install`
- `input`: each entry has `data_type`, `description`, `constraints`,
  `prompt` (method `ask`, `askHidden`, `confirm` or `choice`), `form` and
  `default` (source `value`, `config` or `env`)
- `config`: `import`, `strict` and `actions`
- `content`
- `extra`

Any other key fails validation.

## 3. Config actions that really exist in 11.4

Plugins in `web/core/lib/Drupal/Core/Config/Action/Plugin/ConfigAction/`:

- `entity_create`, which gives `create` and `createIfNotExists`
- `create_for_each_bundle`, which gives `createForEach` and
  `createForEachIfNotExists`
- `cloneAs`
- `setProperties`
- `simpleConfigUpdate`
- `permissions_per_bundle`, e.g. `grantPermissionsForEachNodeType`
- `entity_method`: any method marked `#[ActionMethod]`, with a plural form
  generated automatically

The `#[ActionMethod]` methods relevant to us:

- `Role::grantPermission`, plural `grantPermissions`
- `EntityDisplayBase::setComponent` / `setComponents` / `hideComponent` /
  `removeComponent`
- `ConfigEntityBase::set` / `setStatus` / `setThirdPartySetting`
- `FieldConfigBase::setLabel` / `setRequired` / `setSettings` / …
- `Block::setRegion` / `setWeight`

Module-provided actions:

- `placeBlockInDefaultTheme` / `placeBlockInAdminTheme`
  (`block/src/Plugin/ConfigAction/PlaceBlockDeriver.php`)
- `addToAllBundles` (field)
- `addItemToToolbar` (ckeditor5)

Core recipes use, by frequency:

- `grantPermission(s)`
- `createIfNotExists`
- `simpleConfigUpdate`
- `setComponent(s)`
- `setWeight`, `setStatus`, `setRegion`

## 4. Applying twice / existing config (tested)

I tested this with two throwaway recipes on this site (both deleted
afterwards):

| Recipe | 1st apply | 2nd apply |
| --- | --- | --- |
| Ships `user.role.spike_full.yml` **and** grants it an extra permission via `grantPermissions` | OK | **Fails**: "The configuration 'user.role.spike_full' exists already and does not match the recipe's configuration" |
| Same, with `strict: false` | — | OK |
| Role created only by actions: `createIfNotExists` + `grantPermissions` | OK | OK |

Consequences for `ls_events`:

- **Never use a config action on config that the same recipe ships as a
  file.** Put the final values in the YAML file instead. Otherwise, with
  the default `strict: true`, the second apply fails.
- Use config actions only for config owned by someone else: roles, the
  front-end theme's blocks, displays from core recipes.
- Use our own machine names (`event`, `event_category`, `event_editor`), so
  a site that already has Tags or an editor role is unaffected.

## 5. Default content (verified)

- Core has shipped a content exporter since 11.3:
  `php core/scripts/drupal content:export <entity_type> [id]` with
  `--with-dependencies`/`-W`, `--bundle` and `--dir`. Drush 13.8 exposes it
  as `drush content:export`.
  Source: `web/core/lib/Drupal/Core/DefaultContent/Command/ContentExportCommand.php`.
- Format: one YAML file per entity, in `content/<entity_type>/<uuid>.yml`,
  with a `_meta` block (version, entity_type, uuid, bundle,
  default_langcode). See `web/core/recipes/basic_shortcuts/content/`.
- **Content files need UUIDs.** That's how the importer finds references
  and skips existing entities. The "no UUIDs" rule applies only to
  *config*.
- The contrib `default_content` module is only needed on 11.2 and earlier.

## 6. Packaging and Composer (verified)

- A recipe's `composer.json` has `"type": "drupal-recipe"`. The root
  `composer.json` installs that type to `recipes/{$name}`.
- `drupal/core-recipe-unpack` (already a root dependency) **unpacks** a
  required recipe:
  1. its dependencies (e.g. `drupal/pathauto`) are moved into the root
     `composer.json`
  2. the recipe itself is removed from `require`
  3. the recipe stays in `recipes/` so it can be applied

  Source: `vendor/drupal/core-recipe-unpack/README.md`.
- **Recipes contain no code**, so the companion module (SDC component and
  templates) must be a normal module that the recipe lists under
  `install:`.
- `drupal/pathauto` 1.16.0 requires `drupal/core ^10.2 || ^11 || ^12` and
  pulls in `token` and `ctools`.

## 7. Testing a recipe (verified)

- `web/core/tests/Drupal/FunctionalTests/Core/Recipe/RecipeTestTrait.php`
  provides `applyRecipe($path, $expected_exit_code)`. It runs the recipe
  via `core/scripts/drupal` in a separate process, then calls
  `rebuildAll()`. It is meant for `BrowserTestBase` tests, which need
  PHPUnit from `drupal/core-dev` (not installed yet).
- Alternative without new dependencies: a shell script that runs
  `drush site:install`, applies the recipe twice, and checks the result
  with `drush php:eval` / `config:get`.
- Core's own example: `web/core/tests/Drupal/FunctionalTests/Core/Recipe/RecipeCommandTest.php`.
