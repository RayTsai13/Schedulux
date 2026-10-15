# Schedulux: Positioning

## One sentence
A booking page for your bio with **drops** built in: limited sessions, one shareable link, a live spots-left counter, and a waitlist when it sells out.

## Who it's for
Independents who already have an audience (Instagram, TikTok, a regular clientele) and sell their time in bursts: barbers doing late-night chairs, tattoo artists running flash days, trainers opening a few extra sessions, handymen doing a weeknight pop-up.

## Why it works standalone
Schedulux used to aim at a two-sided marketplace, which only has value once both sides show up in large numbers. The current product needs **one vendor**. They bring their own audience; Schedulux turns attention into booked slots. There's no discovery feed to fill and no client accounts to grow.

## What makes it different from Calendly / Square
- **Drops are first-class.** A drop is a dated window with per-slot capacity that overrides regular hours (even closures). It has its own link, a live counter, and a waitlist. In general-purpose schedulers this takes workarounds.
- **No client accounts.** Guests book with name + email and manage the booking from a private link.
- **It never double-books.** Writes are serialized per page with a PostgreSQL advisory lock; `npm run demo:race` shows it.

## Deliberately out of scope
Marketplace/discovery, geosearch, admin verification, multiple locations per vendor, client logins, payments (for now).

## Possible next steps
- Server-rendered share previews (OG images) for drop links
- Payments/deposits for drops (Stripe), to cut no-shows
- "Notify me about the next drop" follower list per page
- Publish `@schedulux/availability-engine` to npm
