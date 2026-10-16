# Roastmate payment test setup — Botswana

This is a configuration-ready integration, not a connected or live payment service. It adds a three-games-per-UTC-day free plan, the Premium coaching package, and email/password accounts, a hosted subscription checkout, verified payment updates, a customer portal, and a server-enforced 200-roast allowance per UTC calendar month. Real-provider checkout, database transactions, email delivery, and bank payouts must be tested after configuration. Do not replace the live game until you are ready to complete this setup; use a Vercel preview branch first.

## 1. Create the two service accounts

- Lemon Squeezy: https://app.lemonsqueezy.com/ — use your genuine Botswana identity/business and bank information. Its documentation lists Botswana bank payouts; approval and verification are still required. Do not enter banking details in the website source or share them in chat.
- Supabase: https://supabase.com/ — create a project for player accounts and payment/usage records. Select a suitable region. Review current plan limits before opening public signup.

## 2. Configure player accounts

In Supabase:
1. Enable email/password sign-in and require email confirmation.
2. Set the authentication Site URL and allowed redirect URL to `https://YOUR-DOMAIN/account.html`, including your preview address while testing.
3. Configure email delivery and provider-side sign-up protections. The app uses password sign-in, email verification, recovery, and token refresh.
4. Open SQL Editor and run `database.sql` once. Tables have row-level security enabled and no browser write policies; only the service-role server key may update payments or quotas.

## 3. Configure a test product

In Lemon Squeezy Test mode:
1. Create a monthly subscription product. Proposed price: US$5/month, no free trial. The website's displayed price must match the actual product price.
2. Record your Store ID and Variant ID.
3. Create a test-mode API key.
4. Add a webhook pointing to `https://YOUR-PREVIEW-DOMAIN/api/webhook`.
5. Choose a random signing secret and subscribe to subscription_created, subscription_updated, subscription_cancelled, subscription_resumed, subscription_expired, subscription_paused, subscription_unpaused and order_refunded. Subscription update events carry payment-state changes; also verify those changes through provider simulations.
6. Payment events must contain the server-added custom user_id. Never manually set a customer's identity through a public checkout URL.

## 4. Add Vercel environment variables

Open the existing Vercel project > Settings > Environment Variables. Start in Preview, not Production. Never put real keys in GitHub files.

| Name | Value |
|---|---|
| SITE_URL | The exact HTTPS origin of the configured preview or production site |
| SUPABASE_URL | Your Supabase project URL |
| SUPABASE_ANON_KEY | The legacy public anon key, used for browser sign-in |
| SUPABASE_SERVICE_ROLE_KEY | The legacy private service-role key; server only |
| LEMON_API_KEY | Your test API key to start |
| LEMON_STORE_ID | Store ID |
| LEMON_VARIANT_ID | Test subscription variant ID |
| LEMON_WEBHOOK_SECRET | Your webhook signing secret |
| PAYMENTS_LIVE | `false` while testing |
| PLAN_PRICE_LABEL | `$5/month`, matching your actual product |
| SUPPORT_EMAIL | A real address you monitor for support/refunds |
| OPENAI_API_KEY | Optional for test checkout; required for real paid AI features |
| OPENAI_MODEL | `gpt-6-luna` or another model supporting this request format |
| AI_MONTHLY_REQUEST_LIMIT | `1000` initially: a site-wide request ceiling, not a dollar-spend guarantee |

The public config endpoint intentionally exposes only the Supabase URL/public anon key and nonsecret settings. The service-role key, Lemon API key, webhook secret and OpenAI key remain server-side.

## 5. Upload as a preview

This package includes folders. Extract it. Upload the entire extracted tree, preserving `api/`, `server/`, and `tests/` under the repository root. `index.html`, `package.json`, and `vercel.json` must sit at the root. Create a new branch such as `payment-test` and let Vercel create a preview deployment. The included `vercel.json` keeps the static root and adds Node server functions; no frontend build or paid dependency is required by this code.

Use the same stable test domain for SITE_URL, Supabase redirect configuration, and webhook settings. Temporary preview URLs may change after each deploy; a fixed test subdomain avoids repeatedly reconfiguring callbacks.

