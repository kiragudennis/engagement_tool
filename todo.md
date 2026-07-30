# Engage Platform — Unified Task Document

This is the single source of truth for what is completed, what remains, and how each item is implemented or planned.

---

## 1. Completed Work

### Plan Limits, Billing & Carry-Over

- Added `maxPublicCodes` to `PlanLimits` and all tiers: trial=0, starter=50, pro=500, enterprise=unlimited.
- Added `canCreatePublicCode()` hook in `src/lib/hooks/usePlanLimit.ts`.
- Enforced per-type caps in `src/app/api/business/codes/create/route.ts` and `bulk-create/route.ts`.
- Implemented no-downgrade policy in `src/app/(admin)/admin/[businessSlug]/billing/page.tsx` using tier tracking on both monthly and early-bird plans. Downgrade attempts are blocked with a toast error.
- Added `plan_carryover` JSONB column and SQL functions `calculate_plan_carryover()`, `get_effective_plan_limit()`, `apply_plan_carryover()` in `src/db/engagements_migration.sql`.
- Wired carry-over into `activateBusinessSubscription()` in `src/lib/services/paystack.ts` so limits carry forward on plan changes.

### Admin Dashboard

- Rebuilt `src/app/(admin)/admin/[businessSlug]/page.tsx` to show 10 stat cards: Engagements, Spins, Trivia, Draw Entries, Code Redemptions, Sticker Codes, POS Codes, Public Codes, Viewers, Prizes Claimed.
- Each card shows current value against plan limit.
- Public-code usage bar with color-coded progress and upgrade CTA when ≥70%.
- Added inline public-code generator on the dashboard (label + unlocks selector).
- Removed unused `totalSpins`/`todaySpins` queries.

### Viewer Prize System

- Created `src/components/viewer/ViewerPrizeClaimButton.tsx` with smooth framer-motion animation.
- Added to live pages: spin, draw, trivia.
- Simplified flow: `viewer_engagements` table dropped from schema. Claim now goes directly through `viewer_prize_claims`.
- Updated `claim_viewer_prize` RPC to reject when `max_total_claims` is reached (first-N-wins).
- New API endpoint at `src/app/api/business/viewer/claim/route.ts`.
- Admin draw control page (`src/app/(admin)/admin/[businessSlug]/draws/[drawId]/control/page.tsx`) now has a Viewer Prize Setup card (prize type, value, max total claims, enable/disable).

### Draws Fixes

- Removed all `draw_groups` references from `src/app/(admin)/admin/[businessSlug]/draws/page.tsx` because the table does not exist in the database. Draws are Business-scoped only; customers enroll via redeem codes.

### Plan Limit Banner

- `src/components/billing/PlanLimitBanner.tsx` now also warns about public-code usage when ≥80% with an upgrade CTA.

---

## 2. Remaining MAJOR Items

### 2.1 Spin Wheel — Strength Affects Rotation Duration

**Context:** Currently `src/app/(public)/[bus\inessSlug]/spin/[gameId]/page.tsx` hardcodes `duration = 5` seconds. Admin spin page has no strength/power input.

**What needs to happen:**

1. Add `strength` (or `spin_duration_seconds`, `power`) column to `spin_games` table. Range 1–10 or 1–100 mapped to duration (e.g. 2s–8s).
2. Admin spin form: add a slider/number input for wheel strength under Advanced settings.
3. Public spin page: replace hardcoded `duration = 5` with the game's configured strength, or let the UI pass a charge factor.
4. Live broadcast page should also honor the strength-based duration.

**Acceptance criteria**

- Admin can set wheel strength per game.
- Higher strength → longer spin animation.
- Value is persisted in DB and loaded on the public page.

### 2.2 Real-Time Audio via WebRTC for Internal Streams (Spins, Trivia, Draws)

**Context:** Socket.IO server exists (`socket-server/src/index.ts`) but audio transport is not implemented. Only HTML text/state events travel over sockets today.

**What needs to happen:**

1. Add a lightweight signaling channel over existing Socket.IO rooms: `audio:offer`, `audio:answer`, `ice-candidate`.
2. Rooms: `audio:spin:{gameId}`, `audio:trivia:{challengeId}`, `audio:draw:{drawId}`.
3. Admin side broadcasts a live audio track via WebRTC (e.g. using `simple-peer` or native RTCPeerConnection).
4. Viewer side receives the track and plays it in the live page.
5. Only active during `stream_type = 'internal'`.

**Acceptance criteria**

- Admin can start/stop audio from the control page.
- Viewers on the internal live page hear the stream with <2s latency.
- External streams continue to work without audio.

### 2.3 Trivia — Photo / Image Questions

**Context:** Trivia currently supports text questions only.

**What needs to happen:**

1. Add `image_url` (TEXT/URL) to `challenge_questions` in SQL.
2. Update `src/app/(admin)/admin/[businessSlug]/trivia/[triviaId]/page.tsx` question form to upload/paste an image URL.
3. Update public trivia player and live viewer to render the image above the question text.
4. Cache/bucket: use existing Supabase Storage or public URLs.

**Acceptance criteria**

- Admin can attach an image to any question.
- Players and live viewers see the image inline.
- If image fails to load, text question still displays.

### 2.4 Customer Profile & Verification

**Context:** `users` table exists but there is no customer-facing profile page or facial/ID verification.

**What needs to happen:**

1. **Uniqueness:** Add unique indexes/constraints on `users.phone`, `users.email`, and a new `users.id_number` (or national ID). Prevent duplicate signups across all three.
2. **Profile page:** New public page `src/app/(public)/account/**` showing:
   - Active businesses
   - Codes redeemed (history)
   - Spins played
   - Wins / losses
   - Points balance (customer-to-business)
