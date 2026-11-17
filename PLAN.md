# Trainchecker: plan (draft)

Draft by Claude Code, November 17th 2026, for John to agree. One branch
per stage; nothing visible is merged without John's say-so (house style
§10).

## Stage 0: set-up (done in the first thread)

The handover, house-style files, spec, plan and notes. No app.

## Stage 1: try the real data (branch `stage-1-data`)

Before any design, prove the data gives what the spec needs.

John's jobs first:

1. Register on the Rail Data Marketplace and subscribe to the Live
   Departure Board, Historical Service Performance, Knowledgebase
   Incidents and the NationalRail Disruptions API. HSP may need
   approving by hand, so subscribe to it first.
2. Create the Vercel project for this repo, and save each key as a Vercel
   setting (never pasted into a chat).
3. Allow the data hosts in this environment's network settings, so
   Claude can test from here.

Claude then, with real journeys (Reading to Paddington, and an
Elizabeth line journey through central London):

1. Fetches the next five hours, platforms and reasons for delays.
2. Fetches a week of history, and times it (is it quick enough for a
   visitor to wait for?).
3. Fetches incidents and checks whether planned engineering work is in
   them, and how far ahead.
4. Checks the Elizabeth line is covered, including central London.
5. Checks the "badly disrupted" and "last week" rules against real days,
   and suggests thresholds.
6. Reads each licence and its credit line.
7. Writes up the findings in `design/data-trial-<date>.md`, with what
   works, what doesn't, and a recommendation.

## Stage 2: mock-ups (branch `stage-2-mockups`)

The whole page at 1200px, 390px and 844×390, light and dark, with real
sample data from stage 1, including a good day, a mixed day, a bad day
and a journey with no direct train. The verdict and summary sentences are agreed
here, word by word.

## Stage 3: direct journeys (branch `stage-3-direct`)

The station chooser, the verdict, the next five hours, platforms and the
last week, for direct journeys. The functions, dark mode, the footer and
analytics. An `npm run check` for the verdict rules and sentences.

## Stage 4: the days ahead (branch `stage-4-ahead`)

Engineering work and known problems to the end of the coming weekend,
their effect on the verdict, and National Rail's advice when a journey is
badly disrupted.

## Stage 5: launch (branch `stage-5-launch`)

Favicon and link-preview picture (options shown first), search (the
`SEO-HANDOVER.md` checklist), a fresh look, the domain
`trainchecker.baish.net` (John), Search Console (John), and the card on
baish.net.

## Later, not planned

1. Journeys with a change, and alternative routes worked out by
   Trainchecker with a journey time (needs a journey planner).
2. The London Underground.
