# Playwright E2E Directory Rules (`webapp/e2e/`)

Whenever you read, create, or modify any file in `webapp/e2e/`, you **MUST** follow these mandatory rules without exception:

1. **Mandatory Authoring SOP**:
   - Before writing or modifying any E2E test (`*.spec.ts`), Page Object (`pages/*.ts`), or fixture (`fixtures/*.ts`), you **MUST** read and follow [`.agent/skills/playwright-e2e-authoring/SKILL.md`](../../.agent/skills/playwright-e2e-authoring/SKILL.md) (`playwright-e2e-authoring.sop.md`).
2. **Mandatory Self-Review SOP**:
   - After implementing or updating E2E code and before concluding your task, you **MUST** read and execute [`.agent/skills/playwright-e2e-self-review/SKILL.md`](../../.agent/skills/playwright-e2e-self-review/SKILL.md) (`playwright-e2e-self-review.sop.md`).
3. **Mechanical Static Analysis Enforcement (`oxlint`)**:
   - All files in `webapp/e2e/` are checked by `oxlint` using [`webapp/scripts/oxlint-plugin-playwright.mjs`](../scripts/oxlint-plugin-playwright.mjs).
   - You **MUST** run `pnpm lint` and `pnpm --filter instagram-feed-epublisher-webapp exec tsc --noEmit` to verify zero errors.
   - You **MUST NOT** bypass any `playwright-best-practices/*` lint rules with disable comments.
