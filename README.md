# <Project name>

> AI micro-project: <one-line description of what this project does>

## Requirements

- DDEV <version> and Docker
- Node.js <version> (if the project has a front-end build)
- <any other tools, e.g. Figma account, API key>

## Install and run

```bash
git clone <repo-url>
cd <repo>
cp .env.example .env        # fill in local values, never commit .env
ddev start
ddev composer install
ddev drush site:install -y  # or: the project's install command
# <build / seed / recipe / import commands>
ddev launch
```

Expected result: a working site in under 5 minutes.

## How to run tests and checks

```bash
# <unit / kernel / functional tests>
# <Playwright / Lighthouse / lint / static analysis>
```

## What was built

- <feature 1>
- <feature 2>

## Project docs

- [Plan](docs/PLAN.md)
- [Architecture decision](docs/ADR-001.md)
- [AI log](docs/AI_LOG.md)
- [Retro](docs/RETRO.md)
- [Agent transcripts](transcripts/)

## Known limitations

- <what doesn't work yet or was out of scope>
