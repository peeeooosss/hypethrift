# HypeThrift Development Memory

## Session Summary
**Date:** September 6, 2026
**Objective:** Seller welcome bonus (2 free listings) + share links for seller marketing
**Status:** Implemented, not committed. Awaiting `prisma generate` + `prisma db push` in a working terminal.

---

## This Session — Free Listings + Share Links

### Feature 1: New seller welcome bonus (2 free listings)
- **Schema:** Added `freeListingsGranted Boolean @default(false)` to `User` (one-time guard; re-approval never double-grants)
- **Constant:** `FREE_LISTINGS = 2` in `src/lib/platform.ts`
- **Grant points:** `grantFreeListings()` called in `approveSeller` + `changeUserRole` (`src/actions/admin-actions.ts`) — atomic `UPDATE ... WHERE freeListingsGranted = false`
- **UI:** Welcome-bonus banner with remaining credits on seller dashboard; note on credits page
- **Seed:** Demo sellers set `freeListingsGranted: true` so re-seeds don't re-grant

### Feature 2: Share links (seller marketing)
- **NEW** `src/components/seller/ShareButton.tsx` (client) — Share (navigator.share / clipboard fallback w/ "Copied!") + WhatsApp (`wa.me/?text=` prefilled with title + ₹price + URL)
- Per-listing share buttons appear only for public statuses: ACTIVE, UPCOMING, ENDED, SOLD
- Placement: dashboard Recent Listings, listings table Actions, upcoming item cards

### ⚠️ Prisma CLI REGRESSION (this machine deprecated `### Prisma CLI Workaround`)
- Previous session workaround (`node node_modules/prisma/build/index.js <cmd> </dev/null`) **now hangs too** (even `--version`). All heavy JS module loads are very slow/hanging in this sandbox (Next build, tsc, prisma CLI, even `node -e 'require("typescript")'` never exits on its own).
- **Workaround used:** new-column reads/writes go through parameterized raw SQL (`$queryRaw`/`$executeRaw`) — works without regenerating the client:
  - `grantFreeListings()` → `UPDATE "User" SET ...`
  - dashboard + credits pages → `SELECT "listingCredits", "freeListingsGranted"`
- **Requires manual steps in a working terminal:**
  ```bash
  node node_modules/prisma/build/index.js generate </dev/null   # or: npx prisma generate
  node node_modules/prisma/build/index.js db push </dev/null    # or: npx prisma db push
  ```
- Reverting `freeListingsGranted` from the schema/seed is NOT required — the raw SQL paths work whether or not the generated client includes the field.

### Verified
- All 8 changed/new files pass `ts.transpileModule` (syntax check, same method as prior session) — "ALL TRANSPILE OK"
- `git diff --check` clean
- Full `next build` / `next lint` / `tsc` **could not be run** (tooling hangs in this sandbox)

---

## Session Summary
**Date:** August 27, 2026
**Objective:** Implement Upcoming Listings feature across all portals for HypeThrift auction marketplace
**Final Commit:** `8670d5d` - feat: Upcoming Listings showcase across all portals

---

## Objective
Build HypeThrift, a Next.js auction marketplace with:
- Strict buyer/seller separation
- Manual ₹69 contact-fee verification
- Direct buyer↔seller item payments
- Paid featured placements
- Full admin panel
- **New:** Upcoming Listings showcase (this session)

---

## Key Configuration (src/lib/platform.ts)
- Admin WhatsApp: `9864854481`
- Admin UPI: `9864854481@ptsbi`
- Contact fee: ₹69 (`CONTACT_FEE`)
- Credit packages: 1=₹99, 3=₹249, 8=₹499
- Item payment window: 48h

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hypethrift.com | admin123 |
| Seller 1 | seller@hypethrift.com | seller123 |
| Seller 2 | streetvault@hypethrift.com | vault123 |
| Seller 3 | vintagecloset@hypethrift.com | closet123 |
| Buyer 1 | buyer@hypethrift.com | buyer123 |
| Buyer 2 | riya.buyer@hypethrift.com | riya123 |
| Buyer 3 | kabir.buyer@hypethrift.com | kabir123 |

---

## Upcoming Listings Feature - Complete Implementation

