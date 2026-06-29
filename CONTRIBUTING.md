# Contributing to HAL Module Builder

Thanks for your interest in contributing! This project uses a simple,
disciplined GitHub workflow.

- **Trunk branch:** `master` (stable baseline)
- **One issue → one branch → one PR**
- **Branch naming:** `<type>/<short-description>` (e.g. `feature/appearance-panel`)
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`)
- **Merge policy:** squash-merge; delete the branch after merge
- **CI:** lint, type-check, tests, and build must pass

## Quick PR protocol (CLI)

```bash
# 1) Create a branch from up-to-date master
git checkout master
git pull --ff-only origin master
git checkout -b feature/<short-name>

# 2) Make changes, then validate locally
npm run quality   # type-check + lint + format check
npm test

# 3) Push and open a PR
git push -u origin feature/<short-name>
gh pr create --base master --title "<title>" --body "<summary>"

# 4) Merge and sync
gh pr merge --squash --delete-branch
git checkout master && git pull --ff-only origin master
```

## Before you open a PR

- `npm run quality` passes (type-check, lint, format).
- `npm test` passes.
- `npm run build` succeeds.
- No secrets, API keys, or personal data are committed.
