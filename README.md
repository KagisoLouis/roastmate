# Roastmate — Free / Premium test branch

Proposed price: US$5/month. This is configuration-ready code, not connected live payments.

Free: 3 games per UTC day, stored roasts, basic hints, board arrows. Confirmed accounts are required to count games across devices.

Premium: unlimited games, 200 fresh AI roasts/month, opponent levels, coach personalities, explanations/reply preview, cloud saves/replay, progress, game reviews and practice from mistakes. Reviews use a shallow beginner engine, not Stockfish.

Read SETUP.md before replacing anything. Run database.sql including the new game quota function, configure auth, payments and AI, and deploy a separate test branch first. Current live site has not been changed. The ZIP is a full Vercel project; preserve folders. No secrets included.

Validation: node --test tests/*.test.mjs. Mocked API and engine checks do not replace real database concurrency tests, checkout/email tests, or mobile browser QA.
