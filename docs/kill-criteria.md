# Kill criteria — charter CLI

**Created:** 2026-07-12 (pre-launch; immutable once launch occurs)

## The gate

By **day 21 after public launch**, charter must have:

- **≥ 10 paying customers**, OR
- **≥ $400 in revenue**

If it clears neither bar, the project is archived publicly: a graceful
archive note is posted, the repo is marked archived, and no further build
or launch work happens.

## Rules

1. These criteria were set before launch and do not change after launch.
   No moving the goalposts, no "one more week."
2. The numbers come from Alex (Stripe / payment records), recorded in
   HUMAN_QUEUE.md. The orchestrator cannot see revenue directly and never
   estimates it.
3. Day 21 is counted from the launch date Alex records in HUMAN_QUEUE.md.
4. The day-21 judgment call is Alex's. The orchestrator's job is to
   evaluate the numbers against this document, draft the archive note if
   the gate fails, and queue it — not to post anything.

## Why this exists

Kill criteria written before launch are the only ones that can be trusted.
This file exists so that on day 21 the decision is a comparison, not a
negotiation.
