#!/usr/bin/env bash
#
# Tests the ls_events recipe on fresh sites (plan step 9).
#
# For each install profile (default: minimal standard):
#   1. reinstall the DDEV site with that profile  (WIPES THE SITE DATABASE)
#   2. apply the recipe, then apply it again; both must exit 0
#   3. run scripts/recipe-assertions.php inside the site
#   4. check /events over HTTP
#   5. on standard: tags vocabulary and content_editor role are unchanged
#
# Stops with a non-zero exit code on the first failure.
#
# Usage: scripts/test-recipe.sh [-y] [profile ...]
#   -y  don't ask before wiping the site database
#
# BASE_URL overrides the site URL (default https://ls-events.ddev.site).

set -euo pipefail

cd "$(dirname "$0")/.."

BASE_URL="${BASE_URL:-https://ls-events.ddev.site}"
RECIPE=recipes/ls_events
assume_yes=0
if [[ "${1:-}" == "-y" ]]; then
  assume_yes=1
  shift
fi
profiles=("${@:-minimal}")
if [[ $# -eq 0 ]]; then
  profiles=(minimal standard)
fi

log_dir="$(mktemp -d)"
trap 'rm -rf "$log_dir"' EXIT

pass() { printf '  \033[32mok\033[0m - %s\n' "$1"; }
fail() {
  printf '  \033[31mnot ok\033[0m - %s\n' "$1" >&2
  exit 1
}

if [[ $assume_yes -eq 0 ]]; then
  read -r -p "This reinstalls the DDEV site (${profiles[*]}) and wipes its database. Continue? [y/N] " answer
  [[ "$answer" == [yY] ]] || { echo "Aborted."; exit 1; }
fi

echo "== Static checks"
if grep -rqE '^uuid:|^_core:' "$RECIPE/config"; then
  fail "recipe config contains uuid or _core keys"
fi
pass "recipe config has no uuid or _core keys"
ddev composer validate --no-check-publish "$RECIPE/composer.json" > "$log_dir/composer.log" 2>&1 \
  || { cat "$log_dir/composer.log"; fail "composer validate $RECIPE/composer.json"; }
pass "recipe composer.json is valid"

config_hash() {
  local json
  json="$(ddev drush config:get "$1" --format=json 2>/dev/null)" || true
  [[ -n "$json" ]] || fail "config $1 not found"
  printf '%s' "$json" | md5sum | cut -d' ' -f1
}

for profile in "${profiles[@]}"; do
  echo "== Profile: $profile"
  ddev drush site:install "$profile" -y > "$log_dir/install.log" 2>&1 \
    || { cat "$log_dir/install.log"; fail "site:install $profile"; }
  pass "fresh $profile site installed"

  if [[ "$profile" == standard ]]; then
    tags_before="$(config_hash taxonomy.vocabulary.tags)"
    editor_before="$(config_hash user.role.content_editor)"
  fi

  for run in 1 2; do
    if ddev drush recipe "../$RECIPE" > "$log_dir/apply.log" 2>&1; then
      pass "recipe apply #$run exits 0"
    else
      cat "$log_dir/apply.log"
      fail "recipe apply #$run on $profile"
    fi
  done

  if ddev drush php:script ../scripts/recipe-assertions.php > "$log_dir/assert.log" 2>&1; then
    sed 's/^/  /' "$log_dir/assert.log"
  else
    sed 's/^/  /' "$log_dir/assert.log" >&2
    fail "assertions on $profile (see above)"
  fi

  status="$(curl -sk -o "$log_dir/events.html" -w '%{http_code}' "$BASE_URL/events")"
  [[ "$status" == 200 ]] || fail "GET /events returned $status"
  pass "GET /events returns 200"
  grep -q 'data-component-id="ls_events_ui:event-card"' "$log_dir/events.html" \
    || fail "/events renders no event-card component"
  pass "/events renders event cards"

  if [[ "$profile" == standard ]]; then
    [[ "$(config_hash taxonomy.vocabulary.tags)" == "$tags_before" ]] \
      || fail "taxonomy.vocabulary.tags changed"
    pass "existing tags vocabulary unchanged"
    [[ "$(config_hash user.role.content_editor)" == "$editor_before" ]] \
      || fail "user.role.content_editor changed"
    pass "existing content_editor role unchanged"
  fi
done

echo "== All checks passed (${profiles[*]})"
