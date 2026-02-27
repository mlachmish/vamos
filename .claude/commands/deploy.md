# Deploy to Production

Deploy the Vamos app to Vercel production.

## Steps

1. **Run unit tests** (`npx vitest run`) — abort if any fail
2. **Check git status** — warn if there are uncommitted changes and ask whether to continue
3. **Push to GitHub** — push current branch to origin if there are unpushed commits
4. **Deploy** — run `npx vercel --prod --yes`
5. **Report** — show the production URL and confirm deployment succeeded

## Rules
- If tests fail, stop and report the failures. Do not deploy broken code.
- If there are uncommitted changes, ask the user before proceeding.
- Always show the final production URL at the end.
- The production URL is: https://vamos-padel.vercel.app

User's request: $ARGUMENTS
