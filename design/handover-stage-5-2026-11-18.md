# Handover for stage 5: the launch (written November 18th 2026)

For a new Claude Code session on `JohnBaish/trainchecker`, **after** the fresh look
(`design/handover-fresh-look-2026-11-18.md`) and the changes John agrees from it. Check the log in
`CLAUDE.md` first: anything decided after this note was written wins.

## Where things stand

Stages 1 to 4 are live on `main` at trainchecker-alpha.vercel.app. Already done for stage 5:

1. **Tagline:** "How the trains are doing, written the way we speak." (John, November 18th 2026;
   `SPEC.md`, top).
2. **Link-preview picture:** `public/og-trainchecker.png`, from `design/og-trainchecker.html`
   (`node design/og-shoot.cjs`; fonts from `node_modules`, the script stops if one doesn't load).
3. **Favicon C** (`public/favicon.svg`).
4. **All four keys in Vercel** for Production and Preview (John confirmed the incidents one
   November 18th 2026).

## What stage 5 does (`PLAN.md`)

1. **Search,** by `SEO-HANDOVER.md` §2 (the checklist for a new tool), steps 1 to 18. For
   Trainchecker:
   - Wording first, drafted by Claude for John: a `<title>` "Trainchecker – free … for …" and a
     search description starting "Free …", in the words people search for ("train times",
     "delays", "is my train on time", "engineering work", "platform"…: research, don't guess).
   - `index.html` has only `<title>Trainchecker</title>` and a comment saying the tags come now:
     add the description, canonical (`https://trainchecker.baish.net/`), `og:` and `twitter:`
     tags (the link-preview wording can be the tagline; `og:image` the picture above, by full
     address), and the comment on which tags are for search and which for previews.
   - `document.title` is never set by the app (check again).
   - `public/robots.txt` and `public/sitemap.xml` (one domain, plain files: step 8).
   - Visible text for a first-time visitor (step 9): the first visit already has the intro and
     About; agree with John whether more is needed, with nothing that reads like an FAQ.
   - "More free tools at www.baish.net." is already in the footer (step 10).
2. **The address `trainchecker.baish.net`** (John): add the domain to the Vercel project and the
   DNS record Vercel asks for. Then check robots.txt and sitemap.xml live (step 16).
3. **Search Console** (John, step 17): the sitemap, then URL Inspection and Request indexing.
4. **The card on baish.net** (in `JohnBaish/clockwheel`, `landing.html`; steps 11 and 12):
   - Since November 11th 2026 the hub has three coloured panels ("The sky and weather", "Near
     you", "Producing and planning"): **ask John which panel** Trainchecker belongs in, and its
     one line (perhaps from the tagline).
   - The picture for computers is the illustration cropped from the link-preview picture at
     (86, 85) to (546, 545), saved at 192px as `public/hub/trainchecker.webp`; phones show the
     favicon. Follow how Rainfaller was added (clockwheel's `CLAUDE.md`, November 17th 2026).
   - A NEW tag: the row's `data-launched` date (the day it goes on baish.net).
   - John's standing reminder: update the hub's search description to include what Trainchecker
     does, within about 155 characters (§2 step 12 has the history).
   - Branch, preview, John's word before merging: it's a visible change to another site.
5. **Records:** `SEO-HANDOVER.md` §1's table gains Trainchecker's row (step 18; the master copy is
   clockwheel's); the project tracker (`JohnBaish/baish.net-directory`, `trainchecker.md` and its
   `INDEX.md` line, straight to its `main`, `node site/check-tracker.mjs` first); `CLAUDE.md`'s
   log; and, once live, the baish.net overview in clockwheel's `design/overview/` (house style §16).

## Practical points

1. One Rail Data Marketplace key at a time here (see the fresh-look note); the launch work itself
   needs none.
2. Merging: the page's tags, robots and sitemap are visible changes, so a branch and John's word
   (house style §10); after merging, "Delete merged branches" (trial run, then the real run).
3. House style §12 has the search defaults; break them only on purpose.

## Prompt for John to paste into the new session

```
This is Trainchecker, stage 5: the launch. The fresh look and its changes are done. Please read
design/handover-stage-5-2026-11-18.md first and follow it, starting with the search wording
for me to choose from, and ask me which panel Trainchecker goes in on baish.net.
```
