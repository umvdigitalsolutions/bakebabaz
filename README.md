# Bake Baba'z

A production e-commerce platform for a boutique bakery in Bikaner — storefront,
custom cake builder with live pricing, real Razorpay checkout, and a separate
admin panel the bakery runs the business from.

Built with Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4,
MongoDB/Mongoose, Zod and Cloudinary.

---

## Getting started

### 1. Requirements

- **Node.js 20.9+** (this repo is developed on 24.x)
- **MongoDB** — a local `mongod`, or a free MongoDB Atlas cluster
- Optional but needed for the full experience: a Cloudinary account (image
  uploads) and a Razorpay account (online payment)

### 2. Install and configure

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and fill in at minimum:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/bakebabaz
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=          # generate below — the app refuses to start without it
```

Generate a session secret:

```bash
openssl rand -base64 48
```

### 3. Seed the demo catalogue

```bash
npm run seed
```

This creates 14 categories, 25 products with real weight/price variants, the
full cake-builder vocabulary (flavours, fillings, shapes, styles, tiers),
add-ons, pricing rules, delivery slots and Bikaner PIN-code zones, three
coupons, eight FAQs, and the homepage content. Prices are believable INR rates;
photography points at Unsplash until the owner uploads their own.

Re-running is safe — catalogue records upsert, store settings are only filled
where still blank (so policies, FAQs and homepage picks edited in the admin are
kept), and product ratings start at zero and are only ever computed from
approved reviews. `npm run seed -- --reset` wipes the catalogue collections
first.

### 4. Create a staff login

```bash
npm run create-admin
```

Enter a name, email and password when prompted (or set `ADMIN_EMAIL`,
`ADMIN_PASSWORD` and `ADMIN_NAME` in `.env.local` and the seed script will
create the account for you). Sign in at `/admin/login`.

### 5. Run it

```bash
npm run dev
```

- Storefront — <http://localhost:3000>
- Admin panel — <http://localhost:3000/admin>

---

## Scripts

| Command                | What it does                              |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Development server (Turbopack)            |
| `npm run build`        | Production build                          |
| `npm start`            | Serve the production build                |
| `npm run typecheck`    | `tsc --noEmit`                            |
| `npm run lint`         | ESLint                                    |
| `npm run format`       | Prettier over the repo                    |
| `npm run seed`         | Seed demo catalogue and store settings    |
| `npm run create-admin` | Create or reset a staff login             |
| `npm run repair`       | Collapse duplicate settings, sync indexes |

---

## Environment variables

Everything lives in `.env.example`. The app degrades honestly rather than
crashing when optional services are missing:

| Variable                                | Required           | Without it                                                                        |
| --------------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `MONGODB_URI`                           | **Yes**            | Nothing works                                                                     |
| `AUTH_SECRET`                           | **Yes**            | Sessions throw on sign-in (32+ chars)                                             |
| `NEXT_PUBLIC_APP_URL`                   | Yes in production  | Canonical URLs and sitemap are wrong                                              |
| `CLOUDINARY_*`                          | For uploads        | Image upload returns a clear "not configured" message; everything else works      |
| `RAZORPAY_KEY_ID` / `_SECRET`           | For online payment | Checkout falls back to cash on delivery with an explanatory message               |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`           | For online payment | Razorpay modal can't open                                                         |
| `RAZORPAY_WEBHOOK_SECRET`               | Recommended        | Webhook deliveries are rejected; the client-side verify path still settles orders |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`   | For email          | Notifications log to the server console instead of sending                        |
| `RESEND_REPLY_TO`, `NOTIFY_ADMIN_EMAIL` | Recommended        | Replies have no override; staff alerts are skipped                                |

Never commit `.env.local`. `.gitignore` already excludes `.env*`.

---

## Resend setup

1. Create an API key in the Resend dashboard and set `RESEND_API_KEY`.
2. Add and verify your sending domain in Resend, then set
   `RESEND_FROM_EMAIL` to a sender on that domain, for example
   `Bake Baba'z <orders@your-domain.com>`.
3. Set `RESEND_REPLY_TO` to the bakery inbox and `NOTIFY_ADMIN_EMAIL` to the
   address that should receive new-order and custom-request alerts.
4. Restart the application after changing `.env.local`.

Customer confirmations and staff alerts use the same notification service.
Without both required Resend variables, messages are logged locally and order
processing continues normally.

---

## Razorpay setup

1. Get test keys from the Razorpay dashboard → Settings → API Keys.
2. Put the key id in **both** `RAZORPAY_KEY_ID` and
   `NEXT_PUBLIC_RAZORPAY_KEY_ID`, and the secret in `RAZORPAY_KEY_SECRET`.
   The secret is server-only and never reaches the browser.
3. For webhooks, add an endpoint pointing at
   `https://your-domain/api/payments/razorpay/webhook`, subscribe to
   `payment.captured`, `order.paid` and `payment.failed`, and copy the signing
   secret into `RAZORPAY_WEBHOOK_SECRET`.

The webhook is the safety net for the case where a customer pays and then
closes the tab before returning — the order still settles.

---

## How the money path works

This is the part worth understanding before changing anything.

**The browser never sends a price.** Cart items store _configuration only_
(weight, flavour, filling, message, add-on ids). Every read of the cart
recomputes each line from live product documents, and checkout recomputes the
whole order again before a Razorpay order is created:

