# Feature Specification: User Login & Session

**Feature Branch**: `003-user-login` **Created**: 2026-08-01 **Status**: Draft **Input**: Retro-spec written to cover existing, previously unspecified and untested behaviour — credential sign-in, route protection, and role/client scoping.

---

## Why this spec exists

Login was implemented without a spec and without any test coverage. A stale `issuer-portal/tests/helpers/auth.ts` existed but was imported by zero specs and described a sign-in UI (per-user "Login as …" buttons) that no longer exists. This spec captures the behaviour as built so it can be regression-tested.

## User Scenarios

1. **Signing in** — An issuer opens the portal, is sent to the login screen, enters their username and password, and lands in the portal scoped to their own client.
2. **Getting it wrong** — A user mistypes their password, is told the credentials are invalid, and stays on the login screen with no session.
3. **Arriving deep-linked while signed out** — A user opens a bookmarked meeting URL without a session and is sent to the login screen rather than seeing a flash of protected content.
4. **Multi-client users** — A CSM, solicitor, or parent-client user signs in and can reach every client in their assigned list, not just one.

## Functional Requirements

- **FR-001**: Unauthenticated requests to any non-public route MUST redirect to `/login`. Public paths are `/login`, `/api/*`, `/_next/*`, `/favicon.ico`, and the Sentry tunnel route `/monitoring`.
- **FR-002**: The redirect MUST happen before protected content renders, so no authenticated-looking UI flashes for a signed-out visitor.
- **FR-003**: Valid credentials MUST establish a session and land the user in the portal.
- **FR-004**: Invalid credentials MUST surface the message "Invalid credentials" and MUST NOT establish a session.
- **FR-005**: An unknown username MUST be rejected identically to a wrong password — the response MUST NOT reveal whether the username exists.
- **FR-006**: Username and password MUST both be required before submission.
- **FR-007**: While a sign-in is in flight the submit control MUST be disabled and show a pending state.
- **FR-008**: A signed-in user's session MUST carry their `type` (ISSUER, ADMIN, PARENT_CLIENT, SOLICITOR, CSM) and the client ticker(s) they may access.
- **FR-009**: Single-client users (ISSUER) MUST be scoped to their one `client_ticker`. Multi-client users (CSM, SOLICITOR, PARENT_CLIENT) MUST be scoped to their `clientTickers` list.
- **FR-010**: When `NEXT_PUBLIC_BYPASS_AUTH` is `true`, route protection is disabled and the `bypass`/`bypass` credential pair signs in as the role named by `NEXT_PUBLIC_BYPASS_USER_ROLE`. This is a development affordance and MUST remain off in production. Note it short-circuits only _route protection_ and the `bypass`/`bypass` pair — real credentials still authenticate normally while it is on.
- **FR-011**: After a successful sign-in the client MUST fully reload so session, SWR, and router caches are rebuilt rather than reused from the signed-out state.

## Key Entities

- **Mock user directory** (`issuer-portal/auth.ts`) — username, password, `type`, `account_id`, `client_ticker`, `clientTickers`. Credentials are compared in plaintext against this map; there is no user database behind login.
- **Session token** — JWT strategy, 30-day `maxAge`, refreshed every 24h. `clientTickers` is re-read from the live directory on every token refresh so ticker-list changes apply without re-login.

## Validation

Covered by `issuer-portal/tests/e2e/login.spec.ts` — form rendering, rejected credentials, account-enumeration resistance, successful sign-in, and per-user client scoping — via the helpers in `issuer-portal/tests/helpers/auth.ts`.

**FR-001 and FR-002 are currently unverified.** `issuer-portal/.env`, which is tracked in git, sets `NEXT_PUBLIC_BYPASS_AUTH=true`, so route protection is off in local development: an unauthenticated deep link renders the protected page instead of redirecting to `/login`. `proxy.ts` reads that flag server-side, so it cannot be toggled per test. The route-protection test skips itself rather than reporting a false pass — run with `NEXT_PUBLIC_BYPASS_AUTH=false` to exercise it.

## Known Gaps (not yet requirements)

- No sign-out control was found in the app shell, so sign-out is unspecified and untested. If one exists in the design-system app bar it needs a contract here.
- Passwords are stored and compared in plaintext in a source file. Acceptable for a prototype with mock users; must not survive into anything handling real credentials.