3. **Verification:**
   - Business admin enters customer details (name, phone, email, ID number) when collecting prize.
   - System matches against `users` by phone/email/ID.
   - If facial features don't match stored avatar → flag account (`users.status = 'flagged'`).
   - Once entered, critical fields (`id_number`, `phone`, `email`) become immutable.
4. **Prize collection flow:** Admin terminal/button to verify identity against account.

**Acceptance criteria**

- One customer = one account enforced by phone+email+ID uniqueness.
- Admin can verify winner identity in the control panel.
- Mismatch triggers account flag and support review.
- Customer can view their own profile.

---

## 3. Remaining MINOR Items

### 3.1 Public Codes — Optional Customer Activation

**Context:** Currently `redeem_access_code` checks `v_code.require_activation`. Public codes are created in the admin dashboard UI without a toggle for this behavior. Business default is auto-activation for 30 days.

**What needs to happen:**

1. Add `require_activation` (boolean) to the admin public-code creation card on the dashboard.
2. Public codes without activation simply give points/unlocks without creating `customer_business_activations`.
3. Public codes with activation act like normal activation codes.

**Acceptance criteria**

- Admin chooses “Require activation” or “No activation” when generating a public code.
- Both flows are end-to-end tested.

### 3.2 Wired `max_spins_per_activation` & `points_per_redemption`

**Context:** Both fields exist in `businesses` and the settings UI, but `redeem_access_code` and `perform_spin` do not read them.

**What needs to happen:**

1. In `redeem_access_code` RPC: after successful activation, read `v_business.max_spins_per_activation`. If >0, limit spins for that activation period.
2. In `redeem_access_code` RPC: award `points_per_redemption` loyalty points when a code is successfully redeemed (if `points_per_redemption > 0`).
3. In `perform_spin` RPC: enforce `max_spins_per_activation` if set.
4. Settings page: clarify labels so it is obvious these are business-wide defaults.

**Acceptance criteria**

- Redeeming a code grants `points_per_redemption` points.
- Spinning more than `max_spins_per_activation` times within the activation period is blocked.

### 3.3 Validate Code Unlock End-to-End

**Context:** `unlocks` values already include `points`, `spin`, `draw`, `trivia`, `spin_draw`, `trivia_draw`. Admins need confidence each path works when the corresponding game exists and when it does not.

**What needs to happen:**

1. Test matrix:
   - Code `unlocks: 'spin'` → redirects to spin, awards spin points.
   - Code `unlocks: 'trivia'` → redirects to trivia, adds participant.
   - Code `unlocks: 'draw'` → enters user into active/open draw.
   - Code `unlocks: 'points'` → awards loyalty points only.
2. Add API-level guard in `redeem_access_code` for missing target game/draw/trivia (e.g. draw not open → fallback to points).
3. Write integration tests for each path.

**Acceptance criteria**

- Every unlock value is tested with a game present and absent.
- Graceful fallback when the unlocked game is missing.

---

## 4. Recommended Implementation Order

1. **3.2** `max_spins_per_activation` & `points_per_redemption` — small DB/RPC patch, quick win.
2. **3.1** Public-code activation toggle — UI + RPC change, low risk.
3. **3.3** Unlock validation — testing + guards, stabilizes existing flow.
4. **2.1** Spin strength — single column + UI change.
5. **2.3** Trivia photos — schema + two-page UI change.
6. **2.2** WebRTC audio — new signaling flow, test in staging.
7. **2.4** Customer profile & verification — largest item; do last.

---

## 5. Key Database Touchpoints

| File                                 | Tables / Functions to touch                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `src/db/engagement_tool.sql`         | `redeem_access_code` — enforce `max_spins_per_activation`, `points_per_redemption`, `require_activation` |
| `src/db/spinning_wheel_advanced.sql` | `spin_games` — add `strength` / `spin_duration_seconds`; enforce in `perform_spin`                       |
| `src/db/engagements_migration.sql`   | Already contains carry-over + viewer prize changes                                                       |
| New trivia migration                 | `challenge_questions` — add `image_url`                                                                  |
| New users migration                  | `users` — unique constraints on `phone`, `email`, `id_number`; add `status` values                       |

---

## 6. Key Code Touchpoints

| Feature                       | Primary Files                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spin strength                 | `src/app/(public)/[businessSlug]/spin/[gameId]/page.tsx`, `src/app/(admin)/admin/[businessSlug]/spin/page.tsx`, `src/db/spinning_wheel_advanced.sql`       |
| WebRTC audio                  | `socket-server/src/index.ts`, `src/app/(public)/[businessSlug]/spin/live/[gameId]/page.tsx`, `src/app/(public)/[businessSlug]/draw/[drawId]/live/page.tsx` |
| Trivia photos                 | `src/app/(admin)/admin/[businessSlug]/trivia/[triviaId]/page.tsx`, `src/app/(public)/[businessSlug]/trivia/[challengeId]/page.tsx`                         |
| Customer profile              | New pages under `src/app/(public)/account/**`, `src/lib/supabase/admin` verification flow, admin prize-verification modal                                  |
| Public-code activation toggle | `src/app/(admin)/admin/[businessSlug]/page.tsx` (public code generator), `redeem_access_code` in DB                                                        |
| max_spins/points wiring       | `src/db/engagement_tool.sql` (`redeem_access_code`, `perform_spin`)                                                                                        |
| Unlock validation             | `src/app/api/customer/validate-code/route.ts`, `src/app/api/customer/code-lookup/route.ts`                                                                 |
