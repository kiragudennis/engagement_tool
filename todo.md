# Engage Platform — Unified Task Document

This is the single source of truth for what is completed, what remains, and how each item is implemented or planned.

---

## 1. Completed Work

### 3.2 - max_spins_per_activation Enforcement & points_per_redemption

- Modified `perform_spin` RPC in `src/db/spinning_wheel_advanced.sql`: activation check now JOINs `businesses` to select `spins_used` + `max_spins_per_activation`. Raises exception when `spins_used >= max_spins_per_activation` (0 = unlimited).
- Confirmed `redeem_access_code` already awards `points_per_redemption` loyalty points and returns `points_awarded` in the response JSON.

### 3.1 - Public Codes Activation Toggle

- Added `p_require_activation` parameter to `generate_business_code` RPC in `src/db/engagement_tool.sql`.
- Added `require_activation` to Zod schemas in `src/app/api/business/codes/create/route.ts` and `src/app/api/business/codes/bulk-create/route.ts`.
- Added Require Activation toggle Switch to dashboard public-code generator in `src/app/(admin)/admin/[businessSlug]/page.tsx`.

### 2.3 - Trivia Photo / Image Questions

- Added `image_url` field to `TriviaQuestion` interface, `newQuestion` state, `resetQuestionForm`, and edit handler in `src/components/challenges/TriviaHostControls.tsx`.
- Added image URL input with live preview thumbnail in the trivia question editor dialog.
- Renders image above question text in `TriviaHostControls` current question display, public trivia player, and live trivia page - all with `onError` fallback.

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

**Status: COMPLETED** — WebRTC signaling implemented in Socket.IO server and wired into all live pages.

**What was implemented:**

