# PhyhanAgro Frontend Refactor — Backend-Driven Batch Architecture

This is a large refactor touching ~30+ files across types, hooks, pages, and navigation. Proposing a staged plan to keep changes reviewable.

## Stage 1 — Foundation (Config + Types)

**New types** (`src/types/`):
- `config.ts` — `ConfigItem`, `SystemConfig` keyed map
- `batch.ts` — `ParentOrder`, `Batch`, `FarmerGroup`, `BatchStatus`, `SLAState`
- `announcement.ts` — `Announcement`, `AnnouncementType`, `AnnouncementPriority`
- Extend `User` with `emailVerified`, `emailVerifiedAt`

**New hooks**:
- `useSystemConfig.ts` — fetches `/system-config` once, caches in React Query (stale: Infinity), exposes `useConfig(key, fallback)` selector. Replaces all hardcoded delivery/tax/fee constants.
- `useAnnouncements.ts` — `/announcements/my`, dismiss mutation
- `useEmailVerification.ts` — status, request, verify OTP, resend
- `useBatchOrders.ts` — parent orders + batches per role
- `useGroupedCart.ts` — derives `GroupedCart[]` by `farmerId` from existing cart

**Remove hardcoded constants** in `Checkout.tsx`, `Cart.tsx`, fee calculators — replace with `useConfig("DELIVERY_BASE_FEE")` etc.

## Stage 2 — Cart + Checkout (Batch Submission)

- `Cart.tsx`: render items grouped by farmer with subgroup headers ("Farmer A — 2 items"), keep existing add/remove UX
- `Checkout.tsx`: show batch preview (one card per farmer group), submit to `POST /orders/bulk`, redirect to ParentOrder page
- Display backend-computed `subtotal / deliveryFee / grandTotal` only; remove client-side math

## Stage 3 — Batch-First Order UI

**Buyer**:
- `pages/marketplace/Orders.tsx` → list ParentOrders
- New `pages/marketplace/ParentOrderDetails.tsx` → tabs/cards per Batch with status, SLA, rider, route map placeholder

**Farmer** (`pages/dashboard/`):
- Rename `FarmerOrders.tsx` → `FarmerBatches.tsx`: only batches assigned to this farmer (pickup location, SLA deadline, status actions: READY / PICKED_UP / COMPLETED)
- Add `FarmerPickupCenter.tsx`, `FarmerSLA.tsx`
- Remove buyer-level/multi-farmer data from farmer views

**Rider**:
- `RiderDeliveries.tsx` → `RiderBatches.tsx`: active batch routes with ordered farm stops, destination, Mapbox route, SLA. Lock route once pickup starts.

## Stage 4 — Announcements + Notifications + Soft Email

- New `pages/Announcements.tsx` at `/announcements`: feed, type filter, pinned, read/unread, dismiss
- Extend `NotificationsBell` to merge announcements + system notifications into one feed (types: `announcement`, `verification_reminder`, `system_alert`)
- New `pages/auth/EmailVerification.tsx` (optional flow) + dashboard banner `EmailVerificationBanner.tsx` — never blocks navigation
- Update `ProtectedRoute` / `VerifiedRoute`: **remove any email-verification gating**; keep affiliate KYC gating only
- After signup, show non-blocking toast: "Verify your email to receive updates (optional)"

## Stage 5 — SLA Badges + Product Availability

- New `components/marketplace/SLABadge.tsx` → renders `READY_NOW | EXPRESS_READY | DELAYED_HARVEST` with availability window from product `availableFrom` / `deadlineHours`
- Use in `ProductCard.tsx` and `ProductDetails.tsx`

## Stage 6 — Admin Configuration UI

- New `pages/dashboard/AdminConfig.tsx`: table of config items grouped by category, inline edit per type (string/number/boolean/json), bulk save → `POST /admin/configuration/bulk-update`, reset-to-default button
- New `pages/dashboard/AdminAnnouncements.tsx`: list, create, schedule, publish, archive

## Stage 7 — Navigation

Update `DashboardLayout.tsx` + `MarketplaceNavbar.tsx`:

```text
Buyer:    Marketplace · Cart · Orders · Announcements · Notifications
Farmer:   Batch Orders · Pickup Center · SLA · Earnings
Rider:    Active Batches · Route Map · History
Admin:    System Config · Announcements · Users · Analytics
```

Remove deprecated nav entries (single Orders for farmer/rider, etc.).

## Technical Notes

- Backend not deployed yet — all new hooks point at the documented endpoints; calls will 404 until backend ships. Will gate UI behind empty/loading states so the app still renders.
- Cart endpoint already remote (`/users/me/cart`); keep as-is, grouping happens client-side until backend returns `GroupedCart`.
- No business logic in components: every fee/threshold reads from `useConfig`.
- Keep i18n keys; add new ones under `announcements.*`, `batches.*`, `config.*`, `email.*`.

## Files Touched (high level)

- New: ~14 files (types, hooks, pages, components above)
- Edited: `App.tsx`, `Cart.tsx`, `Checkout.tsx`, `Orders.tsx`, `FarmerOrders.tsx`, `RiderDeliveries.tsx`, `NotificationsBell.tsx`, `DashboardLayout.tsx`, `MarketplaceNavbar.tsx`, `ProtectedRoute.tsx`, `VerifiedRoute.tsx`, `ProductCard.tsx`, `ProductDetails.tsx`, `types/index.ts`, i18n locale files

## Suggested Execution Order

I'll ship in 2 batches to keep the preview functional:
1. **Batch 1**: Stages 1, 2, 4 (foundation, cart/checkout grouping, soft email + announcements feed)
2. **Batch 2**: Stages 3, 5, 6, 7 (batch dashboards, SLA badges, admin config UI, nav)

Confirm and I'll start Batch 1, or tell me to reorder/trim scope.