1. `lib/pricing/engine.ts` — pure, dependency-free custom-cake pricing. The
   browser imports it for instant feedback in the builder; the server calls the
   same function with a catalog read fresh from the database. The two cannot
   drift.
2. `lib/pricing/product.ts` — catalogue product pricing from stored weight
   variants and option surcharges.
3. `lib/cart/service.ts` — reprices the whole cart on every read and
   re-evaluates any coupon.
4. `lib/orders/create.ts` — the authority. Re-validates the delivery window
   against the longest lead time in the cart, resolves the delivery fee from the
   PIN-code zone table, re-checks the coupon, verifies stock, snapshots every
   line, and only then writes the order.
5. `lib/payments/settle.ts` — the single place an order becomes `PAID`, reached
   only after an HMAC-SHA256 signature check (`timingSafeEqual`). Idempotent, so
   a duplicate webhook after a successful client verification changes nothing.

**Orders snapshot their items.** Renaming or repricing a product later never
rewrites history.

**Double submits are safe.** The checkout form sends an idempotency key; a
unique partial index on `Order.idempotencyKey` means a retried submission
returns the original order instead of creating a twin.

---

## Custom cake modes

Admin → Settings → Custom cake engine has a mode switch:

- **Instant checkout** — the builder prices the design live and the customer
  adds it to the cart and pays like anything else.
- **Approval required** — the builder collects the design and submits it to
  Admin → Custom cakes, where you review the reference images, set a final
  price, and message the customer. They follow their request at
  `/custom-cake/<number>`.

Both flows are fully implemented; the storefront reads the mode at request time.

---

## Project structure

```
app/
  (store)/          Storefront — home, shop, product, cake builder, cart,
                    guest checkout, order confirmation, policies
  admin/
    login/          Staff sign-in (outside the auth guard)
    (dashboard)/    Guarded admin panel
  api/
    admin/          Admin-only endpoints (each re-verifies the session)
    payments/       Razorpay create / verify / webhook
    cart/ …         Storefront endpoints
components/
  store/            Storefront UI
  cake-builder/     The builder, split per spec (steps, uploader, summary)
  checkout/ cart/   Purchase flow
  admin/            Admin UI (its own design system)
  ui/ shared/       Primitives used by both
lib/
  pricing/          The pricing engine and catalog snapshot
  orders/ payments/ Order creation, numbering, settlement
  cart/ delivery/   Cart service, delivery validation
  auth/ validation/ Sessions, guards, Zod schemas
  cloudinary/ data/ Uploads, settings and catalogue accessors
models/             Mongoose schemas (19)
scripts/            seed.ts, create-admin.ts
proxy.ts            Optimistic /admin gate (Next 16 renamed middleware → proxy)
```

---

## Security notes

- **Admin sessions are isolated.** Staff use a dedicated `bb_admin_session`
  cookie with a 12-hour lifetime and `SameSite=Strict`. Storefront purchases
  use guest carts and do not require customer accounts.
- **Admin APIs never trust the URL.** `proxy.ts` only redirects; every admin
  handler independently re-reads the database, so deactivating a staff account
  revokes access immediately rather than at token expiry.
- **Uploads are sniffed, not trusted.** File type is confirmed by magic number,
  size is capped, and Cloudinary re-encodes every image.
- **Rate limiting** on admin login, coupon attempts, checkout, search and
  uploads. It's in-process — swap `lib/rate-limit.ts` for Redis if you scale
  beyond one node; the call sites won't change.
- **Cross-origin writes are rejected** via origin checking plus SameSite
  cookies.
- **Settings writes are allowlisted** by path, so a crafted key can't reach
  anything the UI doesn't expose.

---

## Deployment

Any Node host works (Vercel, Railway, Render, a VPS).

1. Set every environment variable from `.env.example` in the host's dashboard.
2. Point `NEXT_PUBLIC_APP_URL` at the real domain — sitemap, canonical URLs and
   origin checks depend on it.
3. `npm run build && npm start`.
4. Run `npm run seed` once against production (or add categories and products
   through the admin panel instead).
5. Add the Razorpay webhook endpoint.

MongoDB indexes are declared on the schemas and created automatically on first
connect.

---

## Known gaps

- **Email delivery is optional.** Resend sends transactional messages when its
  credentials are present; otherwise notifications are logged to the console.
- **Rate limiting is per-process.** Fine for a single-node bakery deployment;
  needs Redis behind a load balancer.
- **Seed photography is Unsplash-hosted.** Replace it with the bakery's own
  images through Admin → Media.
- **Editing a Mongoose schema needs a dev-server restart.** Models are cached on
  `mongoose.models` so hot reload keeps the previously compiled schema. Restart
  `npm run dev` after changing anything in `models/`. Production is unaffected —
  the process starts once with the final schema.

If a database ever ends up with duplicate store settings (an early version could
race on first boot), `npm run repair` collapses them and rebuilds every index.

---

## Design

The storefront's visual identity follows the existing Bake Baba'z site — warm
cream paper (`#fffaf4`), dark chocolate ink (`#3d2521`), a single coral accent
(`#ef665f`), Fraunces for display type and DM Sans for everything else. Tokens
live in `app/globals.css`.

The admin panel is deliberately a _different_ system — neutral, dense and plain
— so staff never confuse the two.