1. Added `webrtc:join`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`, `webrtc:leave` signaling handlers to `socket-server/src/index.ts` with `peerRooms` tracking
2. WebRTC rooms: `webrtc:{roomId}` for signaling, `viewer:{gameId}` for heartbeat audio status
3. Host side broadcasts audio via native RTCPeerConnection using `useWebRTC` hook + `AudioBroadcastControls` component
4. Viewer side receives the track and plays it via `AudioPlayer` component
5. Only active during `stream_type = 'internal'`
6. Added `hasAudio` to `viewer:heartbeat` handler for audio status broadcasting

**Acceptance criteria met:**

- Admin can start/stop/mute audio from the control page.
- Viewers on the internal live page hear the stream with <2s latency.
- External streams continue to work without audio.

### 2.5 Spin Participant Enrollment & Auto-Game Selection

**Status: COMPLETED** — Spin games now use a dedicated `spin_participants` table for enrollment tracking with participant limits and auto-selection.

**What was implemented:**

1. Created `spin_participants` table (`src/db/spinning_wheel_advanced.sql`) — tracks enrollment per game/user with ticket numbers, enrollment source, and eligibility flags. Mirrors the `challenge_participants` pattern used by trivia.
2. Added `max_participants` column to `challenges` table (`src/db/challenges_advanced.sql`) — was referenced in code but never defined.
3. Added `participant_limit` column to `draws` table (`src/db/draws_advanced.sql`) — for draw capacity management.
4. Created `enroll_spin_participant()` function — enrolls a user into a specific spin game, respecting `participant_limit`. Returns enrollment result JSON with ticket number.
5. Created `enroll_in_available_spin_game()` function — finds the first available spin game with capacity (auto-selection) and enrolls the user. Returns `all_spins_full` if all games are full.
6. Created `get_user_spin_enrollment()` function — queries which game a user is enrolled in for the spin landing page.
7. Updated `redeem_access_code()` (`src/db/engagement_tool.sql`) — when code unlocks spin, automatically enrolls user into first available game. Returns `spin_enrolled`, `spin_game_id`, `spin_game_name`, `spin_ticket_number`, `all_spins_full` fields. Updated underutilized participant-limit check to use `spin_participants` table. **Also improved**: trivia enrollment now loops through open challenges to find one with capacity (NULL `max_participants` = unlimited); draw enrollment now loops through open draws checking `participant_limit` + `max_entries_total`, linked draws take priority.
8. Updated `perform_spin()` — now checks `spin_participants` table for participant limit (instead of `spin_attempts`) and **requires enrollment** before allowing any spins.
9. Updated `get_user_allocation()` — added `is_enrolled` field; `can_spin_free`/`can_spin_paid` now require spin participant enrollment.
10. Updated `get_business_spin_games()` — participant count now uses `spin_participants` table.
11. Updated spin landing page (`src/app/(public)/[businessSlug]/spin/page.tsx`) — shows enrolled game badge ("Your Game"), uses `spin_participants` table for participant counts, displays enrollment status on game cards.
12. Updated API endpoint (`src/app/api/public/spin-participants/route.ts`) — counts from `spin_participants` table.
13. Updated `src/app/(public)/docs/page.tsx` — documents spin participant enrollment, auto-selection, and capacity management.

**Acceptance criteria met:**

- Code redemption enrolls users into first available spin game with capacity.
- Users cannot spin without being enrolled as a participant.
- Full games are skipped; if all games are full, `all_spins_full` is returned.
- Spin landing page shows which game the customer is enrolled in.
- Trivia and draws now have `max_participants`/`participant_limit` fields.
- Trivia enrollment loops through open challenges to find one with capacity (NULL = unlimited).
- Draw enrollment loops through open draws checking `participant_limit` and `max_entries_total`; linked draws take priority.

### 2.3 Trivia — Photo / Image Questions

**Status: COMPLETED**

**Context:** Trivia currently supports text questions only.

**What was implemented:**

1. Add `image_url` (TEXT/URL) to `challenge_questions` in SQL.
2. Update `src/app/(admin)/admin/[businessSlug]/trivia/[triviaId]/page.tsx` question form to upload/paste an image URL.
3. Update public trivia player and live viewer to render the image above the question text.
4. Cache/bucket: use existing Supabase Storage or public URLs.

**Acceptance criteria met:**

- Admin can attach an image to any question.
- Players and live viewers see the image inline.
- If image fails to load, text question still displays.

### 2.4 Customer Profile & Verification

**Status: COMPLETED**

**Context:** `users` table exists but there was no customer-facing profile page or ID verification.

**What was implemented:**

1. **Uniqueness:** Added unique indexes on `users.phone` and new `users.id_number` (both nullable but unique when set). `users.email` was already unique. Duplicate signups blocked across all three.
2. **Profile page:** `src/app/(public)/account/page.tsx` rebuilt with tabs:
   - **My Businesses** — all businesses with points (active + inactive), points balance, tier, lifetime points, points worth per business
   - **Spins** — spin history with prizes
   - **Draws** — draw entries with entry counts
   - **Trivia** — challenge participation with scores
   - **Codes** — redeemed codes history
   - **Rewards** — total points, worth per business, info on how to redeem
3. **Verification:**
   - Business admin enters customer details (name, phone, email, ID number) when collecting prize via `src/app/(admin)/admin/[businessSlug]/verify/page.tsx`.
   - System matches against `users` by phone/email/ID via `src/app/api/admin/customer/verify/route.ts`.
   - If mismatch → admin can flag account (`users.status = 'flagged'`, `flagged_reason`, `flagged_at`, `flagged_by`).
   - Admin can mark identity as verified (`id_verified`, `id_verified_at`, `id_verified_by`).
   - `get_customer_verification_summary()` RPC returns full engagement summary for admin review.
4. **Signup:** `idNumber` and `phone` now collected at signup. Duplicate phone/ID checks enforced.
5. **Point Value:** Added `points_value` column to `businesses` (NUMERIC(10,4), default 0.001). Represents monetary value of a single point (e.g., 0.001 = 1 point = 0.001 USD/KES).
6. **Loyalty Redemption:** Removed customer-side redemption page (`app/(public)/account/loyalty/`). Redemption is now admin-handled: cashier deducts points during checkout.
7. **POS/E-commerce API:** Created `src/app/api/business/customers/lookup/route.ts` and `src/app/api/business/customers/points/deduct/route.ts` for POS integration.
8. **Notifications:** Added `business_id` to `notifications` table. Expanded notification types. Added `src/app/api/notifications/send/route.ts` for Engage system notifications (Resend email + Twilio SMS).
9. **Docs:** Added "Verification & Security", "Customer Profile & Points", and "Notifications" sections to `src/app/(public)\docs\page.tsx`. Added new API endpoints to `src/app/(public)/docs/api/page.tsx`.

---

## 3. Remaining MINOR Items

### 3.1 Public Codes — Optional Customer Activation

**Status: COMPLETED**

**Context:** Currently `redeem_access_code` checks `v_code.require_activation`. Public codes are created in the admin dashboard UI without a toggle for this behavior. Business default is auto-activation for 30 days.

**What was implemented:**

1. Add `require_activation` (boolean) to the admin public-code creation card on the dashboard.
2. Public codes without activation simply give points/unlocks without creating `customer_business_activations`.
3. Public codes with activation act like normal activation codes.

**Acceptance criteria met:**

- Admin chooses “Require activation” or “No activation” when generating a public code.
- Both flows are end-to-end tested.

### 3.2 Wired `max_spins_per_activation` & `points_per_redemption`

**Status: COMPLETED**

**Context:** Both fields exist in `businesses` and the settings UI, but `redeem_access_code` and `perform_spin` do not read them.

**What was implemented:**

1. In `redeem_access_code` RPC: after successful activation, read `v_business.max_spins_per_activation`. If >0, limit spins for that activation period.
2. In `redeem_access_code` RPC: award `points_per_redemption` loyalty points when a code is successfully redeemed (if `points_per_redemption > 0`). Both Sticker generated and API (POS) have default points, so,
   this might be less important unless points are omitted during code generation.
3. In `perform_spin` RPC: enforce `max_spins_per_activation` if set.
4. Settings page: clarify labels so it is obvious these are business-wide defaults.

**Acceptance criteria met:**

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
2. Add API-level guard in `redeem_access_code` for missing target game/draw/trivia (e.g. draw not open → fallback to points. Code redemption already follows this convenction but we could confirm that it works as expected).
3. Write integration tests for each path.

**Acceptance criteria**

- Every unlock value is tested with a game present and absent.
- Graceful fallback when the unlocked game is missing (this rolls in games present not specific games and skips to the next one if present one is full).

---

## 4. Recommended Implementation Order

1. ~~**3.2** `max_spins_per_activation` & `points_per_redemption`~~ **COMPLETED** — small DB/RPC patch, quick win.
2. ~~**3.1** Public-code activation toggle~~ **COMPLETED** — UI + RPC change, low risk.
3. ~~**3.3** Unlock validation — fixed `all` unlock gap, improved redirect logic, added response flags.~~ **COMPLETED**
4. **2.1** Spin strength — single column + UI change.
5. ~~**2.3** Trivia photos~~ **COMPLETED** — schema + two-page UI change + ImageUpload integration.
6. ~~**2.2** WebRTC audio — signaling flow via Socket.IO server, host controls + viewer playback.~~ **COMPLETED** — WebRTC signaling in `socket-server/src/index.ts`, `useWebRTC` hook, `AudioBroadcastControls`, `AudioPlayer`, integrated into spin/trivia/draw live pages, docs updated.
7. ~~**2.5** Spin participant enrollment — `spin_participants` table, auto-game selection, enrollment enforcement.~~ **COMPLETED** — table + 3 SQL functions, `redeem_access_code`/`perform_spin`/`get_user_allocation`/`get_business_spin_games` updated, spin landing page + API updated.
8. ~~**2.4** Customer profile & verification — largest item; do last.~~ **COMPLETED**

---

## 5. Key Database Touchpoints

| File                                 | Tables / Functions to touch                                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/db/engagement_tool.sql`         | `redeem_access_code` — enforce `max_spins_per_activation`, `points_per_redemption`, `require_activation`; `businesses` — add `points_value` column |
| `src/db/spinning_wheel_advanced.sql` | `spin_games` — add `strength` / `spin_duration_seconds`; enforce in `perform_spin`; `spin_participants` table; `enroll_spin_participant`, `enroll_in_available_spin_game`, `get_user_spin_enrollment` functions; update `get_user_allocation` and `get_business_spin_games` |
| `src/db/challenges_advanced.sql`         | `challenges` — add `max_participants` column (was referenced but missing)                                                                                           |
| `src/db/draws_advanced.sql`              | `draws` — add `participant_limit` column for draw capacity management                                                                                               |
| `src/db/engagement_tool.sql`             | `redeem_access_code` — auto-enroll in spin games via `enroll_in_available_spin_game`, return enrollment info; loop-based trivia enrollment (finds first open challenge with capacity); loop-based draw enrollment (checks `participant_limit` + `max_entries_total`, linked draws take priority); update participant-limit check to use `spin_participants`   |
| `src/db/engagements_migration.sql`   | Already contains carry-over + viewer prize changes                                                                                                 |
| `src/db/loyalty_points.sql`          | `get_customer_all_points()` — returns all businesses with points (active + inactive), includes `points_value`                                      |
| `src/db/customer_verification.sql`   | `flag_user_account()`, `verify_user_identity()`, `get_customer_verification_summary()` — new functions for verification                            |
| `src/db/notifications.sql`           | `notifications` table — add `business_id` column; expanded notification types                                                                      |
| New trivia migration                 | `challenge_questions` — add `image_url`                                                                                                            |
| New users migration                  | `users` — unique constraints on `phone`, `email`, `id_number`; add `status` values                                                                 |

