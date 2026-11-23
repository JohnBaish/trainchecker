# "Your train passes near…": coverage

Every stretch of railway in England between neighbouring stations, worked through in John's order
(November 22nd 2026): the Great Western routes first, then the South West, the South East, London,
East Anglia (the East of England), the East Midlands, the West Midlands, Yorkshire and the Humber, the
North West and the North East. One item per stretch. Start each session with: "Read
design/passes-near/COVERAGE.md and do the next batch."

<!-- counts: made by coverage.py -->

1081 of 2376 stretches done.

1. Great Western routes: 271 of 271 done (done).
2. South West: 30 of 30 done (done).
3. South East: 384 of 384 done (done).
4. London: 396 of 421 done (next).
5. East of England (East Anglia): 0 of 237 done.
6. East Midlands: 0 of 140 done.
7. West Midlands: 0 of 191 done.
8. Yorkshire and The Humber: 0 of 238 done.
9. North West: 0 of 396 done.
10. North East: 0 of 68 done.

Next stretch in the order: BRX-HNH (Brixton to Herne Hill).

<!-- end of counts -->

## What counts where

- **The stretches** are in `stretches.json` (2,376 with any of them in England, from the OpenStreetMap
  extract of November 21st 2026; `build_stretches.py`, report in `stretches-report.md`).
- **Great Western routes:** any stretch that a Great Western Railway service uses on the map (its
  OpenStreetMap routes cover at least half of it), wherever it is. Then each region takes the rest,
  by the region with most of the stretch's length.
- **Within each part,** `pn.ordered()` walks along the lines, so a batch is a run of neighbouring
  stretches. Possible avoiding lines (marked `past`, below) come last in each part.
- **Done** means an item in `passes-near.json`, or the stretch listed under `skipped` there with a
  reason.

## How to do the next batch

**Batch size** (John agreed, November 22nd 2026): 40 stretches a batch, as since the set-up. A session
may do two or three batches in a row, committing and pushing after each, so each finished batch is safe.
What limits a batch is how much a session can hold while checking well (the candidates and the articles it
reads), not the downloads, which take minutes now. Bigger batches risk weaker checking, not a crash.