## 6. Mandatory provider checks before real customers

- Create an account, confirm email, sign in, sign out, reset password and complete the email recovery flow.
- Checkout without signing in must fail.
- Complete the provider's documented test payment. Do not use a real card in a test checkout.
- Account must remain free until a correctly signed server payment event arrives; returning from checkout alone never grants access.
- Replay the same webhook; SQL must apply it only once. Send an older subscription update after a newer one; it must not replace the newer state.
- Fake or missing signatures must fail. Test-mode events must never unlock live-mode subscriptions.
- Cancel and verify access remains only until the paid end date. Simulate failed renewal, expiration, pause and resumption; confirm access matches the state.
- A full initial-order refund revokes access. Partial refunds do not automatically revoke access. Refunding does not necessarily cancel future provider renewals: cancel the recurring subscription explicitly when your refund policy requires it. Handle renewal-invoice refunds/chargebacks through the provider and revoke/cancel access as appropriate; this version does not automate every dispute event.
- Connect the AI key, generate a roast, verify actual API usage, and check stored-joke fallback during service failure.
- Exercise the quota boundary and simultaneous requests against the actual database. Quota reservations and refunds run as serialized database transactions; test these after SQL installation.
- Inspect mobile and desktop layouts after upload. Browser visual QA was unavailable during preparation.

Local verification included syntax checks, signature rejection, anonymous-checkout rejection, verified-user binding, paid-access expiration/cancellation logic, test/live separation, and a mocked signed payment event. These do not replace real sandbox tests.

## 7. Go live only after sandbox tests and provider approval

Add your actual support, privacy and refund information before selling. Confirm price, business identity, payout currency, fees, minimum payout and payout timing in the payment account. A paid subscription is not the same as immediately available cash in your bank.

Use live product IDs/API keys and a live webhook secret in Production. Set PAYMENTS_LIVE=true, configure SITE_URL to the public domain, and redeploy. Test one genuine low-value purchase and refund using the provider's permitted procedure before announcing paid access. The live checkout refuses sales until an AI key and support address are configured.

## What is deliberately not promised

Premium includes unlimited games, 200 AI roasts per UTC month, three opponent levels, three coach voices, move explanations, cloud saves/replay, estimated game reviews, progress, and practice from mistakes. Free accounts get three games per UTC day, stored roasts, basic hints and board arrows. No unlimited AI, multiplayer, or automatic legal/tax compliance. All games now require a confirmed account so quotas can be tied to the user. This branch requires the updated database SQL and /api/games before play works. The public client chess engine is not DRM; determined users can copy/run static code. The service controls account game admission and protected storage, not ownership of chess itself. Payment providers charge fees. Hosting, email/database limits, AI credits and domain costs are separate. The site-wide AI cap can make fresh roasts temporarily unavailable even before an individual's allowance is used; the account page states this.

## New plan validation (required before production)
- Rerun database.sql to add player_games and start_player_game. No new environment variables.
- Free verified account: first three distinct game IDs accepted, fourth refused, duplicate first-move retry does not consume another slot, next UTC day resets. Test concurrent starts against the real database.
- A game counts at first move, including abandoned games. Undo does not count again. A current game is never cut off by the daily quota. New-game button asks before abandoning a started game.
- Paid access: unlimited starts; expired/test-mode-mismatched access reverts to free. API must deny free game-history requests and another user's saves.
- Paid: change opponent and coach in Membership & coaching (More on mobile); End game & review opens members.html. Normal completed/flagged games are saved as finished automatically.
- Confirm real cloud saves after Black replies, replay, review, and training. In-progress games are replayable, not resumable. Latest 50 games are shown. Saved games support up to 600 half-moves; reviews examine the first 80 White moves at most to bound server work, as stated on the review page.
- The review uses shallow engine estimates, not Stockfish or official accuracy/rating. Practice accepts the selected engine move; other good alternatives may exist. AI voices change generation style; stored voices currently add short commentary introductions.
- Free play requires working account/database configuration. Do not upload this onto the live site as a static-only replacement.
- Verify desktop/mobile in a real browser; this environment had no supported browser QA.