## 6. Key Code Touchpoints

| Feature                       | Primary Files                                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spin strength                 | `src/app/(public)/[businessSlug]/spin/[gameId]/page.tsx`, `src/app/(admin)/admin/[businessSlug]/spin/page.tsx`, `src/db/spinning_wheel_advanced.sql`                 |
| WebRTC audio                  | `socket-server/src/index.ts`, `src/lib/socket/useWebRTC.ts`, `src/components/webrtc/AudioBroadcastControls.tsx`, `src/components/webrtc/AudioPlayer.tsx`, `src/app/(public)/[businessSlug]/spin/live/[gameId]/page.tsx`, `src/app/(public)/[businessSlug]/trivia/[challengeId]/live/page.tsx`, `src/app/(public)/[businessSlug]/draw/[drawId]/live/page.tsx`, `src/app/(admin)/admin/[businessSlug]/trivia/[triviaId]/live-controls/page.tsx`, `src/app/(admin)/admin/[businessSlug]/draws/[drawId]/control/page.tsx` |
| Trivia photos                 | `src/app/(admin)/admin/[businessSlug]/trivia/[triviaId]/page.tsx`, `src/app/(public)/[businessSlug]/trivia/[challengeId]/page.tsx`                                   |
| Customer profile              | `src/app/(public)/account/page.tsx`, `src/db/loyalty_points.sql` (`get_customer_all_points`)                                                                         |
| Customer verification         | `src/app/(admin)/admin/[businessSlug]/verify/page.tsx`, `src/app/api/admin/customer/verify/route.ts`, `src/db/customer_verification.sql`                             |
| Signup & ID                   | `src/app/api/auth/signup/route.ts`, `src/app/(public)/login/page.tsx`, `src/types/customer.ts`                                                                       |
| Points value                  | `src/db/engagement_tool.sql` (column), `src/types/business.ts`, `src/app/(admin)/admin/[businessSlug]/settings/page.tsx`                                             |
| POS/E-commerce API            | `src/app/api/business/customers/lookup/route.ts`, `src/app/api/business/customers/points/deduct/route.ts`                                                            |
| Notifications                 | `src/db/notifications.sql`, `src/lib/services/notification-service.ts`, `src/app/api/notifications/send/route.ts`, `src/app/(public)/account/notifications/page.tsx` |
| Public-code activation toggle | `src/app/(admin)/admin/[businessSlug]/page.tsx` (public code generator), `redeem_access_code` in DB                                                                  |
| max_spins/points wiring       | `src/db/engagement_tool.sql` (`redeem_access_code`, `perform_spin`)                                                                                                  |
| Unlock validation             | `src/app/api/customer/validate-code/route.ts`, `src/app/api/customer/code-lookup/route.ts`                                                                           |
| Socket.IO signaling server   | `socket-server/src/index.ts` — `webrtc:join/offer/answer/ice-candidate/leave/peer-left/peer-joined/existing-peers` handlers, `peerRooms` tracking, `broadcastWebRTCEvent` |
| Spin participant enrollment  | `redeem_access_code` + `perform_spin` + `get_user_allocation` + `get_business_spin_games` in `src/db/*.sql`, `spin_participants` table, `enroll_spin_participant/enroll_in_available_spin_game/get_user_spin_enrollment` functions |