1. Read `README.md` here (John's decisions and the house style of the items) and the newest few items in
   `passes-near.json`, so the new ones read the same way.
2. Make the candidates for the next 40 stretches still to do:
   `python3 -I design/passes-near/candidates.py --next 40 design/passes-near/batches/NN` (NN the batch's
   number). It needs `pip install shapely pyproj numpy` and the hosts `services-eu1.arcgis.com` and
   `en.wikipedia.org`. Nothing to download: Wikipedia's nearby articles, their short descriptions and
   lengths come from the committed `wiki/gb-articles.tsv.gz` (see `wiki/README.md`), and only each
   chosen article's wikitext is fetched (`/wiki/Title?action=raw`) for its first sentences: about four
   minutes for 40 stretches. Those pages answer 429 after a few hundred quick requests (sometimes
   after a few): the script waits as asked and never keeps an error page. It names
   trainchecker.baish.net as its contact, as Wikipedia asks (John's word). The first sentences are a
   rough guide made from wikitext: check facts against the article itself. `--wiki-api` uses
   Wikipedia's search API instead (about one request every 40 seconds from a cloud session).
   What it fetched is kept in `cache/` (not committed).
3. For each stretch, choose one item from `candidates.md` (or anything better you know of near the
   line: a bridge or viaduct the train crosses, a river, a county boundary where nothing else is near).
   Prefer something a passenger would find interesting, and true without hedging.
4. **Check every fact against a source** (the Historic England list entry, Wikipedia, the National
   Trust, the owner's own site). Leave out anything doubtful. Put the source's address in `source`.
   Wikipedia's own pages refuse after a few reads, so read articles with
   `python3 -I design/passes-near/wiki_text.py --save ARTICLES "Title" "Title" …`: it finds them in the
   committed index (`wiki/gb-index.tsv.gz` and `gb-redirects.tsv.gz`), fetches just the blocks of the
   articles dump that hold them (by byte range from dumps.wikimedia.org, no limit seen) and saves their
   wikitext. An article with no coordinates isn't in that index: give `--dumps FOLDER` with the run's
   full index (`wiki_text.py`'s notes say how). Look out for two things in the candidates: a Wikipedia
   link beside a list entry is a guess by name and position,
   and is sometimes wrong (Taunton Castle's pointed at the bus station); and for a park or garden the
   distance is to the park's edge while `lat`/`lon` is its middle or the house, so `check.py` warns
   when they differ: write about the park and give the nearest point of its edge, or choose another.
5. Write the sentence in the house style of the existing items: "Your train passes near …, on the
   train's {side}, …" (start with "Your train", and don't open by naming the stretch's two stations:
   the page adds "Between X and Y, " itself, John, November 23rd 2026); British spelling; one to nine in words; "less than"/"more than", never
   "under"/"over" for amounts; written afresh, not copied. Give `name`, `lat`, `lon` (of the thing),
   `distanceM` and `side` from the candidates (the side is for `a` to `b`: write the item's `a` and `b`
   in the same order as the stretch, or swap the side). `kind` is `near`, `crosses`, `boundary` or
   `station`; `side` is null for the last three, and a boundary has `textReverse` for the other way.
6. Save the batch's items as a list in `batches/NN/items.json`, then
   `python3 -I design/passes-near/to_network.py design/passes-near/batches/NN/items.json`.
7. Run `python3 -I design/passes-near/check.py` and fix everything it lists (warnings: look, and fix if
   wrong). Then `python3 -I design/passes-near/coverage.py` to update the counts above.
8. **Put the new facts on the website** (John, November 22nd 2026): the page's "Fact of the Journey"
   reads `src/data/passes-near.json`, not this folder, so run
   `python3 -I design/passes-near/to_site.py`, then `npm ci` (once per session) and `npm run check`
   (its last part, `check-facts`, must pass) and `npm run build`. Without this step the batch's facts
   never reach the page. A fact shows only on a journey with a train in the next four hours.
9. Commit straight to `main` (John's standing word for these batches): `batches/NN/` (candidates and
   items), the data, `src/data/passes-near.json`, this file. That push makes the new facts live. Add a line to the log below and to `CLAUDE.md`'s log; update the tracker's line
   (baish.net-directory) when a part is finished.

## Things to look out for

- **Possible avoiding lines** (`past` in `stretches.json`, listed in `stretches-report.md`): a stretch
  that runs past another station both its ends connect to. Some are lines round a big station's
  platforms that passenger trains don't use (York, Didcot, Norwich, Leeds, Newcastle); others are real
  lines beside a station (Reading to Tilehurst passes Reading West; Bristol to Keynsham, Lawrence
  Hill; Clapham Junction to London Victoria). Look at each on a map and at a timetable (Realtime
  Trains, say): if no passenger train uses it, add it to `skipped` with the reason; otherwise do it.
- **No train company on the map** (166 stretches, `operators` empty): often just a gap in
  OpenStreetMap's routes (Grantham to Peterborough is the East Coast Main Line), sometimes a freight
  line between two stations (South Wigston to Tamworth, 70 km). The same: skip it, with the reason,
  only once you're sure no passenger train uses it.
- **Into Wales or Scotland** (16 stretches, `crosses`): the item must be in England.
- **A new station opening** splits a stretch: rebuild the network (below) and move the item.

## Rebuilding the network

From a fresh UK extract (download.openstreetmap.fr, as for the platform table: check the checksum)
and the ONS boundaries (`build_stretches.py` says which and where):
`python3 -I design/passes-near/build_stretches.py uk.osm.pbf countries.geojson regions.geojson out/`,
copy `stretches.json` and `stretches-report.md` here, then `to_network.py` and `check.py`. Items whose
stretch has gone end up under `unplaced`, for a person to place.

## Log

- November 23rd 2026 (Claude Code, scheduled task): batch 25, 40 stretches of London from Elstree & Borehamwood to
  Mill Hill Broadway through to Brixton to Denmark Hill (the Midland Main Line from Elstree to Mill Hill; the Thameslink
  core from St Pancras and King's Cross by City Thameslink and Blackfriars to Elephant & Castle and Loughborough
  Junction; the tangle of lines round Battersea Park, Queenstown Road, Wandsworth Road, Clapham High Street, Vauxhall,
  Imperial Wharf, Clapham Junction and Victoria; Waterloo to Vauxhall, Charing Cross and Waterloo East; Fulwell and
  Strawberry Hill to Teddington; Drayton Green to Hanwell; Kensal Green, Harlesden and Shepherd's Bush to Wembley
  Central; Camden Road and Caledonian Road & Barnsbury to Finsbury Park and St Pancras; Finsbury Park to King's Cross;
  Coulsdon Town to Purley; Streatham Hill to Tulse Hill and West Norwood; and Brixton to Clapham High Street and
  Denmark Hill); 1,081 of 2,376 done, London 396 of 421. Every fact checked against the article in `source`
  (`wiki_text.py`). The candidates for central London were all Historic England entries, so Wikipedia's nearby articles
  were also listed from the committed `wiki/gb-articles.tsv.gz` (up to 700 m). Neighbours already used got another
  item: Kensal Green Cemetery, St Pancras Old Church, Coal Drops Yard, HM Prison Pentonville, the Wharncliffe Viaduct,
  Strawberry Hill House, the Falcon, St Luke's Church and West Norwood Cemetery, the Purley Council Offices, the Fulwell
  bus garage and Battersea Railway Bridge were passed over; within the batch, the 16 stretches round Battersea and
  Vauxhall share out Battersea Power Station, the Dogs & Cats Home, Longhedge Works, Grosvenor Bridge, Chelsea Bridge,
  the Grosvenor Canal, 575 Wandsworth Road, St Paul's Clapham, the Grand, the Brown Dog's Latchmere Recreation Ground,
  the Shaftesbury Park Estate, Lots Road Power Station, the US Embassy, New Covent Garden Market and the London
  Necropolis station, one each. Passed over: the King's Cross fire, the 1945 King's Cross, 1937 Battersea Park, 1984
  Wembley Central and 1989 Purley rail crashes, the 1928 Vickers Vulcan crash, the Vauxhall helicopter crash, the 2000
  MI6 attack, the Chelsea Barracks bombing, the Finsbury Park van attack, the Grenfell Tower fire and the death of
  Gareth Williams. Every point is its article's own, from Wikipedia's geotags; Smithfield Market's is the Smithfield
  district's (157 m), and Teddington Cemetery's is its middle (133 m; Historic England puts its edge 12 m from the
  line). No point is our own calculation. The farthest items are the Brown Dog's recreation ground (331 m), Lots Road
  Power Station (328 m), Streatham Hill Theatre (271 m) and 575 Wandsworth Road (250 m); the rest are within 240 m.
  Blackfriars Railway Bridge, Grosvenor Bridge and Hungerford Bridge are `crosses`, as is the Gasworks Tunnel, and
  Drayton Green is a `station` item. Charing Cross to Waterloo, Drayton Green to Hanwell, Imperial Wharf to Queenstown
  Road and to Victoria, Clapham Junction to Victoria, Queenstown Road to Vauxhall, Vauxhall to Wandsworth Road,
  Caledonian Road & Barnsbury to Camden Road, and Streatham Hill to Tulse Hill and to West Norwood have no train
  company on the map; given items, not skipped. Step 8 done: 1,081 facts in `src/data/passes-near.json`; `npm run
  check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 24, 40 stretches of east and north London from Ilford to Manor
  Park through to Hendon to Mill Hill Broadway (the Great Eastern Main Line from Manor Park by Ilford, Seven Kings,
  Goodmayes and Chadwell Heath to Romford, Gidea Park and Harold Wood; the Romford to Upminster line by Emerson Park;
  Barking to Upminster, Dagenham Dock and Barking Riverside; Dagenham Dock by Rainham to Purfleet, and Upminster to
  Ockendon; the Gospel Oak to Barking line from Woodgrange Park by Wanstead Park, Leytonstone High Road, Leyton Midland
  Road, Walthamstow Queen's Road and Blackhorse Road to South Tottenham and Harringay Green Lanes; the Chingford line from
  Clapton by St James Street, Walthamstow Central, Wood Street and Highams Park to Chingford; Camden Road to Kentish Town
  West, South Hampstead and St Pancras; the Watford DC line from Euston by South Hampstead and Kilburn High Road to
  Queens Park and Kensal Green; and the Midland Main Line from St Pancras by Kentish Town, West Hampstead Thameslink,
  Cricklewood, Brent Cross West and Hendon to Mill Hill Broadway); 1,041 of 2,376 done, London 356 of 421. Every fact
  checked against the article in `source` (`wiki_text.py`). Neighbours already used got another item: Kensal Green
  Cemetery (on two stretches already) gave way to Kensal Rise Library, and Woodgrange Park and Manor Park cemeteries,
  Walthamstow Marshes, the Markfield Beam Engine, Harringay Arena, the Kiln Theatre and Keats House were passed over;
  within the batch, Hare Hall goes to Gidea Park to Harold Wood (Romford Market to Gidea Park to Romford), Eastbury
  Manor House to Barking to Dagenham Dock (Barking Abbey to Barking Riverside to Barking), Upminster Windmill to Barking
  to Upminster (Hornchurch Cutting to Emerson Park to Upminster), Rainham Hall and St Helen and St Giles one each, and
  St Pancras Old Church to Camden Road to St Pancras (Coal Drops Yard to Kentish Town to St Pancras). Passed over: the
  1915 and 1944 Ilford rail crashes, the Freshwater Road fire, the Leytonstone tube station attack, the killing of Mark
  Duggan, the Staples Corner bombing, the Ladbroke Grove rail crash and the murder of Richard Everitt; Wanstead Park,
  whose article's point is 1.5 km away; and items known here only from Historic England's list, whose pages can't be
  read from here (Chestnuts House, the Purfleet magazine, the Soane tomb on its own). Points are the articles' own, from
  Wikipedia's geotags, except three from Historic England's list: the City of London Cemetery (the park's entry point,
  534 m; its edge is 16 m from the line), the Alexandra Road Estate and the Isokon Flats (the article's point for the
  estate, 139 m away, would have given it a side; the list's is beside the line). No point is our own calculation. The
  farthest items are Barking Abbey (574 m), the City of London Cemetery (534 m), St Peter-in-the-Forest (499 m) and
  Romford Market (475 m); the rest are within 410 m. Hornchurch Cutting and the Primrose Hill tunnels are `crosses`,
  Welsh Harp (closed in 1903) a `station` item, and the Alexandra Road Estate is beside the line with no side. Camden
  Road to South Hampstead and Camden Road to St Pancras have no train company on the map; given items, not skipped.
  Step 8 done: 1,041 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 23, 40 stretches of south-east and east London from Bickley to
  Petts Wood through to Forest Gate to Manor Park (the Bickley and Chislehurst loops to Petts Wood and St Mary Cray, St
  Mary Cray to Swanley; Chislehurst by Elmstead Woods to Grove Park, Sundridge Park and Bromley North; Petts Wood by
  Orpington and Chelsfield to Knockholt; the Bexleyheath line from Blackheath by Kidbrooke, Eltham, Falconwood, Welling,
  Bexleyheath and Barnehurst to Slade Green; Abbey Wood by Belvedere and Erith to Slade Green, and Slade Green to
  Dartford and Crayford; the Sidcup line from Hither Green by Lee, Mottingham, New Eltham, Sidcup, Albany Park and
  Bexley to Crayford; Fenchurch Street to Limehouse, and Limehouse to West Ham and Stratford; Barking to West Ham and
  Woodgrange Park; and Stratford by Maryland and Forest Gate to Manor Park and Woodgrange Park, and Stratford
  International to Stratford); 1,001 of 2,376 done, London 316 of 421. Every fact checked against the article in
  `source` (`wiki_text.py`). Neighbours already used got another item: Chislehurst Junction (on Bickley to St Mary Cray)
  gave way to Jubilee Country Park and Chislehurst Caves, and the Orbit, the Aquatics Centre, V&A East and the VeloPark
  round Stratford to Stratford Works, the Theatre Royal and Tower Hamlets Cemetery Park; within the batch, the Daylight
  Inn, Chislehurst Caves, Elmstead Pit, Slade Green Depot and Crofton Roman Villa each go to the one stretch nearest
  them. Passed over: the murder of Stephen Lawrence, the Eltham Well Hall and Hither Green rail crashes, the West Ham
  station attack, the bombing of Sandhurst Road School and the Battle of Cable Street; and items known here only from
  Historic England's list, whose pages can't be read from here (the Fordcroft and Howbury monuments, the St Mary Cray,
  Erith and Bexley churches). Eltham Palace (693 m) and Barking Abbey (734 m) were left as too far, for Eltham College and
  London Sri Murugan Temple. Points are the articles' own, from Wikipedia's geotags; the Tower of London's is its
  article's centre (326 m), not the World Heritage Site's edge. No point is our own calculation. The farthest items are
  St Augustine's Church, Slade Green (535 m), Jubilee Country Park (515 m), Lamorbey Park (483 m) and Eltham College
  (472 m); the rest are within 465 m. Barnehurst is a `station` item; Orpington's engine shed is beside the line, with
  no side. Bickley to Petts Wood, Limehouse to Stratford and Forest Gate to Woodgrange Park have no train company on the
  map; given items, not skipped. Step 8 done: 1,001 facts in `src/data/passes-near.json`; `npm run check` and `npm run
  build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 22, 40 stretches of south-east London from Brockley to New
  Cross Gate through to Bickley to St Mary Cray (London Bridge to New Cross Gate, New Cross, South Bermondsey and
  Deptford, and Cannon Street to London Bridge; Queens Road Peckham to South Bermondsey, Peckham Rye and Surrey Quays;
  the East London line from Surrey Quays by Canada Water and Rotherhithe through the Thames Tunnel to Wapping and
  Shadwell, and from New Cross Gate and New Cross to Surrey Quays; New Cross by St Johns to Lewisham; Deptford by
  Greenwich, Maze Hill and Westcombe Park to Charlton; the Hayes line from Ladywell by Catford Bridge, Lower Sydenham,
  New Beckenham, Clock House, Elmers End and Eden Park to West Wickham and Hayes, and New Beckenham to Beckenham
  Junction; Beckenham Junction to Shortlands, Ravensbourne and Beckenham Hill, Bellingham, Catford and Crofton Park to
  Nunhead; Shortlands by Bromley South to Bickley and St Mary Cray); 961 of 2,376 done, London 276 of 421. Every fact
  checked against the article in `source` (`wiki_text.py`). Neighbours already used got another item: Telegraph Hill,
  Nunhead Cemetery, the Rivoli Ballroom, St George's Church, Beckenham and The Valley are on stretches next door, so
  these have New Cross Gate Cutting, the Brockley Jack Theatre, Catford Stadium, Kent Championships and Woodlands House
  instead; within the batch, the five stretches out of London Bridge share out Southwark Cathedral, St James's Church,
  Bermondsey, Maltby Street Market, Neckinger Mills and the London and Greenwich Railway's viaduct, and East Greenwich
  Pleasaunce goes to Maze Hill to Westcombe Park, which its article says it lies beside. Cannon Street to London Bridge
  has Southwark Cathedral, not the Thames crossing, as Cannon Street Railway Bridge has no article or position of its
  own. Passed over: the New Cross house fire, the 1957 Lewisham and 1898 St Johns rail crashes, the Spa Road Junction
  crash, the 2022 Bermondsey stabbing, the murder of Maxwell Confait, the Ratcliff Highway murders, the Siege of Sidney
  Street and the Battle of Cable Street; and the Elmers End moated site, known here only from Historic England's list,
  whose pages can't be read from here. Every point is its article's own; the Bowie Bandstand's and Long Lane Wood's come
  from Wikipedia's geotags, as their articles' text has none. No point is our own calculation. The farthest items are
  the Bowie Bandstand (637 m), St Mary the Virgin, Hayes (632 m), Beckenham Place Park (581 m), the Wellcome Research
  Laboratories (572 m), Woodlands House (558 m) and Kent Championships (542 m); the rest are within 500 m. Peckham Rye
  is a `station` item; the viaduct and the Thames Tunnel are `crosses`. Step 8 done: 961 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 21, 40 stretches of south London from Balham to Mitcham
  Eastfields through to Brockley to Honor Oak Park (Balham and Streatham to Mitcham Eastfields and Mitcham Junction, by
  Hackbridge to Carshalton; Streatham Common to Streatham; Balham to Streatham Hill; Herne Hill by Tulse Hill and West
  Dulwich, West Norwood to Gipsy Hill and Crystal Palace; Sydenham Hill by Penge East and Kent House to Beckenham
  Junction and Birkbeck; Crystal Palace to Birkbeck, Norwood Junction and Sydenham; Norwood Junction by Selhurst to East
  Croydon, South Croydon, Purley Oaks and Purley; Purley by Reedham to Coulsdon Town, Woodmansterne and Coulsdon South,
  and Purley by Kenley to Whyteleafe; South Croydon by Sanderstead and Riddlesdown to Upper Warlingham; and Norwood
  Junction by Anerley, Penge West, Sydenham and Forest Hill to Honor Oak Park and Brockley); 921 of 2,376 done, London
  236 of 421. Every fact checked against the article in `source` (`wiki_text.py`). Neighbours already used got another
  item: Tooting Bec Lido, The Bedford, Streatham Ice and Leisure Centre, the Herne Hill Velodrome, Carshalton House,
  Croydon Common Athletic Ground and RAF Kenley (its fighter pens) are on stretches next door, so these have the site of
  Battersea Grammar School, Oakleigh Way, St Leonard's Church, the Half Moon, Wilderness Island, No. 1 Croydon (the "50p
  Building") and Whyteleafe instead; within the batch, Crystal Palace Park is shared out (the Dinosaurs, the National
  Sports Centre and the transmitting station), and Riddlesdown and Riddlesdown Common take the two stretches by
  Riddlesdown. Passed over: the 2020 Streatham stabbing, the Purley rail crash, the 1924 and 1928 Imperial Airways
  crashes, the Croydon poisonings and the 1913 arson at Sanderstead station; St Bartholomew's, Sydenham, the Newe Ditch
  on Riddlesdown and the Streatham waterworks pumping station, known here only from Historic England's list, whose pages
  can't be read from here; and Riddlesdown Tunnel, which has no sourced position. Points from Historic England's list
  rather than an article: the Half Moon, Dulwich College's main building, Six Pillars, St George's Church, Beckenham,
  St John the Evangelist, Upper Norwood, Holy Innocents, South Norwood, the Croydon, Merstham and Godstone Railway's
  embankment at Coulsdon (the list entry the Surrey Iron Railway article cites) and the Horniman Museum. West Norwood
  Cemetery takes its article's point (the middle), not the nearest edge of the listed park; the Croydon Canal item takes
  Betts Park's point. No point is our own calculation. The farthest items are Mitcham Cricket Green (585 m), the
  Horniman Museum (561 m) and Whitgift School (550 m); the rest are within 500 m. Coulsdon Town is a `station` item.
  Step 8 done: 921 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 20, 40 stretches of north, east and south London from Bruce
  Grove to White Hart Lane through to Balham to Tooting (the Enfield Town and Cheshunt lines from Bruce Grove by White
  Hart Lane, Silver Street, Edmonton Green and Bush Hill Park to Enfield Town, and by Southbury to Turkey Street; Clapton
  to Hackney Downs and Tottenham Hale; the Lea Valley line from Lea Bridge and Tottenham Hale by Northumberland Park,
  Meridian Water, Ponders End, Brimsdown and Enfield Lock to Waltham Cross, and Lea Bridge to Stratford; the Elizabeth
  line from Stratford, Shadwell and Canary Wharf to Whitechapel, Custom House to Canary Wharf, and Custom House by
  Woolwich to Abbey Wood; the North Kent line from Abbey Wood by Plumstead, Woolwich Arsenal and Woolwich Dockyard to
  Charlton and Blackheath, and Blackheath to Lewisham; Lewisham by Nunhead to Peckham Rye; Denmark Hill and East
  Dulwich to Peckham Rye, East Dulwich by North Dulwich to Tulse Hill; Streatham to Tulse Hill and Tooting; Haydons
  Road to Tooting and Wimbledon; and Balham to Tooting); 881 of 2,376 done, London 196 of 421. Every fact checked
  against the article in `source` (`wiki_text.py`). Neighbours already used got another item: Tooting Bec Lido (on
  Balham to Streatham Common) gave way to The Bedford, and Mossbourne Community Academy (on Hackney Central to Rectory
  Road) to the Clapton Cinematograph Theatre; within the batch, the Royal Arsenal's buildings are shared out (the Grand
  Store, the Royal Brass Foundry, and the Manor Ground for Arsenal's early days), and Ripaults Factory and St James'
  Church share the stretches either side of Southbury. Passed over: the killing of Mark Duggan, the Lewisham rail
  crash, the murder of Lee Rigby, the Siege of Sidney Street, the Ratcliff Highway murders, the 2020 Streatham
  stabbing, the 1938 Hawker Audax crash, the Lakanal House fire, the Enfield poltergeist, Drumsheds (its licence under
  review after incidents) and the Charles Bravo inquest at The Bedford. Points from Historic England's list rather than
  an article: Bruce Castle, All Saints' Church, Edmonton, the Eleanor Cross, St Dunstan's, Trinity Green, St Anne's
  Limehouse, the Grand Store, St Nicholas Church, the Royal Brass Foundry and Morden College. Telegraph Hill and Nunhead
  Cemetery take their articles' points (an area and the cemetery's middle). No point is our own calculation. The
  farthest items are the Eleanor Cross (506 m), Enfield Power Station (477 m) and the Lee Valley VeloPark (473 m); the
  rest are within 380 m. Lewisham to Nunhead has no train company on the map but carries Southeastern trains, and
  Balham to Tooting (4.5 km, by the Streatham curves) has few passenger trains; both given items, not skipped. Step 8
  done: 881 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 19, 40 stretches of north, central and east London from Bowes
  Park to Palmers Green through to Bruce Grove to Seven Sisters (the Hertford loop from Bowes Park by Palmers Green,
  Winchmore Hill, Grange Park and Enfield Chase to Gordon Hill and Crews Hill; Finsbury Park to Harringay; the Northern
  City line from Finsbury Park by Drayton Park, Highbury & Islington and Essex Road to Old Street and Moorgate; the North
  London line from Caledonian Road & Barnsbury by Highbury & Islington and Canonbury; the Elizabeth line from London
  Paddington by Bond Street, Tottenham Court Road, Farringdon and Moorgate to Whitechapel; the East London line from
  Whitechapel by Shoreditch High Street, Hoxton and Haggerston to Dalston Junction and Dalston Kingsland; the North
  London line by Hackney Central, Homerton and Hackney Wick to Stratford, with High Speed 1's tunnels from Dalston
  Kingsland and Homerton to Stratford International; Bethnal Green to Liverpool Street, Stratford and Cambridge Heath;
  London Fields and Hackney Downs; and the Chingford and Enfield lines by Rectory Road, Stoke Newington and Stamford Hill
  to Seven Sisters and Bruce Grove); 841 of 2,376 done, London 156 of 421. Every fact checked against the article in
  `source` (`wiki_text.py`). Neighbours already used got another item: Bounds Green tube station (on Alexandra Palace
  to Bowes Park) gave way to Broomfield House; within the batch, the Museum of the Home and Hoxton Hall share the
  stretches by Hoxton, the Clowns Gallery, the Vortex Jazz Club and the Rio Cinema those by Dalston, St Augustine's
  Tower, Sutton House and the Hackney Empire those round Hackney Central, and V&A East, the Aquatics Centre and the
  Orbit those by Stratford. Passed over: the 2017 Finsbury Park van attack, the 21 July 2005 bombings, the Siege of
  Sidney Street, the Hackney siege, the Wood Green ricin plot and a murder by Rectory Road; and the earthworks at Old
  Park, as no source here says they are the hill fort the Enfield Old Park article describes. Points from Historic
  England's list rather than an article: Broomfield House, John Wesley's House, the London Charterhouse (the Master's
  Lodge), Sir John Soane's Museum, 25 Brook Street, Marble Arch, Christ Church Spitalfields, The Theatre, the Museum of
  the Home, Hoxton Hall, St Augustine's Tower, Sutton House, St Mary of Eton, the Young V&A, Keeling House and the
  Hackney Empire. Bunhill Fields and Abney Park Cemetery take their articles' points (the middle), not the nearest edge
  of the listed park. No point is our own calculation. The farthest items are All Hallows-on-the-Wall (436 m), The
  Theatre (402 m) and Broomfield House (362 m); the rest are within 340 m. High Speed 1's two stretches (Dalston
  Kingsland and Homerton to Stratford International) run in tunnel with no stop; given items, not skipped, as on
  earlier stretches of that kind. Step 8 done: 841 facts in `src/data/passes-near.json`; `npm run check` and `npm run
  build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 18, 40 stretches of west and north London from Clapham
  Junction to Wandsworth Common through to Alexandra Palace to Bowes Park (Clapham Junction to Wandsworth Common; the
  West London line from Clapham Junction over the Thames by Imperial Wharf, West Brompton, Kensington Olympia and
  Shepherd's Bush to Willesden Junction; the West Coast Main Line and the Watford DC line from Willesden Junction by
  Harlesden, Stonebridge Park, Wembley Central, North Wembley, South Kenton, Kenton and Harrow & Wealdstone to Headstone
  Lane and Hatch End; Acton Central to Willesden Junction, South Acton, Gunnersbury and Kew Gardens; the North London
  line from Willesden Junction by Kensal Rise, Brondesbury, West Hampstead, Finchley Road & Frognal and Hampstead Heath
  to Gospel Oak and Kentish Town West; the Gospel Oak to Barking line by Upper Holloway, Crouch Hill and Harringay Green
  Lanes; and the Hertford loop and East Coast Main Line from Harringay and Hornsey by Alexandra Palace to New Southgate,
  Oakleigh Park, New Barnet, Hadley Wood and Bowes Park); 801 of 2,376 done, London 116 of 421. Every fact checked
  against the article in `source` (`wiki_text.py`). Neighbours already used got another item: the Falcon and Wandsworth
  Common Windmill (on Clapham Junction to Wandsworth Town and to Earlsfield) and Chez Bruce (on Balham to Wandsworth
  Common) gave way to the Royal Victoria Patriotic Building, and the Palm House (on Kew Gardens to Richmond) to the
  National Archives; within the batch, the Ace Cafe, Stonebridge Park power station, Wembley Central Mosque and Our Lady
  of Willesden share the stretches round Stonebridge Park, Keats House and Parliament Hill Lido those by Hampstead Heath,
  and Harringay Arena and Railway Fields the two lines from Crouch Hill. Passed over: the Clapham Junction, Harrow and
  Wealdstone and Wembley Central rail crashes, the Kentish Town rail accident, the Grenfell Tower fire and two murders;
  the London Welsh School (it left Stonebridge Park in 2015), Alexandra Palace (the palace is 840 m from
  the line) and items known only from Historic England's list, whose pages can't be read from here (Pinner Park Farm's
  deer park, All Souls at Harlesden, All Hallows at Gospel Oak, the Goldsmiths' almshouses at Acton). Battersea Railway
  Bridge is `crosses`; Hatch End station is `station`; Camden Town Brewery, in the arches under Kentish Town West
  station, has no side. Every point is the article's own; none is our own calculation. The farthest item is Harrow
  Skate Park (478 m), the rest are within 400 m. Step 8 done: 801 facts in `src/data/passes-near.json`; `npm run
  check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 17, 40 stretches of south and south-west London from
  Isleworth to Syon Lane through to Balham to Wandsworth Common (Isleworth to Syon Lane; Barnes by Putney and Wandsworth
  Town to Clapham Junction; the main line from Clapham Junction by Earlsfield to Wimbledon and Raynes Park, New Malden,
  Berrylands and Surbiton; the Kingston loop from New Malden by Norbiton and Kingston to Hampton Wick and Teddington;
  the Chessington branch from Motspur Park by Malden Manor and Tolworth to Chessington South; Motspur Park to Worcester
  Park; the Sutton loop from Wimbledon by Wimbledon Chase, South Merton, Morden South, St Helier, Sutton Common and West
  Sutton to Sutton; Cheam, Belmont, Carshalton and Carshalton Beeches to Sutton; Carshalton Beeches by Wallington and
  Waddon to West Croydon; and Selhurst by Thornton Heath and Norbury to Streatham Common and Balham); 761 of 2,376
  done, London 76 of 421. Every fact checked against the article in `source` (`wiki_text.py`). Neighbours already used
  got another item: Isleworth Studios (on Hounslow to Isleworth) gave way to the Quaker meeting house on Isleworth to
  Syon Lane, and Surbiton Studios and Seething Wells to Surbiton station on Berrylands to Surbiton; within the batch,
  Baitul Futuh and St Lawrence Church share the stretches by Morden South, the Pyl Brook and Gander Green Lane those by
  Sutton Common, and the Falcon and Wandsworth Common Windmill those by Clapham Junction. Passed over: the Barnes and
  Clapham Junction rail crashes, Marc Bolan's shrine (all fatal) and a murder near Clapham Junction. Kingston Railway
  Bridge is `crosses`; Surbiton and Raynes Park stations are `station`. Points from Historic England's list rather
  than an article: the Lovekyn Chapel, Normansfield, Whitehall at Cheam and Carshalton House. No point is our own
  calculation. The farthest item is the Norbury Estate (723 m, the article's point for the estate as a whole), nothing
  nearer on Norbury to Streatham Common being as good; the rest are within 500 m. Step 8 done: 761 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 16, 40 stretches from Ashurst (Kent) to Eridge through to
  Brentford to Syon Lane (the Uckfield branch from Ashurst by Eridge, Crowborough and Buxted to Uckfield, Angmering and
  Arundel to Littlehampton, Addlestone to Byfleet & New Haw, Sandwich to Thanet Parkway, then London: the Chiltern Main
  Line from Denham by West Ruislip, South Ruislip, Northolt Park and Sudbury to Wembley Stadium and Marylebone,
  Harrow-on-the-Hill to Marylebone and to Rickmansworth, the Heathrow branches, Ashford (Surrey) to Feltham, the
  Hounslow Loop to Whitton, Isleworth, Brentford and Barnes Bridge, the Shepperton branch from Hampton by Fulwell and
  Strawberry Hill to Twickenham, and Twickenham by Richmond, Mortlake and Barnes); 721 of 2,376 done. This finishes the
  South East (384 of 384) and starts London (36 of 421). Every fact checked against the article in `source`
  (`wiki_text.py`, which now unescapes the index's titles, so articles with "&" in the name are found). Neighbours
  already used got another item: Brooklands and its Concorde gave way to the London Bus Museum on Addlestone to Byfleet
  & New Haw, Richborough and St Augustine's Cross to White Mill on Sandwich to Thanet Parkway, and Lyminster church
  (the Slayer's Slab is in it) to Littlehampton and its lifeboat station; within the batch, Lord's and Abbey Road
  Studios share the approach to Marylebone, Hounslow Heath and Feltham marshalling yard the line round Feltham, and
  Strawberry Hill House and Fulwell bus garage the stretches by Strawberry Hill. Passed over: the Ruislip, Northolt and
  Heathrow air crashes, the Barnes rail crash, Marc Bolan's shrine and the 1838 Harrow rail accident, all fatal.
  Harefield Road (never built) is `station`; Richmond and Barnes railway bridges are `crosses`. Points from Historic
  England's list rather than an article: the iron furnace near Buxted, Sudbury Town station, The More and the Palm House
  at Kew. Our own point, not a sourced figure: Bushy Park's (the nearest edge of the listed park, 176 m). The farthest
  items are Littlehampton (634 m), the Palm House (582 m) and the London Bus Museum (575 m), nothing nearer on those
  stretches being as good. Step 8 done: 721 facts in `src/data/passes-near.json`; `npm run check` and `npm run build`
  pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 15, 40 stretches from Bletchley to Milton Keynes Central
  through to Ashurst (Kent) to Cowden (Kent) (the West Coast Main Line from Wolverton by Milton Keynes Central, Bletchley,
  Leighton Buzzard and Cheddington to Tring, the Marston Vale line from Bletchley by Fenny Stratford and Bow Brickhill to
  Woburn Sands, the Island Line from Ryde Pier Head to Shanklin, the Shepperton branch from Hampton, the Tattenham Corner
  line from Woodmansterne, Banstead to Epsom Downs and Belmont, the Quarry line from Coulsdon Town to Earlswood, Earlswood
  by Salfords to Horley, the Caterham branch, and the Oxted line from Upper Warlingham by Oxted to East Grinstead and
  Ashurst); 681 of 2,376 done, South East 376 of 384. Every fact checked against the article in `source`
  (`wiki_text.py`). Neighbours already used got another item: Bletchley Park (on Bicester Village to Bletchley) gave way
  to the National Bowl on Bletchley to Milton Keynes Central, the Royal Earlswood Hospital (on Earlswood to Redhill) to
  East Surrey Hospital, and Jaques of London (on Edenbridge to Penshurst) to the Eden Valley Museum; Red Bull Racing went
  to Bow Brickhill to Woburn Sands (184 m) rather than Bow Brickhill to Fenny Stratford, which has Magiovinium. Passed
  over: the Cowden rail crash (1994, fatal) and Emily Davison's death at Tattenham Corner (1913). Smallbrook Junction,
  Shepperton, Upper Halliford, Woodmansterne and Woldingham are `station`, those stretches having nothing better that
  could be checked. Our own points, not sourced figures: the nearest edges of the scheduled areas for Magiovinium (599
  m), Sandown Barrack Battery, Brading Roman villa, the Gally Hills barrows, Farthing Downs and the RAF Kenley fighter
  pens (576 m); and Oxted Tunnel and Limpsfield Tunnel (`crosses`), placed on the track 1.2 km and 400 m from Oxted, as
  no source gives their positions. Epsom College (583 m) and Magiovinium are the farthest items. Bletchley to Fenny
  Stratford (the Marston Vale line, no train company on the map) and Coulsdon Town to Earlswood (the Quarry line) were
  given items, as with earlier such stretches. Step 8 done: 681 facts in `src/data/passes-near.json`; `npm run check`
  and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 14, 40 stretches from Dover Priory to Martin Mill through to
  Bicester North to Kings Sutton (Dover Priory to Martin Mill, the Seaford branch from Southease by Newhaven to Seaford,
  Egham to Staines, the Windsor branch from Staines by Wraysbury and Datchet to Windsor & Eton Riverside, Ashford
  (Surrey) to Staines, Millbrook to Southampton Central, the Cherwell valley from Oxford by Tackley and Heyford to Kings
  Sutton, Oxford by Oxford Parkway and Islip to Bicester Village, the Chiltern Main Line from Bicester to Haddenham,
  Princes Risborough, High Wycombe, Beaconsfield, Gerrards Cross and Denham, the Aylesbury line from Princes Risborough
  and Aylesbury Vale Parkway by Aylesbury, Wendover and Amersham to Chorleywood, Bicester Village to Bletchley, and
  Bicester North to Kings Sutton); 641 of 2,376 done, South East 336 of 384. Every fact checked against the article in
  `source` (`wiki_text.py`). Neighbours already used got another item: Windsor Castle (on Slough to Windsor & Eton
  Central) gave way to Eton College on Datchet to Windsor & Eton Riverside, Dover Priory (on Dover Priory to Kearsney)
  to the Maison Dieu, and St Barnabas, Oxford (on Hinksey to Oxford) to Port Meadow and the Radcliffe Observatory; Kings
  Sutton's church went to Bicester North to Kings Sutton and Somerton's to Heyford to Kings Sutton. Dropped: Chequers
  (the house is 2 km from the line), Wotton House (1.4 km; the park's edge is near, the house isn't) and the Small Dean
  Viaduct (it carries HS2, not this line). Passed over: the Seer Green rail crash (1981) and BEA Flight 548 (1972), both
  fatal, and the Amersham Martyrs Memorial. Our own points, not sourced figures: the nearest edges of the scheduled areas
  for the Saxon palace at Old Windsor, the Roman settlement at Fleet Marston, Alchester (`crosses`), Notley Abbey and The
  Mount at Princes Risborough, and the Buckinghamshire to Hertfordshire boundary between Chalfont & Latimer and
  Chorleywood (`boundary`, where the track meets the county boundary on OpenStreetMap). Port Meadow's point is the
  article's (640 m), the meadow's edge being nearer. Bicester Village to Bletchley (East West Rail, no train company on
  the map) was given an item, as with earlier such stretches. Step 8 done: 641 facts in `src/data/passes-near.json`;
  `npm run check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 13, 40 stretches from Adisham to Bekesbourne through to
  Martin Mill to Walmer (the Dover line from Adisham by Canterbury East and Selling to Faversham, the Chatham Main
  Line from Faversham by Teynham, Sittingbourne, Newington, Rainham, Gillingham and Chatham to Rochester and Strood,
  Rochester by Sole Street and Meopham to Longfield, the Sheerness line from Sittingbourne and Newington by Kemsley
  and Swale to Sheerness, the Kent coast from Faversham by Whitstable, Herne Bay, Margate and Broadstairs to Ramsgate,
  Ramsgate by Thanet Parkway and Minster to Sturry, Canterbury West, Chartham, Chilham and Wye, and Minster by
  Sandwich and Deal to Walmer and Martin Mill); 601 of 2,376 done, South East 296 of 384. Every fact checked against
  the article in `source` (`wiki_text.py`). Fort Pitt went to Chatham to Rochester (142 m) rather than Chatham to
  Gillingham (505 m), which has the Chatham Naval Memorial. Passed over: the memorials to the Faversham munitions
  explosion (1916), the Deal barracks bombing, and a death at Ripple Mill (not mentioned). Our own points, not
  sourced figures: the Medway crossing (`crosses`, the track's nearest point to Rochester Bridge's article
  coordinates), the Kingsferry Bridge (`crosses`, likewise) and Godmersham Park (the nearest edge of the listed
  park; the facts come from the Godmersham article, as Godmersham Park's own has no coordinates). Kemsley to
  Newington (the chord avoiding Sittingbourne) and Minster to Sandwich (no train company on the map) were given
  items, as with earlier such stretches. Two items are about 600 m off (the Dickens House Museum and the Montefiore
  Synagogue), nothing nearer on those short Thanet stretches being as good. Step 8 done: 601 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 12, 40 stretches from Beltring to Paddock Wood through to
  Adisham to Aylesham (Paddock Wood to Tonbridge, the South Eastern Main Line from Paddock Wood by Marden and
  Staplehurst to Headcorn and Pluckley, the Maidstone line from Ashford by Charing, Lenham, Hollingbourne and Bearsted
  to Maidstone East, then Barming, West Malling and Borough Green to Otford, the Marshlink line from Ashford by Ham
  Street, Appledore, Rye and Winchelsea to Ore and Hastings, Hastings to West St Leonards, Ashford to Wye and to
  Westenhanger, Sandling and Folkestone to Dover, and the Dover line from Dover Priory to Adisham); 561 of 2,376 done,
  South East 256 of 384. Every fact checked against the article in `source` (`wiki_text.py`). Neighbours already
  used got another item: Beltring to Paddock Wood (the Hop Farm is on Beltring to Yalding) has the John Brunt V.C.
  pub; Kemsing to Otford (Otford Palace and the Roman villa are on the other Otford stretches) has Greatness
  Brickworks; Barming to Maidstone East and Bearsted to Maidstone East (the Archbishop's Palace and Allington Castle
  used) have Maidstone Museum and Mote Park. Passed over: the Staplehurst rail crash (1865) and the Marden collision
  (1969), both fatal, and a 2021 murder at Snowdown; Becket's murder is not mentioned for Saltwood Castle, and the
  Securitas robbery near Tonbridge was left for Somerhill House. Our own points, not sourced figures: Godinton Park
  and Leeds Castle (inside or on the edge of the listed park), Oldbury hillfort, Winchelsea and Saltwood Castle
  (inside the scheduled area, nearest the track), and where the Marshlink line crosses the Royal Military
  Canal (`crosses`, where the track meets the scheduled area). Doleham is `station`. Hollingbourne House was dropped (its stated place on the hilltop doesn't match its point).
  Step 8 done: 561 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 23rd 2026 (Claude Code, scheduled task): batch 11, 40 stretches from Leigh to Penshurst through to
  Beltring to Yalding (the Redhill to Tonbridge line from Penshurst to Redhill, Coulsdon South to Redhill, Tonbridge
  by Hildenborough to Sevenoaks and Knockholt, the Maidstone line from Sevenoaks by Otford, Eynsford and Swanley to
  Longfield, High Speed 1 from Ashford, Ebbsfleet to Gravesend, the North Kent line from Crayford to Strood, and
  the Medway Valley line from Strood by Maidstone to Beltring); 521 of 2,376 done, South East 216 of 384. Every
  fact checked against the article in `source` (`wiki_text.py`). Neighbours already used got another item:
  Hildenborough to Tonbridge (Tonbridge Castle is on High Brooms to Tonbridge) has the site of Tonbridge Priory;
  Bat & Ball to Otford has Otford's Roman villa, as the palace (nearer Otford to Shoreham's line) went there; the
  Shoreham Memorial Cross was dropped, its point being more than 1 km from the track. Our own points, not sourced
  figures: the South Darenth viaduct (a point on the track near the Darent, from the village article), the Medway
  Viaduct and Merstham Tunnel (the track's nearest point to each article's coordinates); Otford Palace's point is
  the nearest edge of the scheduled area, Penshurst Place's and Knole's of their listed parks. Redhill Tunnel is
  `crosses` (the Tonbridge line passes over its covered way) with the article's point, 309 m off. Ashford to
  Farningham Road is the Fawkham Junction link from High Speed 1, probably with no regular passenger train; given
  an item, not skipped, as with earlier possible avoiding lines. Merstham Tunnel's 1905 murder was passed over.
  Step 8 done: 521 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 22nd 2026 (Claude Code, scheduled task): batch 10, 40 stretches from Surbiton to Thames Ditton
  through to Leigh to Tonbridge (the Hampton Court branch, Leatherhead to Epsom and Worcester Park, Epsom to
  Cheam, Gatwick Airport to Three Bridges, Cooksbridge to Lewes, Brighton to Lewes, the East Coastway from Lewes
  to Southease and by Glynde, Polegate, Eastbourne, Pevensey and Bexhill to West St Leonards, the Hastings line
  from Crowhurst by Battle, Robertsbridge, Etchingham and Wadhurst to Tonbridge, and Leigh to Tonbridge); 481 of
  2,376 done, South East 176 of 384. Every fact checked against the article in `source` (`wiki_text.py`).
  Neighbours already used got another item: Cooksbridge to Plumpton (Plumpton Racecourse is on Plumpton to
  Wivelsfield) has East Chiltington; Brighton to London Road (the London Road Viaduct is on Brighton to Preston
  Park) has the Toy and Model Museum; Ashtead to Leatherhead (the Running Horse and the theatre are on the other
  Leatherhead stretches) has Ashtead Common. Falmer to Lewes is `crosses` (the Greenwich meridian, at the point
  where the track meets longitude 0°0'5.4" W, from the Lewes article), so Lewes Priory went to Lewes to
  Southease. The Epsom riot (a police sergeant died) was passed over. Stoneleigh and Frant are `station`.
  Step 8 done: 481 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 22nd 2026 (Claude Code, scheduled task): batch 09, 40 stretches from Brighton to Hove through to
  Walton-on-Thames to Weybridge (Brighton to Hassocks, the Brighton Main Line north by Burgess Hill, Haywards
  Heath and Balcombe to Three Bridges, the Arun Valley line from Crawley by Horsham and Pulborough to Arundel,
  Horsham to Dorking and Leatherhead, the New Guildford Line from Leatherhead and Guildford to Surbiton, and
  Esher to Weybridge); 441 of 2,376 done, South East 136 of 384. Every fact checked against the article in
  `source` (`wiki_text.py`). Neighbours already used got another item: Brighton to Preston Park (Preston Manor
  is on Hove to Preston Park) has the London Road Viaduct; Guildford to London Road (the castle, cathedral and
  university are on other Guildford stretches) has the Royal Grammar School; Bookham to Leatherhead (the Running
  Horse is on Box Hill to Leatherhead) has the Leatherhead Theatre. Clayton Tunnel and the Ouse Valley Viaduct are
  `crosses` (the tunnel's 1861 crash isn't mentioned); Roffey Road Halt (closed in 1937) and Ockley are `station`,
  Holmwood to Ockley having nothing else within 1 km that could be checked. Amberley Museum's facts come from the
  Amberley Museum Railway article (the museum's own wouldn't load from the index). Step 8 done: 441 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 22nd 2026 (Claude Code, scheduled task): batch 08, 40 stretches from Guildford to Worplesdon
  through to Hove to Preston Park (the Portsmouth Direct line from Guildford by Godalming, Haslemere and
  Petersfield to Havant, then the West Coastway from Bedhampton and Hilsea by Emsworth, Chichester,
  Bognor Regis, Arundel, Worthing and Shoreham to Hove); 401 of 2,376 done, South East 96 of 384. Every
  fact checked against the article in `source` (`wiki_text.py`). Neighbours already used got another item:
  Guildford to Worplesdon (the University of Surrey and Guildford Castle are on the other Guildford
  stretches) has the cathedral; Bedhampton to Hilsea (Hilsea Lines is on Cosham to Hilsea) has the site of
  Portsmouth Airport. Arundel Castle was dropped for Arundel to Ford, as the castle itself is 1.4 km from
  the line (only the park's edge is near): the Slayer's Slab at Lyminster instead, and St Nicholas Church,
  Poling for Angmering to Ford. The Phillips Memorial Cloister at Godalming (the Titanic) and Emsworth's
  oyster poisoning were passed over. For St Hubert's Church, Idsworth the point is Historic England's; its
  facts come from the Idsworth article (the church has none of its own). Step 8 done: 401 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 22nd 2026 (Claude Code, scheduled task): batch 07, 40 stretches from Shawford to Winchester
  through to Woking to Worplesdon (the South East's main lines round Eastleigh, the Romsey and Fareham lines,
  Basingstoke to Woking, the Alton line, Aldershot to Ascot and Bracknell, and Ascot to Weybridge by Virginia
  Water and Chertsey); 361 of 2,376 done, South East 56 of 384. Every fact checked against the article in
  `source` (`wiki_text.py`). Neighbours already used got another item: Fleet and Brookwood to Farnborough
  (St Michael's Abbey and Farnborough Hill are on the North Camp line) have Fleet Pond and the Basingstoke
  Canal; Chandlers Ford to Romsey (Romsey Abbey and Broadlands used) has King John's House, from the Romsey
  article (it has none of its own); Aldershot to Ash (St Peter's, Ash used) has Holy Trinity, Aldershot.
  St Ann's Hill has no article of its own: its facts come from Chertsey's, its point is Historic England's
  hillfort. The Chandler's Ford shooting (two killed) was passed over, as were the Jolly Farmer's hanged
  highwayman and the deaths at Basing House. For Basing House, Bagshot Park, Brooklands and Brookwood
  Cemetery the point is the nearest edge of the listed area. Hook to Winchfield and Fleet to Farnborough
  have no train company on the map but are the South Western main line. Step 8 done: 361 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 22nd 2026 (Claude Code): batch 06, 40 stretches from Axminster to Honiton through to
  Micheldever to Winchester (the West of England line from Honiton to Salisbury, Gloucester to Chepstow,
  Dorchester to Bournemouth and the New Forest, then the South East's first stretches: the Lymington
  branch, Andover and Basingstoke to Winchester). This finishes the South West (30 of 30). Every fact
  checked against the article in `source` (`wiki_text.py`). Yeovil Junction to Yeovil Pen Mill has no
  train company on the map; given an item, not skipped (it does no harm). Clarendon Palace was dropped
  for Dean to Grateley (1.5 km away), Borbach Chantry instead; Sway Tower is 1.4 km from the line, so the
  item is Sway itself, mentioning the tower. Points on the nearest edge of the listed area: Wardour
  Castle's park (Old Wardour's ruins have no coordinates in the index), Offa's Dyke at Sedbury; Newenham
  Abbey and Bishop's Dyke are `crosses` (the line runs through them). `candidates.py` now uses a list
  entry's point when its shape is empty (one near Poole stopped the script). Step 8 done: 321 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.
- November 22nd 2026 (Claude Code): batch 05, 40 stretches from Digby & Sowton to Polsloe Bridge through
  to Feniton to Honiton (the Exmouth branch, Southampton to Portsmouth by Netley and Fareham, the Greenford
  branch, Gatwick to Horley, the possible avoiding lines left in the Great Western part (Westbury, Didcot,
  Bristol, Worcestershire Parkway), then the first five South West stretches east of Exeter). This
  finishes the Great Western routes (271 of 271). Every fact checked against the article in `source`
  (`wiki_text.py`). Neighbours already used got another item: St Budeaux Victoria Road to Saltash has the
  Tamar Bridge (the Royal Albert Bridge is on St Budeaux Ferry Road to Saltash); Pilning to Severn Tunnel
  Junction has Severn Beach (the tunnel is on its other stretch; the Prince of Wales Bridge's point is
  mid-estuary, perhaps in Wales); Pinhoe to St James Park has Exeter's underground passages; Appleford to
  Swindon has Priory Cottages, Steventon. The avoiding lines were given items, as in batch 03, not skipped.
  For A la Ronde, Croome Court and Titchfield Abbey the point is the nearest edge of the listed area
  (A la Ronde's house is 1 km away, Croome Court's 2 km); Hilsea Lines is `crosses`, the railway passing
  through a gap 4 m from the scheduled area. Greenford is a `station`. Step 8 done: 281 facts in
  `src/data/passes-near.json`; `npm run check` (check-facts 24 of 24) and `npm run build` pass.
- November 22nd 2026 (Claude Code): batch size written down above (40, two or three a session), at
  John's word.
- November 22nd 2026 (Claude Code): batch 04, 40 stretches from Ashchurch for Tewkesbury to Cheltenham
  Spa through to Polsloe Bridge to St James Park (more Great Western routes: the stretches round
  Cheltenham and Gloucester, Westbury to Salisbury and Romsey, Reading to Guildford and Redhill (the North
  Downs Line), the Marlow and Windsor branches, and Exeter). Every fact checked against the article in
  `source` (`wiki_text.py`). Stretches whose obvious item was already used nearby got another: Reading
  West to Tilehurst (Elm Park is on Reading West to Reading Green Park) has the Reading Festival bridge;
  Mortimer to Reading Green Park (Mortimer station is on Bramley to Mortimer) has Reading Green Park
  station; Earley to Reading (Reading Abbey is on Reading to Twyford) has the siege of 1643. The Loddon
  Viaduct collapse of 1972 (three killed) was passed over for Earley to Winnersh Triangle, as was the
  Charfield crash in batch 03, as not something to greet a passenger with. Chilworth gunpowder mills'
  point is the nearest edge of the scheduled area. Step 8 done: `to_site.py` put all 241 items in
  `src/data/passes-near.json`; `npm run check` (check-facts 24 of 24) and `npm run build` pass.
- November 22nd 2026 (Claude Code): batch 03, 40 stretches from Nailsea & Backwell to Yatton through to
  Ashchurch for Tewkesbury to Worcestershire Parkway (Yatton to Weston-super-Mare and Highbridge, the Severn
  Tunnel and Bristol's north side, Bristol Parkway to Gloucester and Cheltenham, the Golden Valley line to
  Kemble and Swindon, and the Cotswold Line from Oxford to Hereford). No downloads: candidates from the
  committed `wiki/` files (six minutes), every fact checked against the article in `source`, read with
  `wiki_text.py`. Seven items are `crosses` (Gipsy Patch Lane Bridge, the Severn Tunnel, Huckford Viaduct,
  the Roman town at Dorn, the Colwall and Ledbury tunnels) and one a `station` (Adlestrop, closed in 1966,
  Edward Thomas's poem). For Blenheim, Dorn and the Evesham battlefield the point is the nearest edge of
  the area (from Historic England's shapes), so `check.py` agrees with the distance; the train only grazes
  Cornbury Park (six metres of track inside it), so that item says "along the edge" and its point is the
  house. Cheltenham Spa to Stonehouse is the curve round Gloucester: the live board at Stroud (9.30pm)
  showed its trains to Cheltenham calling at Gloucester, so probably no regular passenger train uses it;
  given an item anyway (it does no harm), not skipped. Cam & Dursley to Cheltenham Spa is used: CrossCountry
  trains from Bristol Parkway to Birmingham run to Cheltenham without calling at Gloucester.
- November 22nd 2026 (Claude Code): nothing to download any more. Wikipedia's article locations
  (`wiki/gb-articles.tsv.gz`), a cut-down index of where those articles sit in the articles dump
  (`gb-index.tsv.gz`) and their redirects (`gb-redirects.tsv.gz`) are committed, 7 MB in all, from the
  20261101 run (`wiki/README.md`: how they were made, the licence, how to remake them).
  `candidates.py` and `wiki_text.py` use them by default; 72 of the 74 sources of batches 01 and 02 are
  found without any download (the other two have no coordinates).
- November 22nd 2026 (Claude Code): batch 02, 40 stretches from Chapelton to Umberleigh through to
  Nailsea & Backwell to Parson Street (the Tarka Line's end, Exeter, Bridgwater to Taunton, the Heart of
  Wessex Line to Weymouth, Bruton to Westbury, Bath to Trowbridge, Chippenham to Trowbridge, Bristol
  Parkway to Swindon, and Bristol's local lines to Severn Beach). The first batch with Wikipedia from the
  dumps (step 2); every fact checked against the article in `source`, read from the articles dump
  (`wiki_text.py`, new), as Wikipedia's pages refused after eight reads. Four items are `crosses`
  (Poundbury Camp's tunnel, Avoncliff Aqueduct, Abona at Sea Mills; none is a station). Badminton House
  was dropped for Bristol Parkway to Swindon: the line passes 13 m from its park, not through it, and
  3.5 km from the house; the Health Hydro in Swindon instead. Tyntesfield's point is the edge of its park.
- November 22nd 2026 (Claude Code): Wikipedia from its database dumps. The search API refused most of
  batch 01's requests, so `wiki_dump.py` (new) turns three files of the 20261101 dumps (checksums
  checked) into one file of 105,329 articles with coordinates in Great Britain, and `candidates.py
  --wiki-dump` takes the nearby articles from it (same ranking, distances and sides; first sentences
  from each article's wikitext). Batch 01 run again (`batches/01/rerun/`): 223 Wikipedia candidates, four
  minutes. Its weakest items looked at again (eight stations, not nine as written below, and Roche's
  holy well): three replaced, each fact checked against its article: FMT-PNM Penmere station → the
  National Maritime Museum Cornwall; COP-MRD Morchard Road station → the church at Down St Mary (its
  churchyard cross once used as a paving slab); PMA-UMB Portsmouth Arms station → Brightley Barton and its
  moat walls. Kept: St Erth, St Columb Road, Coombe Junction, St Keyne Wishing Well and Kings Nympton
  stations, and Roche's holy well (the new candidates there are only hamlets; the River Mole at
  KGN-PMA was left, as where it meets the Taw couldn't be checked).
- November 22nd 2026 (Claude Code): batch 01, 40 stretches in Cornwall and Devon (Lelant Saltings to
  St Erth through to Portsmouth Arms to Umberleigh: the Falmouth, Newquay, Looe, St Ives, Gunnislake,
  Paignton, Okehampton and Barnstaple branches). Wikipedia's search refused most requests, so the
  candidates are mostly Historic England's; every fact was checked against the Wikipedia article in
  `source` (Historic England's own pages refuse automated reading, even through a fetch agent; only the
  name and grade from its list data were used without an article, for Roche's holy well). Nine items are
  stations (`kind` station), where the station was the most interesting thing that could be checked.
  SBF-SBV (51 m) is the 1941 link between the two St Budeaux lines, which Gunnislake trains use.

- November 22nd 2026 (Claude Code): set up. 2,376 stretches; the 81 items of the first five lines put on
  them (80 placed; the Elm Park item waits for John, above).
- November 22nd 2026 (Claude Code): John placed Elm Park on Reading West to Reading Green Park. All 81
  on the network. Wikipedia given trainchecker.baish.net as the contact; it was still refusing this
  session's requests an hour later.
