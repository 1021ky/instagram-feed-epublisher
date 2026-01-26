# Copilot Instructions

## Logging policy

We use LogTape + Winston for structured, multi-level logging. Refer to this policy whenever you add or adjust logs:

### Levels
- **error**: user-facing failures or unexpected exceptions. Log the problem, relevant identifiers (request ID, user/provider), and any upstream status/text. Avoid verbose data or secrets.
- **info**: successful major events (`EPUB` generation, feed retrieval, login success). Include counts, sanitized metadata, or duration. These logs should always exist so that monitoring dashboards can show system health.
- **debug**: detailed context for troubleshooting (request params, token lengths, branch decisions). Do not include full tokens or secrets; redaction (e.g., log length only) is required.

### Message format
- Use `logger.category("component")` to keep logs grouped, and include the component name (e.g., `instagram.graph-client`, `auth.session-service`, `api.epub`).
- Keep the message concise and place variable data inside metadata objects so logs remain machine-readable.
- Mask secrets: never log raw tokens, only lengths or masked versions such as `accessTokenLength`.

### Environmental behavior
- `LOG_LEVEL` controls the minimum severity. Default is `info`; set it to `debug` when running locally via `pnpm dev` to capture richer context.
- Logs always go to stdout so cloud platforms can capture them. When running locally, additionally write to `webapp/logs/YYYY-MM-DD.log` so you can inspect past runs.
- Daily rotation for local files is handled by the date-based filename. Production environments rely on the platform's log retention, so no explicit rotation logic is required.

### Implementation checklist
1. Choose the lowest severity necessary to describe the event (`info` for milestones, `debug` for diagnostics, `error` for failures).
2. Populate structured metadata with identifiers (route, user ID, hashtags) instead of embedding them into the message string.
3. Keep log messages user-neutral—detail belongs in the metadata.
4. Follow existing category conventions and do not duplicate similar log entries without reason.
5. Consult this policy before adding new logs so future maintainers can follow the same pattern.