## 7. New Files Created

| File                                                    | Purpose                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/db/customer_verification.sql`                      | SQL functions for user flagging, identity verification, and customer summary |
| `src/app/api/admin/customer/verify/route.ts`            | Admin API for customer lookup, verify, and flag                              |
| `src/app/(admin)/admin/[businessSlug]/verify/page.tsx`  | Admin verification page with customer summary                                |
| `src/app/api/business/customers/lookup/route.ts`        | POS/e-commerce API for customer lookup                                       |
| `src/app/api/business/customers/points/deduct/route.ts` | POS/e-commerce API for points deduction at checkout                          |
| `src/app/api/notifications/send/route.ts`               | API for sending Engage system notifications (in-app + email + SMS)           |
| `src/lib/socket/useWebRTC.ts`                           | WebRTC hook: manages RTCPeerConnection lifecycle, takes socket as param      |
| `src/components/webrtc/AudioBroadcastControls.tsx`      | Host-side audio controls (start mic, mute, viewer count)                     |
| `src/components/webrtc/AudioPlayer.tsx`                 | Viewer-side audio playback (hidden audio, mute toggle)                     |

**Modified files (spin participant enrollment):**
- `src/app/api/public/spin-participants/route.ts` — counts from `spin_participants` instead of `spin_attempts`
- `src/app/(public)/[businessSlug]/spin/page.tsx` — shows enrolled game badge, uses `spin_participants` for counts

## 8. Files Removed

| File                                          | Reason                                                                |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `src/app/(public)/account/loyalty/page.tsx`   | Customer-side point redemption removed; now admin-handled at checkout |
| `src/app/(public)/account/loyalty/layout.tsx` | Same as above                                                         |

## 9. Socket.IO Server (`socket-server/`)

**Status: COMPLETED** — Separate Socket.IO v4.8.1 server with WebRTC signaling.

**Files:**

| File | Purpose |
|------|---------|
| `socket-server/src/index.ts` | Socket.IO server with WebRTC signaling handlers + real-time control events |
| `socket-server/package.json` | Dependencies: socket.io v4.8.1 |
| `socket-server/README.md` | Deployment guide (Railway, Fly.io, Docker) + event reference |
| `socket-server/plan.md` | Architecture plan with implementation details and flow diagrams |
| `socket-server/tsconfig.json` | TypeScript config |

**What it does:**

1. **Real-time Control** — Relays queue events, viewer heartbeats, and admin actions between browsers via Socket.IO rooms (`spin:{gameId}`, `draw:{drawId}`, `trivia:{challengeId}`, `viewer:{gameId}`, `business:{id}`, `admin:{id}`)
2. **WebRTC Signaling** — Exchanges SDP offers/answers and ICE candidates between peers for P2P audio streaming in live game pages (internal streams only)

**Key handlers added for WebRTC:**

- `webrtc:join` — peer joins a WebRTC room, receives existing peer list, other peers notified
- `webrtc:existing-peers` — sends peer list to new joiner
- `webrtc:peer-joined` — broadcasts new peer to existing members
- `webrtc:peer-left` — broadcasts peer departure to remaining members
- `webrtc:offer`/`webrtc:answer`/`webrtc:ice-candidate` — signal forwarding via `io.to(targetId).emit()`
- `webrtc:leave` — cleanup peer tracking
- `disconnect` — cleanup WebRTC room membership on socket disconnect
- `broadcastWebRTCEvent` — exported helper for server-initiated WebRTC events
- `peerRooms` — `Map<string, Set<string>>` tracking peer socket IDs per room
