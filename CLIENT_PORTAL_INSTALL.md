# BHARATEE GRAPHIX Client Album Portal — Installation

This feature is developed on the `client-portal-development` branch. It is **not live on the production `main` branch** yet.

## What it provides

- Customer login using registered mobile number + existing studio Project ID + 8-digit WhatsApp-shared PIN.
- Customer sees only their one linked studio project.
- Google Drive delivery link appears only when the booking is marked Delivered or Completed.
- Customer can submit project questions/correction requests and view studio replies.
- Owner/Admin/Manager can create/reset PINs, save delivery links, revoke portal access and reply to queries.

## Step 1 — Apply the database migration

1. Open Supabase Dashboard and select the production project.
2. Open **SQL Editor → New query**.
3. Open `supabase/009_client_album_portal.sql` from this branch and copy its complete contents.
4. Paste into SQL Editor and click **Run** once.
5. Confirm the query completes without errors.

This migration adds portal-only tables and RPC functions. It does not modify existing orders, bookings, customers or payments. Do not run it more than once unless you know why; it uses create-or-replace / if-not-exists clauses but should still be treated as a versioned migration.

## Step 2 — Deploy the website files

These files are in this branch:
- `client.html`
- `client-portal-public.js`
- `client-portal-nav.js`
- `client-portal-admin.js`

The existing `index.html` and `admin.html` in this branch already load the new scripts.

## Step 3 — Enable a project for a customer

1. Sign in to the admin dashboard.
2. Select **BHARATEE GRAPHIX**.
3. Open **Client Album Delivery & Support** below the existing modules.
4. Find the customer's studio project.
5. Click **Generate Customer PIN**. The 8-digit PIN is displayed once. Copy it immediately and send it privately to the customer on WhatsApp, together with the Project ID. The original PIN is not stored in readable form and cannot be retrieved later; generate/reset it if it is lost.
6. Paste a Google Drive folder/file sharing URL into that project's Drive URL field and click **Save Drive Link**.
7. When the final album is ready, tick **Mark booking Delivered** and save again. The link then becomes visible to the customer portal.

## Step 4 — Customer access

Customer opens:

`https://bharateegraphics.github.io/bhartee-digital-service/client.html`

They enter:
- registered mobile number,
- Project ID exactly as supplied (for example, the studio order number),
- 8-digit PIN shared by the studio.

The session is stored only in the current browser tab/session and expires after 12 hours. Five incorrect PIN attempts lock that project login for 10 minutes.

## Important Google Drive privacy note

For customers to open the Google Drive link without needing a Google account, the file/folder must be shared as **Anyone with the link — Viewer**. That Drive link can be forwarded by the recipient; this portal cannot prevent someone who has the URL from sharing it further. Do not use a broadly shared Drive URL for confidential documents or anything not intended for anyone holding the link.

## Important production gate

Do not merge this branch into `main` yet. First run migration 009, test with a non-sensitive test booking and test Google Drive folder, verify customer A cannot see customer B's project, verify delivery link stays hidden until Delivered/Completed, test customer query/reply, and confirm PIN reset/revoke work. After those tests, prepare a reviewed pull request. Never put a Supabase `service_role` / `sb_secret_` key in browser code.
