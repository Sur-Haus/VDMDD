# VDMDD Project

## CRITICAL: Git Safety — Always Pull Before Pushing

Before pushing any changes, ALWAYS:

1. `git fetch origin` — check for new remote commits
2. `git log HEAD..origin/main --oneline` — see if there are commits you don't have
3. If there are new commits, `git pull --rebase origin main` before pushing
4. Review what changed upstream so you don't overwrite collaborators' work

This project has multiple contributors. Overwriting their changes has already happened and must not happen again.

## CRITICAL: source/ is the single source of truth

All project files live in `source/`. Do NOT create duplicate files at the repo root. The root level only contains `.git/`, `.github/`, `.gitignore`, `.claude/`, and `misc media/`.

GitHub Actions CI deploys from `source/` via the `entryPoint: source` setting in the workflow files.

## CRITICAL: Firebase Deploy Safety

**Firebase project ID: `vdmdd-c7404`**

The global Firebase CLI often defaults to `sur-haus` (a completely different project/site). Deploying to the wrong project OVERWRITES that site.

### Rules

1. **ALWAYS** use `--project vdmdd-c7404` on every `firebase` command. No exceptions.
2. **ALWAYS** deploy from the `source/` directory: `cd source && firebase deploy --project vdmdd-c7404`
3. **NEVER** run `firebase deploy` from the repo root — there is no `firebase.json` at the root.
4. **Before running any `firebase` command**, run `firebase use` and verify the output. If it says anything other than `vdmdd-c7404`, the `--project` flag is mandatory.
5. **NEVER** run `firebase use <project>` to switch the global default — it affects all projects on this machine.

### Deploy checklist

```bash
# 1. Verify project
firebase use
# If output is NOT vdmdd-c7404, you MUST use --project flag

# 2. Deploy from source/ only
cd source
firebase deploy --project vdmdd-c7404
```

## Repo Structure

```
VDMDD/                  (git root)
  .github/workflows/    — CI deploy (uses entryPoint: source)
  .claude/              — Claude Code config
  .gitignore
  misc media/           — reference images
  source/               — ALL project files live here
    CLAUDE.md           — this file
    .firebaserc
    firebase.json
    firestore.rules
    public/             — hosted static files
      index.html
      games/
      images/
      404.html
```

## Firestore

- Campaign document: `campaigns/vdmdd-2026`
- Donor schema: `{ firstName, city, amount, recurring }`
- Goals: 100 donations, $5,000 raised
- Rules: read-only for clients
