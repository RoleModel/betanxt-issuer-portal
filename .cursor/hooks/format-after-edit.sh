#!/bin/bash
# Auto-format files edited by the agent with oxfmt (same tool the pre-commit
# hook enforces via `pnpm run fmt:check`), so commits don't get blocked.
input=$(cat)
file_path=$(echo "$input" | jq -r '.file_path // empty')

[ -z "$file_path" ] && exit 0
[ ! -f "$file_path" ] && exit 0

# Only format JS/TS files; skip generated and vendored paths.
case "$file_path" in
  *node_modules*|*/generated*|*.d.ts) exit 0 ;;
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

cd "$(dirname "$0")/../.." || exit 0
pnpm exec oxfmt "$file_path" >/dev/null 2>&1

exit 0
