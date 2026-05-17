#!/usr/bin/env bash
set -euo pipefail

# Publish helper for ui-context-grab.
#
# Usage:
#   bash scripts/publish.sh alpha
#   bash scripts/publish.sh latest
#   bash scripts/publish.sh -h
#
# Behavior:
#   alpha  - bump prerelease version with "alpha" preid, then publish with the alpha dist-tag.
#   latest - bump patch version, then publish with npm's default latest dist-tag.
#
# Safety checks:
#   - npm registry must be the official npm registry.
#   - git working tree must be clean before version bump and publish.
#   - npm's prepublishOnly hook still runs registry check and library build before publish.

readonly OFFICIAL_REGISTRY="https://registry.npmjs.org/"
readonly CHANNEL="${1:-}"

print_help() {
  cat <<'EOF'
Usage:
  bash scripts/publish.sh alpha
  bash scripts/publish.sh latest
  bash scripts/publish.sh -h

Commands:
  alpha   Bump prerelease version with "alpha" preid and publish with --tag alpha.
  latest  Bump patch version and publish to npm's default latest tag.

Equivalent package scripts:
  pnpm publish:alpha
  pnpm publish:latest

Before publishing:
  npm config set registry https://registry.npmjs.org/
  npm login
  git status --short

Safety checks:
  - Fails if npm registry is not https://registry.npmjs.org/
  - Fails if the git working tree is not clean.
  - npm prepublishOnly runs pnpm check:registry and pnpm build.
EOF
}

if [[ "${CHANNEL}" == "-h" || "${CHANNEL}" == "--help" ]]; then
  print_help
  exit 0
fi

if [[ "${CHANNEL}" != "alpha" && "${CHANNEL}" != "latest" ]]; then
  print_help >&2
  exit 1
fi

REGISTRY="$(npm config get registry)"
if [[ "${REGISTRY}" != "${OFFICIAL_REGISTRY}" ]]; then
  echo "npm registry must be ${OFFICIAL_REGISTRY} before publishing. Current registry: ${REGISTRY}" >&2
  echo "Run: npm config set registry ${OFFICIAL_REGISTRY}" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree must be clean before publishing." >&2
  echo "Commit or stash local changes first." >&2
  git status --short >&2
  exit 1
fi

if [[ "${CHANNEL}" == "alpha" ]]; then
  npm version prerelease --preid alpha
  npm publish --access public --tag alpha
else
  npm version patch
  npm publish --access public
fi
