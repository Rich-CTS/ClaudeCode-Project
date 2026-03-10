Your goal is to update any vulnerable dependencies.

Do the following:

1. Run 'npm audit' to find vulnerable installed packages in this project
2. Run 'npm audit fix' to apply updates (non-breaking only)
3. Run tests and verify the updates didn't break anything

**Do not run `npm audit fix --force`** — this would upgrade `ai` from 4.x to 6.x, a breaking change requiring a large migration.
The `ai` and `jsondiffpatch` moderate advisories are known and intentionally suppressed via `audit-level=high` in `.npmrc`. Leave them as-is.