### Design Decisions (Confirmed with User)
1. **Sellers** can set up to 5 upcoming showcases
2. **Buyers** "Request Live" vote (one per user per listing)
3. **Admin** approves → sets UPCOMING status (no credit consumed)
4. **Seller** clicks "Launch Live" → spends 1 listing credit → ACTIVE
5. **Upcoming showcases are free** until launch
6. **Homepage never shows empty "No live auctions" state**

### Schema Changes (prisma/schema.prisma)
```prisma
enum ListingStatus {
  DRAFT
  PENDING_REVIEW
  UPCOMING      // NEW
  ACTIVE
  ENDED
  SOLD
  REJECTED
}

model Listing {
  // ... existing fields
  startsAt       DateTime?
  upcomingIntent Boolean      @default(false)  // NEW
  upcomingVotes  UpcomingVote[]               // NEW
}

model UpcomingVote {                          // NEW
  id        String   @id @default(cuid())
  userId    String
  listingId String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  @@unique([userId, listingId])
  @@index([listingId])
  @@index([userId])
}
```

### Actions (src/actions/listing-actions.ts)
| Action | Purpose |
|--------|---------|
| `createListing` | Accepts `mode` ("live"\|"upcoming"), enforces 5-cap, sets `upcomingIntent` + optional `startsAt` |
| `toggleRequestLive` | Buyer vote (one per user, sellers blocked, buyers only) |
| `launchUpcoming` | Seller promotes UPCOMING→ACTIVE, spends 1 credit, redirects to credits page if none |
| `removeUpcoming` | Seller removes showcase, deletes votes, resets to DRAFT |
| `updateListing` | Now allows editing UPCOMING (bidCount == 0) |

### Admin Actions (src/actions/admin-actions.ts)
| Action | Behavior |
|--------|----------|
| `approveListing` | Uses `upcomingIntent`: UPCOMING (free, enforces 5-cap) or ACTIVE (credit) |
| `rejectListing` | Cleans up votes, clears `upcomingIntent` |
| `deleteListing` | Revalidates all pages |

### Pages Updated
| Page | Changes |
|------|---------|
| `src/app/page.tsx` | Queries ACTIVE + UPCOMING, passes to LiveDropLandingPage |
| `src/components/home/LiveDropLandingPage.tsx` | Shows "The next drop is being curated" + UpcomingSection when no live |
| `src/components/home/UpcomingSection.tsx` | **NEW** - Request Live buttons, vote counts, scheduled start |
| `src/app/listing/[id]/page.tsx` | UpcomingPanel with Request Live instead of bid controls |
| `src/app/listings/page.tsx` | Upcoming showcase below live with filters |
| `src/app/seller/(dashboard)/dashboard/page.tsx` | Stats include "Upcoming" count + vote counts |
| `src/app/seller/(dashboard)/listings/page.tsx` | Launch/Remove buttons, vote badge, edit allowed |
| `src/app/seller/(dashboard)/credits/page.tsx` | Error banner when redirected for insufficient credits |
| `src/app/admin/listings/page.tsx` | "Upcoming Showcase" section with vote counts + Remove |
| `src/app/seller/(dashboard)/listings/[id]/edit/page.tsx` | Allows editing UPCOMING |

### Seed Data (prisma/seed.ts)
- 3 upcoming demo listings with scheduled starts (2-4 days out)
- 5 upcoming votes from demo buyers (alex, riya, kabir)

---

## Prisma CLI Workaround (Critical)
**Problem:** `npx prisma` / `.bin/prisma` hangs with no output on this machine (Node 22.23.1, Prisma 7.9.1, duplicate `effect`/`@prisma/config` versions)

**Solution:** Use direct node execution:
```bash
node node_modules/prisma/build/index.js <command> </dev/null
```
Example: `node node_modules/prisma/build/index.js generate </dev/null`

---

## Known Issues / Deferred Items
1. **Vercel env:** `UPLOADTHING_TOKEN` needs to be set in Vercel dashboard for production uploads
2. **UploadThing token rotation:** Token was exposed in chat - should be rotated
3. **Cron frequency:** `vercel.json` daily cron may be too slow for short auctions (consider hourly)
4. **Admin dashboard stats:** Could add UPCOMING count to admin dashboard summary
5. **Payment-proof:** Added earlier session - order state machine, seller re-application complete

