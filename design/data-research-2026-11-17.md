# Data research before the keys arrive (November 17th 2026)

Stage 1 work that didn't need keys. Read by Claude Code from the Rail Data
Marketplace's public product pages (raildata.org.uk, as a visitor, not
signed in) at about 3.45pm on Tuesday November 17th 2026. The quotes are
copied from those pages.

## The four products

| | Live Departure Board | Historical Service Performance (HSP) | Knowledgebase Incidents data | NationalRail Disruptions API |
|---|---|---|---|---|
| Publisher | Rail Delivery Group | Rail Delivery Group (data creator: CACI Ltd) | Rail Delivery Group | Rail Delivery Group |
| Version | 1.1 | 1.1 | 1.0 | 1.1 |
| Licence type | "Open (restrictions may apply)" | same | same | same |
| Uptime shown | 99.54% | **89.86%** | 99.95% | 99.93% |
| Coverage | "England, Scotland & Wales" | "All UK routes and TOCs as covered by Darwin" | "Whole of UK" | "England, Scotland & Wales" |
| Service level agreement | No | No | No | No |

## What each page says that matters to Trainchecker

1. **Live Departure Board:** "If available then NRCC messages, platform
   information, if services are available, and information on train, bus,
   and ferry services will also be shown." So platforms and replacement
   buses can come from the board. "In the public versions … more
   information on the services and calling points is available."
2. **HSP:** "You can query for all trains between a pair of locations,
   between two times and on two dates and filter the results by train
   operator." That matches the "last week" plan exactly (the same five
   hours, seven days). Cautions: "There is a limit on the amount of data
   you receive", the lowest uptime of the four (89.86%), and two posts on
   its discussion page (October 2026) chasing "sign off", which suggests
   a subscription to HSP is approved by hand and may take a while.
3. **Knowledgebase Incidents data:** "provides information on incidents
   such as if an incident is planned engineering work or an unplanned
   service disruption, a summary of the incident, and the incident
   priority". **Planned engineering work is included** (spec question 8).
   How far ahead isn't stated. Its metadata was last updated in December
   2023, and its one rating says it "did not meet my expectations".
4. **NationalRail Disruptions API** (found while searching, not in the
   plan before): "station messages, bulletins, disruption information, and
   incident information", live, updated 2026, uptime 99.93%. A possible
   alternative or companion to Knowledgebase Incidents for the days ahead
   and National Rail's advice. Worth subscribing to as well.

## Still unknown (needs the account, or other sites)

1. Each product's licence terms and any credit wording (the Licence and
   Documentation tabs didn't show their contents to a visitor).
2. The exact addresses of the incidents and disruptions products.
3. Whether the Elizabeth line, including central London, is in the live
   boards and HSP. The Open Rail Data wiki would say, but it sits behind
   Cloudflare's bot check, which blocks this session even with the site
   allowed.
4. Whether Vercel's "Sensitive" variables reach functions while the site
   runs: `vercel.com` and `www.nationalrail.co.uk` didn't resolve from
   this session at 3.50pm, though they had been added.
