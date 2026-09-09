# PhyhanAgro — Frontend Security Architecture

The backend is the single source of truth for authentication, authorization,
ownership, verification and MFA. Everything described here is an additional UX /
defense-in-depth layer. No security decision is ever made from client state.

## Trust model

- Roles, verification status, account state and MFA status are read only from
  `GET /api/auth/me`. They are never stored, inferred or edited client-side.
- No mock users, mock roles or local-only permission flags exist anywhere.
- Guards fail closed: unknown state renders a loader, then redirects.

## Session handling

- Access token in `localStorage` (`phyhan.token`), refresh token in
  `phyhan.refreshToken`, MFA challenge token in `phyhan.mfaToken`.
- The MFA challenge token is never treated as a session; it authorizes only
  `POST /api/auth/mfa/verify-login`.
- On any `401`, the client attempts a single silent refresh via
  `POST /api/auth/refresh` and replays the request. If refresh fails, all
  credentials are wiped and a `phyhan:session-expired` event ends the session.
- Login, refresh and MFA verification are excluded from retry to prevent loops.

## Multi-factor authentication

- `POST /api/auth/login` may return `mfaRequired`; the UI then shows a code step
  and calls `/auth/mfa/verify-login`.
- Admins and super admins cannot use the console until `mfaEnabled` is true —
  `AdminRoute` redirects them to `/admin/security` to enroll
  (`/auth/mfa/setup` → `/auth/mfa/enable`).
- Super admins can reset a locked-out account's MFA via
  `POST /api/admin/users/:id/reset-mfa`.

## Admin portal separation

- The console lives at `/admin/*` with its own layout, its own entry point
  (`/admin/login`) and no marketplace or affiliate navigation.
- Legacy `/dashboard/admin/*` paths redirect to `/admin`.
- Non-admins hitting `/admin/*` receive a neutral 404 — the portal's existence is
  not disclosed.
- `/admin/team` and `/admin/config` are super-admin only.
- Admins are created by invitation only (`/admin/admin-users/invite` →
  `/accept-admin-invite`). There is no admin self-signup path in the UI.

## Restricted network / VPN

IP allow-listing and VPN enforcement are backend/infrastructure concerns and
cannot be implemented in the browser. The client detects a `403` whose payload
mentions IP/network/VPN and renders the "Restricted network" screen instead of a
generic error.

## Verification workflow

Farmers, riders and affiliates follow APPLICATION → VERIFICATION → APPROVAL.
`VerifiedRoute` keeps unverified operational accounts out of dashboards while the
marketplace stays accessible; approval is reported by the backend only.

## Product workflow

Farmers manage their own inventory status only. Publication is governed by
`adminStatus`, which is read-only for farmers and controlled by admins through
`PATCH /api/admin/products/:id/admin-status`.

## Communication

Direct buyer↔farmer/rider chat is removed. All cross-party communication is
mediated by the support desk (`/support/tickets`, `/admin/support/tickets`), so
every exchange is attributable and reviewable.

## Auditability

`/admin/audit-logs` and `/admin/security-events` surface backend-recorded
privileged actions, failed logins, MFA failures and blocked access attempts.

## Error handling

`classifyError` maps responses to `unauthenticated | forbidden |
network_restricted | mfa_required | not_found | conflict | rate_limited |
server | network`. Security-sensitive statuses always render generic copy so
backend internals are never leaked.

## Remaining risks / backend dependencies

- Tokens live in `localStorage`; httpOnly refresh cookies would be stronger and
  require a backend change.
- Admin IP allow-listing, rate limiting and session revocation must be enforced
  server-side.
- The UI assumes `mfaEnabled` is present on `/auth/me`; without it, MFA
  enforcement for admins cannot be surfaced.