---

## Todo List Status

### Completed ✅
- [x] Seller route architecture: `(dashboard)` route group, public `/seller`, protected `/seller/dashboard`
- [x] Auth middleware fix: `sellerStatus`, `sellerNote`, `isBanned` propagated to edge session
- [x] Homepage header buttons removed; footer sole seller entry; avatar-only buyer login
- [x] Paid featured placements: `featuredUntil`, `FeatureCharge` model, admin page, badges
- [x] Atomic `placeBid`: server-side increment enforcement, conditional SQL UPDATE
- [x] Draft/pending/rejected hidden publicly; bidder emails hidden in public history
- [x] Reserve price: below-reserve bids allowed live; enforced at completion
- [x] Seller listing editor: `/seller/listings/[id]/edit`, live reset timer
- [x] Close Bid: atomic stop, auto winner/order creation
- [x] Upload pipeline: real token in `.env.local`, E2E verified, thumbnails
- [x] Post-approval crash fixed: `"use server"` on all inline form actions
- [x] Save Order Details flow: redirects with `?saved=details`/`?saved=handoff`
- [x] Beta hardening: order state-machine transition guards, proofUrl + UploadThing proof endpoint
- [x] Seller re-application: `?reapply=true` reuses REJECTED account
- [x] Schema updated: `UPCOMING`, `startsAt`, `UpcomingVote` model
- [x] Prisma client regenerated (7.9.1)

### This Session - Completed ✅
- [x] Add `toggleRequestLive` buyer action
- [x] Add `launchUpcoming` / `removeUpcoming` seller actions
- [x] Update `createListing` with mode + 5-cap + `upcomingIntent`
- [x] Update `approveListing` to use `upcomingIntent`
- [x] Update seller create-listing form with mode selector + scheduled start
- [x] Update seller dashboard listings with vote counts + Launch/Remove
- [x] Update admin listings with Upcoming moderation queue
- [x] Update homepage to show UpcomingSection when no live
- [x] Update listing detail page with UpcomingPanel + Request Live
- [x] Update /listings page with upcoming showcase
- [x] Update seller dashboard stats with Upcoming count
- [x] Update seller credits page with error banner
- [x] Seed upcoming demo items + votes
- [x] Build, transpile check, commit, push

---

## File Changes Summary (Commit 8670d5d)
```
17 files changed, 778 insertions(+), 78 deletions(-)
create mode 100644 src/components/home/UpcomingSection.tsx
```

### Modified Files
- `prisma/schema.prisma` - Schema changes
- `prisma/seed.ts` - Upcoming demo data + votes
- `src/actions/listing-actions.ts` - 4 new actions + createListing updates
- `src/actions/admin-actions.ts` - approveListing/rejectListing updates
- `src/app/page.tsx` - Query upcoming + pass to component
- `src/app/listings/page.tsx` - Upcoming showcase with filters
- `src/app/listing/[id]/page.tsx` - UpcomingPanel component
- `src/app/admin/listings/page.tsx` - Upcoming moderation table
- `src/app/seller/(dashboard)/dashboard/page.tsx` - Upcoming stats
- `src/app/seller/(dashboard)/listings/page.tsx` - Launch/Remove buttons
- `src/app/seller/(dashboard)/listings/[id]/edit/page.tsx` - Allow UPCOMING edit
- `src/app/seller/(dashboard)/credits/page.tsx` - Error banner
- `src/components/home/LiveDropLandingPage.tsx` - Empty state + UpcomingSection
- `src/components/home/UpcomingSection.tsx` - **NEW** component
- `src/components/seller/NewListingForm.tsx` - Mode selector + scheduled start
- `package.json` / `package-lock.json` - Dependency updates

---

## Verification Checklist
- [x] `node node_modules/prisma/build/index.js validate </dev/null` → Schema valid
- [x] `node node_modules/prisma/build/index.js generate </dev/null` → Client generated
- [x] All 14 modified files transpile cleanly (TypeScript transpileModule check)
- [x] No lint errors on modified files
- [x] Git diff clean (only intentional changes)
- [x] Pushed to GitHub successfully