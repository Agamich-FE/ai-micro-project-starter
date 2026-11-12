# Agent rules for this project

> Rules file read by the AI agent. Claude Code reads CLAUDE.md; for Cursor or
> other tools, copy or symlink this file to AGENTS.md or .cursor/rules.
> Keep it specific to THIS project and update it as you learn what the agent
> gets wrong. Delete these quoted lines when done.

## Project

- What it is: <one or two sentences>
- Stack: Drupal <11.x>, PHP <8.x>, <Node.js / framework / other tools>
- Local environment: DDEV. Always run PHP, Composer and Drush through `ddev`
  (e.g. `ddev drush cr`, `ddev composer require ...`).

## Commands

- Install site: `<command>`
- Clear cache: `ddev drush cr`
- Run tests: `<command>`
- Lint / static analysis: `<command>`
- Front-end build / watch: `<command>`

## Coding standards

- Follow Drupal coding standards (PHPCS with Drupal and DrupalPractice).
- Use dependency injection in services, controllers, forms and plugins;
  avoid `\Drupal::` static calls in classes.
- Add correct cache metadata (tags, contexts, max-age) to anything rendered.
- Twig: keep logic out of templates; add classes via `attributes.addClass()`.
- JavaScript: Drupal behaviors with `once()`; no jQuery unless already required.
- Accessibility: WCAG 2.2 AA is the minimum.

## Working rules for the agent

- Propose a plan before writing code for anything larger than a small change.
- Do not add new Composer or npm dependencies without asking first.
- Verify that any Drupal API, hook, module or config key you use actually
  exists for the Drupal version above; say so if you are not sure.
- Write or update tests together with the code, and run them.
- Never put secrets in code, config or commits; read them from `.env`.
- Keep commits small, with a clear message describing one change.

## Known pitfalls in this project

- <add things the agent got wrong so it doesn't repeat them>
