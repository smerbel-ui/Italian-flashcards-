#!/bin/bash
# Commit and push Fluent progress after each Claude reply. Quiet; never blocks Claude.
cd "$(dirname "$0")" || exit 0
[ -z "$(git status --porcelain)" ] && exit 0
git add -A
git commit -qm "Progress $(date -u '+%Y-%m-%d %H:%M UTC')" || exit 0
for i in 1 2 3; do git push -q origin HEAD:fluent-progress >/dev/null 2>&1 && break; sleep $((i * 2)); done
exit 0
