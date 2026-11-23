# "Your train passes near…": coverage

Every stretch of railway in England between neighbouring stations, worked through in John's order
(November 22nd 2026): the Great Western routes first, then the South West, the South East, London,
East Anglia (the East of England), the East Midlands, the West Midlands, Yorkshire and the Humber, the
North West and the North East. One item per stretch. Start each session with: "Read
design/passes-near/COVERAGE.md and do the next batch."

<!-- counts: made by coverage.py -->

2001 of 2376 stretches done.

1. Great Western routes: 271 of 271 done (done).
2. South West: 30 of 30 done (done).
3. South East: 384 of 384 done (done).
4. London: 421 of 421 done (done).
5. East of England (East Anglia): 237 of 237 done (done).
6. East Midlands: 140 of 140 done (done).
7. West Midlands: 191 of 191 done (done).
8. Yorkshire and The Humber: 238 of 238 done (done).
9. North West: 89 of 396 done (next).
10. North East: 0 of 68 done.

Next stretch in the order: LEY-PRE (Leyland to Preston (Lancs)).

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

- November 23rd 2026 (Claude Code, scheduled task): batch 48, 40 stretches of the North West from Maghull to Maghull North
  through to Euxton Balshaw Lane to Leyland (the Ormskirk line by Maghull, Old Roan, Aintree, Orrell Park and Walton to
  Kirkdale; the Southport line from Kirkdale by Bootle, Seaforth, Waterloo, Blundellsands, Hall Road, Hightown, Formby,
  Freshfield, Ainsdale, Hillside and Birkdale to Southport; the Manchester to Southport line from Southport by Meols Cop,
  Bescar Lane, New Lane, Burscough Bridge, Hoscar, Parbold, Appley Bridge, Gathurst and Pemberton to Wigan Wallgate; the
  Kirkby line by Orrell, Upholland, Rainford and Headbolt Lane to Kirkby; Kirkby by Fazakerley and Rice Lane to Walton;
  Wigan Wallgate to Wigan North Western; and the West Coast Main Line from Wigan North Western by Euxton Balshaw Lane to
  Leyland); 2,001 of 2,376 done, North West 89 of 396. 40 items, none skipped. Kept: Bootle Oriel Road to Kirkdale (no
  train company on the map; Merseyrail's Southport trains use it). Every fact checked against the article in `source`
  (`wiki_text.py`). Station items for Maghull North, New Lane, Rainford and Headbolt Lane (nothing else of interest near
  enough). Gathurst Viaduct and the Burscough Curves have no side (the train passes under the viaduct, and through the
  site of the curves). Aintree Institute and HM Prison Liverpool each kept to one stretch, so Devonfield Garden for Rice
  Lane to Walton. Left out: deaths (the prison's 1940 bombing and executions, Valentine's Brook's fatalities, the Hall Road
  rail accident); the 2021 Kirkby train crash passed over. Points: Wikipedia's geotags, except Historic England's list
  points for Old Christ Church (Waterloo), St John the Baptist Church (Burscough), All Saints' Church (Wigan), St Matthew's
  Church (Highfield) and St Chad's Church (Kirkby); no point is our own calculation, and every distance is to the item's
  point. For John: Crosby Beach (Another Place) is 738 m away, a little beyond the usual 700 m, kept as too good to miss.
  The other farthest items are Devonfield Garden (637 m), Our Lady and All Saints Church, Parbold (573 m), the Appley Bridge
  meteorite (551 m) and Crosby Battery (546 m); the rest are within 510 m. Step 8 done: 1,979 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 47, 40 stretches of the North West from Millom to Silecroft
  through to Maghull North to Town Green (the Cumbrian Coast line by Millom, Green Road, Foxfield, Kirkby-in-Furness and
  Askam to Barrow-in-Furness; the Furness line by Roose, Dalton, Ulverston, Cark, Kents Bank, Grange-over-Sands, Arnside,
  Silverdale and Carnforth to Bare Lane; the Morecambe and Heysham Port branch; Bare Lane to Lancaster and Lancaster to
  Preston; Preston to Salwick, Kirkham & Wesham, Poulton-le-Fylde, Layton and Blackpool North; the South Fylde line by Moss
  Side, Lytham, Ansdell & Fairhaven, St Annes and Squires Gate to Blackpool South; Preston to Croston, Rufford and Burscough
  Junction; and the Ormskirk line by Aughton Park and Town Green to Maghull North); 1,961 of 2,376 done, North West 49 of
  396. 40 items, none skipped. Kept: the Cumbrian Coast stretches with no train company on the map (the line's trains use
  them). Every fact checked against the article in `source` (`wiki_text.py`). Leven Viaduct and Arnside Viaduct are
  `crosses`. The Lindal railway incident (no one was hurt: the driver jumped clear) has no side: its point is 13 m from the
  track, and the engine lies beneath the railway. Leven Viaduct's 1903 storm (34 injured, none killed) is mentioned; the
  Lifeboat Memorial at Lytham (an 1886 disaster) and the Burscough Junction rail crash were passed over, and Duddon Inshore
  Rescue's item leaves out the drownings that led to it. Heysham Port, Askam and Ireleth, and Arnside are the stretches'
  own places, so Heysham's nuclear power stations, Duddon Inshore Rescue and Trowbarrow Quarry instead; Foxfield and
  Kirkby-in-Furness are kept (nothing else near). The Roman fort at Burscough is mentioned in the town's item, as Historic
  England's point for it is 785 m from the track. Points: Wikipedia's geotags, except Historic England's list points for
  Giant's Grave, Furness Abbey, St Walburge's Church, Penwortham Old Bridge, Rufford Old Hall and Burscough Priory; no
  point is our own calculation, and every distance is to the item's point. The farthest items are Greenhalgh Castle (664
  m), Lytham Hall (584 m), Duddon Inshore Rescue (579 m), the Midland Hotel (572 m) and St Annes Pier (565 m); the rest are
  within 550 m. Step 8 done: 1,939 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 46, the last 31 stretches of Yorkshire and The Humber, from Battersby
  to Kildale through to Poppleton to Selby (the Esk Valley line by Kildale, Commondale, Castleton Moor, Danby, Lealholm,
  Glaisdale, Egton, Grosmont, Sleights and Ruswarp to Whitby; Brigg to Kirton Lindsey; the Barton line by Barrow Haven, New
  Holland, Goxhill and Thornton Abbey; Burnley Manchester Road to Hebden Bridge by the Copy Pit line; Fitzwilliam to
  Normanton and Normanton to Streethouse; Meadowhall to Swinton; and the long stretches through York and Northallerton),
  then the first nine of the North West (the Cumbrian Coast from Corkickle and St Bees to Silecroft); 1,921 of 2,376 done,
  Yorkshire and The Humber 238 of 238 (finished), North West 9 of 396. 36 items and four stretches skipped: Bramley,
  Kirkstall Forge, Cottingley and Outwood to Woodlesford run through Leeds without calling there, and every passenger train
  calls at Leeds. Kept, though possibly little used: the stretches through York without calling (Doncaster, Selby and
  Poppleton to Thirsk, Ulleskelf and each other: a train that runs through York without stopping would use them), Thirsk to Yarm past Northallerton,
  Meadowhall to Swinton past Rotherham Central, Fitzwilliam to Normanton and Normanton to Streethouse past Wakefield Kirkgate
  (not sure no passenger train uses them), and Drigg to Seascale, Drigg to Ravenglass and Bootle to Silecroft (no train
  company on the map; the Cumbrian Coast line's trains use them). Every fact checked against the article in `source`
  (`wiki_text.py`). The York sights already used (the Bar Convent, Goddards, Bishopsbarns) and Doncaster's (the Minster, the
  Mansion House), so the Cold War Bunker, the Elmbank Hotel, Holgate Windmill and the Corn Exchange instead. Larpool Viaduct
  is `near`, not `crosses`: the train passes under it, and its point (mid-valley) is on the right going to Whitby. Points:
  Wikipedia's geotags, or Historic England's list points (Castleton castle mound, Duck Bridge, Lealholm's chapel, Beggar's
  Bridge, Thornton Abbey's gatehouse, Towneley Hall, the York Cold War Bunker, the Elmbank Hotel, the Corn Exchange, All
  Saints' Bolton Percy, St Bees Priory, Grey Croft and the Ravenglass bath house); no point is our own calculation, and every
  distance is to the item's point. For John: THORP's geotag is the same as the Magnox Reprocessing Plant's, so probably a
  point for that part of Sellafield rather than the building itself (638 m). The farthest items are the York Cold War Bunker
  (643 m), Castleton castle mound (634 m), THORP (638 m) and Thornton Abbey's gatehouse (607 m); the rest are within 600 m.
  Step 8 done: 1,899 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 45, 40 stretches of Yorkshire and The Humber from Eastrington to Gilberdyke through to Battersby to Great Ayton (Eastrington,
  Howden, Wressle and Selby; Selby to York by Hambleton; Malton to York and to Seamer; Scarborough, Seamer, Filey, Hunmanby,
  Bempton and Bridlington; Bridlington, Nafferton, Driffield, Hutton Cranswick, Arram, Beverley and Cottingham; Cottingham,
  Hessle and Hull; Gilberdyke, Broomfleet, Brough and Ferriby to Hessle; Thorne South, Crowle, Althorpe and Scunthorpe to
  Barnetby; Barnetby, Habrough, Ulceby, Stallingborough, Healing, Great Coates and the Grimsby stations to New Clee and
  Cleethorpes; Bradford Forster Square to Frizinghall; Battersby to Great Ayton); 1,881 of 2,376 done, Yorkshire and The
  Humber 207 of 238. 40 items, none skipped. Kept, though possibly little used by passenger trains: Cottingham to Hessle (a
  curve avoiding Hull Paragon; not sure no passenger train uses it), and Malton to York, Scarborough to Seamer and others with
  no train company on the map (the York to Scarborough and Hull lines' trains use them). Every fact checked against the
  article in `source` (`wiki_text.py`); the two Stallingborough items both come from the village's article. Keadby Bridge is
  `crosses`, on Althorpe to Scunthorpe: Althorpe station is on the west bank of the Trent, west of the bridge (Althorpe
  railway station article), so Althorpe to Crowle has the power stations instead. Already used next door, so others chosen:
  Selby Abbey and its neighbours (so Cochrane's shipyard), the Bar Convent and Goddards (so Bishopsbarns), the Wool Exchange
  (so Bradford Cathedral). Wressle Castle went to Howden to Wressle; Scampston Hall dropped (its listed point is its park,
  the house 811 m away), so Malton Priory. Passed over: the Lockington and Wrawby Junction rail crashes, the Howden rail
  accident and the Bradford City stadium fire. Points: Wikipedia's geotags, except Historic England's list point for St
  Peter and St Paul's Church, Stallingborough; no point is our own calculation, and every distance is to the item's point.
  Keadby Bridge's geotag is 1 m from the track. The farthest items are Cochrane Shipbuilders (714 m), Bridlington Spa (594
  m), Gilberdyke (587 m) and the Church of St Oswald, Filey (569 m); the rest are within 565 m. Step 8 done: 1,863 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 44, 40 stretches of Yorkshire and The Humber from Conisbrough to
  Mexborough through to Gilberdyke to Saltmarshe (Conisbrough, Mexborough, Swinton and Rotherham Central to Meadowhall;
  Meadowhall to Chapeltown, Elsecar, Wombwell and Barnsley; Meadowhall, Darnall and Dore & Totley to Sheffield; Dore & Totley
  to Grindleford through Totley Tunnel; Darnall, Woodhouse, the two Kiveton stations and Shireoaks; Swinton by
  Bolton-upon-Dearne, Goldthorpe and Thurnscoe to Moorthorpe; Church Fenton to Sherburn-in-Elmet; Doncaster to Retford, the
  two Gainsborough stations, York, Selby and Kirk Sandall; Kirk Sandall, Hatfield & Stainforth and the two Thorne stations;
  Goole to Thorne North, Rawcliffe and Saltmarshe; Rawcliffe, Snaith, Hensall, Whitley Bridge, Knottingley and Pontefract
  Monkhill; Gilberdyke to Saltmarshe); 1,841 of 2,376 done, Yorkshire and The Humber 167 of 238. 39 items and one stretch
  skipped: Doncaster to Sherburn-in-Elmet runs over the south-to-west curve at Hambleton Junction, the same reason as the
  four Doncaster stretches skipped in batch 43. Kept: Hatfield & Stainforth to Kirk Sandall (no train company on the map,
  but the Doncaster to Thorne lines' trains use it) and Doncaster to Gainsborough Central (not sure no passenger train uses
  it). Every fact checked against the article in `source` (`wiki_text.py`). Totley Tunnel and the Goole railway swing bridge
  are `crosses`. Already used next door, so others chosen: Conisbrough Castle (so the Earth Centre), Doncaster Minster (so the
  Mansion House), Selby Abbey, the toll bridge and Corunna House (so Abbot's Staith), the Bar Convent (so Goddards for
  Doncaster to York), St Mary's Church, Church Fenton (so the Old Vicarage). Shared out among neighbours: Sheffield (the Old
  Queen's Head, the Darnall Works), Rotherham (the bridge chapel, the Minster), Elsecar (the Milton Ironworks, Earl
  Fitzwilliam's station), Hatfield and Stainforth (the colliery, the greyhound stadium), Hensall (Butterfield's church and
  his Red House), Goole (Siemens's factory, Timm's Mill, the swing bridge). Wikipedia's Roman Ridge article is about the
  Roman road north of Doncaster, not the earthwork by Meadowhall, so Tinsley Viaduct instead. Passed over: the Cadeby Main
  and Oaks pit disasters, the Barnsley Public Hall disaster, the Selby (Great Heck) rail crash, the Battle of Orgreave, the
  deaths building Norwood Tunnel and those remembered at Hickleton Main, the Padley martyrs, and Tinsley Viaduct's box-girder
  controversy. Points: Wikipedia's geotags, except Historic England's list points for Rotherham Bridge's chapel, Earl
  Fitzwilliam's station (Elsecar Central Workshops' buildings 13 to 14), the Darnall Works' crucible shops and Shireoaks Hall
  (the listed house, not the park's middle); Norwood Tunnel's point is its eastern portal as given in its article. No point
  is our own calculation; every distance is to the item's point. Darnall New Ground's and Gulliver's Valley's geotags are
  coarse (given to three decimal places). Norwood Tunnel's length differs between sources (2,550 or 2,884 yards), so the
  text says "more than a mile". The farthest items are Earl Fitzwilliam's station (660 m), Shireoaks Hall (663 m), the Old
  Vicarage (625 m), Tinsley Viaduct and All Saints Church, Gainsborough (601 m each); the rest are within 565 m. Step 8 done:
  1,823 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 43, 40 stretches of Yorkshire and The Humber from East Garforth to
  Garforth through to Conisbrough to Doncaster (East Garforth, Garforth and Cross Gates to Leeds; Leeds to Woodlesford and
  Outwood; Outwood, Sandal & Agbrigg, Fitzwilliam, Normanton and Streethouse to the two Wakefield stations; Featherstone,
  Streethouse and the Pontefract stations; Glasshoughton, Castleford, Woodlesford and Normanton; Castleford, the Pontefract
  stations and Selby to Sherburn-in-Elmet and Selby by Burton Salmon and Gascoigne Wood; Moorthorpe, Fitzwilliam, South
  Elmsall, Adwick and Bentley to Doncaster; Selby and Micklefield to South Milford; Conisbrough to Doncaster); 1,801 of 2,376
  done, Yorkshire and The Humber 127 of 238. 36 items and four stretches skipped: Castleford to Doncaster, Doncaster to
  Pontefract Monkhill, Doncaster to Pontefract Baghill and Doncaster to South Milford all run over the south-to-west curve at
  Hambleton Junction, which the Hambleton Junction article says carries freight and only occasional diverted LNER trains.
  Kept, though they have no train company on the map: Castleford, Pontefract Monkhill and Pontefract Baghill to Selby (by
  Gascoigne Wood; not sure no passenger train uses them). Castleford to Sherburn-in-Elmet is now used by TransPennine
  Express's Castleford to York trains (Castleford railway station's article). Every fact checked against the article in
  `source` (`wiki_text.py`). Already used next door, so others chosen: Tower Works and Temple Works (so the Round Foundry and
  Stank Hall Barn), the Chantry Chapel at Wakefield (so the Theatre Royal, the Hepworth and Kirkthorpe Hydro). Shared out
  among neighbours: Wakefield (the prison, County Hall, the Theatre Royal, Belle Vue, the Hepworth), Pontefract (the castle,
  the barracks, the Hermitage, the Prince of Wales Colliery), Castleford (Lagentium, Queen's Mill, Wheldon Road), Monk Fryston
  (the hall and St Wilfrid's Church), Selby (the abbey, the toll bridge, Corunna House, Gascoigne Wood Mine), Fitzwilliam and
  Kinsley. Passed over: the Barnbow explosion (so Austhorpe Hall for Cross Gates to Garforth, leaving out the death at its
  Newcomen engine), the Beeston and Wheldale mining disasters, the Stank New Hall arson, the 1228 collapse of the bridge at
  Ferrybridge and the Selby ferry sinking, and Tickle Cock Bridge for its name. Pontefract Priory was left out: Wikipedia's
  point and Historic England's St John's Priory are on opposite sides of the line. One stretch has little near it but
  its stations' own villages, so Fitzwilliam (Fitzwilliam to Moorthorpe) is about the station's own place. Points:
  Historic England's list points for the listed buildings and scheduled monuments (Austhorpe Hall, the Corn Exchange, the
  Round Foundry, Stank Hall Barn, Pontefract Castle, Corunna House, Doncaster Minster, Conisbrough Castle; facts from the
  Wikipedia article in `source`), Wikipedia's geotags for the rest (Gascoigne Wood Mine's from the Selby Coalfield article);
  no point is our own calculation, and every distance is to the item's point, so Pontefract Castle reads 441 m and
  Conisbrough Castle 518 m (the scheduled areas' edges are nearer). For Walton, Methley, Fitzwilliam and Kinsley the point is
  the place's geotag. The farthest items are St Mary's Church, South Milford (605 m), Walton (569 m) and Pontefract Barracks
  (520 m); the rest are within 520 m. Step 8 done: 1,784 facts in `src/data/passes-near.json`; `npm run check` and
  `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 42, 40 stretches of Yorkshire and The Humber from Berry Brow to
  Honley through to East Garforth to Micklefield (the Penistone line from Berry Brow by Honley, Brockholes, Stocksmoor,
  Shepley, Denby Dale, Penistone, Silkstone Common and Dodworth to Barnsley, and Barnsley to Darton and Wakefield Kirkgate;
  Ravensthorpe to Wakefield Kirkgate; Deighton, Mirfield, Ravensthorpe and Dewsbury; the Huddersfield line by Batley, Morley
  and Cottingley to Leeds; the Harrogate line from Leeds by Burley Park, Headingley, Horsforth, Weeton, Pannal, Hornbeam Park,
  Harrogate, Starbeck, Knaresborough, Cattal and Hammerton to Poppleton and York; the East Coast Main Line from York to
  Thirsk, Northallerton and Darlington, and Northallerton to Yarm; Ulleskelf to York; Church Fenton to Ulleskelf and
  Micklefield; East Garforth to Micklefield); 1,761 of 2,376 done, Yorkshire and The Humber 87 of 238. 40 items, none skipped
  (none of the 40 is a possible avoiding line). Every fact checked against the article in `source` (`wiki_text.py`). Denby
  Dale Viaduct, Arthington Viaduct and Crimple Valley Viaduct are `crosses`. Shared out among neighbours: the Wakefield
  approach (the Chantry Chapel for Darton, and Horbury church for Ravensthorpe), York (the National Railway Museum for
  Poppleton, St Everilda's Church at Nether Poppleton for Thirsk, the Bar Convent for Ulleskelf), Knaresborough (Mother
  Shipton's Cave for Starbeck, the castle for Cattal), Kirkstall (Abbey House Museum, as the abbey is used next door).
  Passed over: the Huskar Pit and Barnsley Public Hall disasters, the Thirsk, Darlington and Dalton Junction rail crashes, the
  deaths building Bramhope Tunnel and Arthington Viaduct, the Colne Bridge Mill fire, and the murder behind Dewsbury's
  Devil's Knell and Becket's killers at Knaresborough Castle. One stretch has little near it but its stations' own villages,
  so Silkstone Common (Dodworth to Silkstone Common) is about the station's own place. Points: Historic England's list points
  for the listed buildings (facts from the Wikipedia article in `source`), Wikipedia's geotags for the rest; no point is our
  own calculation. For Wilstrop, Lower Cumberworth, Barkston Ash and Thunder Bridge the point is the place's geotag. Two
  articles disagree with themselves, so the facts avoid them: Grove House's building dates (1745 or 1752 to 1754) and
  whether it was the first house lit by water gas in Yorkshire or in the world. The farthest items are Thunder Bridge
  (675 m), St Peter and St Leonard's Church, Horbury (579 m) and Barkston Ash (577 m); the rest are within 535 m. Step 8 done:
  1,748 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 41, 40 stretches of Yorkshire and The Humber from Hellifield to
  Long Preston through to Berry Brow to Lockwood (Hellifield to Long Preston; the Airedale line from Hellifield by Gargrave,
  Skipton, Cononley, Steeton & Silsden, Keighley, Crossflatts, Bingley and Saltaire to Shipley; Frizinghall, Baildon and
  Apperley Bridge to Shipley; Apperley Bridge and Guiseley to Kirkstall Forge; the Wharfedale line by Baildon, Guiseley,
  Menston, Burley-in-Wharfedale and Ben Rhydding to Ilkley; Kirkstall Forge and Bramley to Leeds; Bramley, New Pudsey and
  Bradford Interchange; Bradford Interchange, Low Moor and Halifax; the Calder Valley line from Halifax by Sowerby Bridge,
  Mytholmroyd, Hebden Bridge and Todmorden to Walsden; Brighouse to Sowerby Bridge, Halifax, Mirfield and Deighton; Deighton
  to Huddersfield; Huddersfield to Slaithwaite and Marsden; Huddersfield, Lockwood and Berry Brow); 1,721 of 2,376 done,
  Yorkshire and The Humber 47 of 238. 40 items, none skipped (none of the 40 is a possible avoiding line; several have no
  train company on the map, but all carry passenger trains). Every fact checked against the article in `source`
  (`wiki_text.py`). Already used next door, so another chosen: St Mary's Church, Long Preston (so the engine shed for
  Hellifield to Long Preston). Shared out among neighbours: Saltaire (the church and Salts Mill), Halifax (Shibden Hall, the
  Piece Hall and the Minster), Huddersfield (the station itself, `station`, for Deighton to Huddersfield, and the George
  Hotel for Huddersfield to Lockwood), Todmorden (the Town Hall and Dobroyd Castle). Thackley Tunnel and Lockwood Viaduct are
  `crosses`; Hebden Bridge's old signal box is on the line, so has no side. Passed over: the Esholt Junction and Low Moor
  disasters, the Colne Bridge Mill fire and the Huddersfield factory fire. High Royds Hospital's points (the park's middle,
  784 m, and the article's, about 800 m) were too far, so the High Royds Hospital Railway (340 m) instead. Points: Historic
  England's list points for the listed buildings and scheduled monuments (facts from the Wikipedia article in `source`: the
  Kirk Sink villa from Gargrave, Kildwick Bridge from Kildwick, the Manor House from Ilkley), Wikipedia's geotags for the
  rest; no point is our own calculation, and every distance is worked out from the item's point (the Kirk Sink villa 179 m to
  Historic England's point, rather than the candidate's 116 m to the area's edge). Two facts with differing figures in their
  articles were written to avoid them: Tuel Lane Lock's fall (19 feet 5 inches or 8.5 inches, so "about six metres") and
  Thackley Tunnel's length (left out). The farthest items are the Ben Rhydding Hydro (570 m), the Manor House (490 m) and the
  Wool Exchange (475 m); the rest are within 430 m. Step 8 done: 1,708 facts in `src/data/passes-near.json`; `npm run check`
  and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 40, the last 33 stretches of the West Midlands and the first
  seven of Yorkshire and The Humber, from Blake Street to Shenstone through to Horton-in-Ribblesdale to Ribblehead (the
  Cross-City line from Shenstone by Blake Street, Butlers Lane, Four Oaks, Sutton Coldfield, Wylde Green, Chester Road and
  Erdington to Gravelly Hill; Burton-on-Trent to Lichfield Trent Valley, Tamworth and Willington; Tamworth, Polesworth,
  Atherstone and Nuneaton; Nuneaton to Bermuda Park, Bedworth and Coventry Arena, and to Hinckley; Banbury to Leamington
  Spa; the Stourbridge Town branch; Yorton, Wem, Prees and Whitchurch; Droitwich Spa to both Worcester stations; Langley
  Green, Hamstead and New Street to Smethwick Rolfe Street and Hamstead; Kings Norton and Bournville to Pineapple Road;
  Claverdon to Lapworth; then the Bentham line from Wennington by Bentham, Clapham and Giggleswick to Long Preston, and the
  Settle to Carlisle line from Long Preston by Settle and Horton-in-Ribblesdale to Ribblehead); 1,681 of 2,376 done, West
  Midlands 191 of 191 (finished), Yorkshire and The Humber 7 of 238. 38 items and two stretches skipped: Wellington to
  Welshpool and Church Stretton to Wellington run over the Abbey Foregate loop, which avoids Shrewsbury station and,
  Shrewsbury railway station's article says, carries freight and occasional specials but no regular passenger trains.
  Every fact checked against the article in `source` (`wiki_text.py`). Kept, though few passenger trains use them: Burton
  to Lichfield Trent Valley (by Wichnor Junction: one or two Birmingham to Derby trains a day, the Lichfield Trent Valley
  article says), New Street to Hamstead and Kings Norton to Pineapple Road. Already used next door, so others chosen:
  Pinley Priory, Shrewley Tunnel and Kingswood (so Shrewley village for Claverdon to Lapworth), Kings Norton Stop Lock and
  Cadbury World (so Lifford Reservoir and Hazelwell), Galton Bridge, Chance's glassworks, Summit Bridge and the Engine Arm
  Aqueduct (so the Ruskin Pottery and Soho Foundry), Tamworth Castle, Worcester Cathedral and the Commandery. Stourbridge
  Town has the station itself (`station`). Passed over: the Sutton Coldfield, Nuneaton and Wennington Junction rail crashes,
  and Alvecote Priory's founding story. Points: Historic England's list points for the listed buildings and scheduled
  monuments (facts from the Wikipedia article in `source`; Mancetter's church from Mancetter, Hazlitt House from Wem, The
  Folly from Settle, the Hoffmann kiln from Langcliffe), Wikipedia's geotags for the rest; no point is our own calculation.
  Two distances are to Historic England's points rather than to the areas' edges: the Hoffmann kiln (190 m; the scheduled
  area reaches the line) and Polesworth Abbey (555 m). The Battle of Cropredy Bridge's point was 1.4 km away, so Cropredy
  village (159 m) instead; the Ribblehead construction camps' point was 792 m away, so Ribblehead Quarry. The farthest items
  are Mediolanum (625 m), the Sutton Coldfield transmitting station (582 m) and Hawkesbury Junction (569 m); the rest are
  within 560 m. Step 8 done: 1,668 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 39, 40 stretches of the West Midlands from Henley-in-Arden to
  Wootton Wawen through to Lichfield City to Shenstone (the North Warwickshire line to Wilmcote and Stratford-upon-Avon;
  Bearley, Claverdon and Hatton; the Chiltern line from Lapworth by Dorridge, Widney Manor, Solihull, Olton and Acocks
  Green to Tyseley; Hatton, Warwick Parkway, Warwick and Leamington Spa; Kenilworth and Coventry; the West Coast Main Line
  from Coventry by Canley, Tile Hill, Berkswell, Hampton-in-Arden, Birmingham International, Marston Green and Lea Hall to
  Stechford and Adderley Park; Coventry Arena; Coventry to Rugby, and Nuneaton to Rugby; Coleshill Parkway to Nuneaton and
  Water Orton; Water Orton, Coleshill Parkway, Wilnecote and Tamworth; the Trent Valley line from Tamworth by Lichfield
  Trent Valley to Rugeley Trent Valley; Lichfield City); 1,641 of 2,376 done, West Midlands 158 of 191. 40 items, none
  skipped, every fact checked against the article in `source` (`wiki_text.py`). Kept, though they may carry few regular
  passenger trains: Coleshill Parkway to Wilnecote (by Whitacre and Kingsbury) and Nuneaton to Rugby (no train company on
  the map, but the Trent Valley line). Already used next door, so others chosen: Mary Arden's Farm (Bearley to Wilmcote, so
  the village's quarries for Stratford Parkway to Wilmcote), Edstone Aqueduct (Wilmcote to Wootton Wawen, so St Peter's
  Church for Henley), Beaudesert Castle, Tyseley Locomotive Works and Holy Trinity, Coventry; Whitacre Pumping Station went
  to Coleshill Parkway to Wilnecote, so Nuneaton Priory for Coleshill Parkway to Nuneaton. Packwood House was passed over
  (only its park, with a middle point, was a candidate), so Kingswood. Bearley to Claverdon has the station itself
  (`station`). Passed over: the Knowle and Dorridge, Stechford and Nuneaton rail crashes, and the deaths at Ford's Hospital
  in 1940. Points: Historic England's list points for the listed buildings and scheduled monuments (facts from the
  Wikipedia article in `source`), Wikipedia's geotags for the rest. For Nuneaton Priory, the distance is that of Historic
  England's point for the scheduled area (474 m, worked out by `check.py`), not the candidate's 199 m to the area's edge.
  The farthest items are Lichfield Cathedral (691 m), Ford's Hospital (670 m) and Tamworth Castle (615 m); the rest are
  within 600 m. Step 8 done: 1,630 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 38, 40 stretches of the West Midlands from Smethwick Galton
  Bridge to Smethwick Rolfe Street through to Danzey to Henley-in-Arden (round Smethwick and The Hawthorns; the Snow Hill
  lines by Jewellery Quarter to Snow Hill and Moor Street and out by Bordesley and Small Heath; New Street to Small Heath,
  Duddeston, Adderley Park, Water Orton, Moseley Village and, by the Soho loop, Perry Barr; Perry Barr to Smethwick Rolfe
  Street; the Chase line from Perry Barr by Hamstead, Tame Bridge Parkway and Bescot Stadium to Walsall and Darlaston; Perry
  Barr, Witton, Aston, Gravelly Hill, Duddeston and Stechford; the Camp Hill line by Moseley Village, Kings Heath and
  Pineapple Road, and its curves to Water Orton; the North Warwickshire line from Tyseley by Spring Road, Hall Green,
  Yardley Wood, Shirley, Whitlocks End, Wythall, Earlswood, The Lakes, Wood End and Danzey to Henley-in-Arden); 1,601 of
  2,376 done, West Midlands 118 of 191. 40 items, none skipped, every fact checked against the article in `source`
  (`wiki_text.py`); nearby Wikipedia articles were also listed from `wiki/gb-articles.tsv.gz`. Kept, though they may
  carry few regular passenger trains: Aston to Stechford (no train company on the map), New Street to Perry Barr (the Soho
  loop), Moseley Village to Water Orton and Small Heath to Water Orton (curves avoiding New Street). Birmingham's centre is
  shared out among the nine stretches from New Street, Moor Street and Snow Hill: St Philip's Cathedral, the Old Crown,
  Curzon Street station, the Town Hall, the Proof House, St Martin in the Bull Ring and St Paul's, with the Library of
  Birmingham and the Holliday Street Aqueduct already used; Galton Bridge and Chance's glassworks were used next door, so
  the Lions of the Great War and Summit Bridge. The Hawthorns stadium was passed over, as the station shares its name. Five
  quiet stretches of the North Warwickshire line have the station itself (`station`: Yardley Wood, Wythall, Earlswood, The
  Lakes) or a village (Major's Green). Passed over: the Stechford rail crash and the 2013
  Smethwick fire. No point is our own calculation: Historic England's list points for St Paul's, St Philip's, the Old
  Crown, the Town Hall, the Engine Arm Aqueduct, Aston Hall, Stratford House, Highbury Hall, the Church of the Ascension,
  Tanworth church and Beaudesert Castle (facts from the Wikipedia article in `source`); the rest are Wikipedia's geotags.
  The farthest items are St Mary Magdalene's, Tanworth-in-Arden (611 m), Highbury Hall (599 m) and the Church of the
  Ascension (523 m); the rest are within 520 m. Step 8 done: 1,590 facts in `src/data/passes-near.json`; `npm run check`
  and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 37, 40 stretches of the West Midlands from Hednesford to
  Rugeley Town through to Birmingham New Street to Smethwick Rolfe Street (the Chase line from Rugeley Town by Hednesford,
  Cannock, Landywood and Bloxwich to Walsall; Walsall, Darlaston and Willenhall; Penkridge to Willenhall and to Wolverhampton;
  the Stour Valley line from Coseley by Tipton, Dudley Port and Sandwell & Dudley to Smethwick Galton Bridge; Langley Green,
  Rowley Regis, Old Hill, Cradley Heath, Lye and Stourbridge Junction to Hagley, Blakedown, Kidderminster, Hartlebury and
  Droitwich Spa; Droitwich and Worcestershire Parkway to Bromsgrove; the Lickey Incline to Barnt Green; Redditch and
  Alvechurch; the Cross-City line by Longbridge, Northfield, Kings Norton, Bournville, Selly Oak, University and Five Ways to
  New Street; New Street to Smethwick Rolfe Street); 1,561 of 2,376 done, West Midlands 78 of 191. 40 items, none skipped,
  every fact checked against the article in `source` (`wiki_text.py`); nearby Wikipedia articles were also listed from
  `wiki/gb-articles.tsv.gz`. Kept, though they may carry few regular passenger trains: Penkridge to Willenhall (by Bushbury,
  avoiding Wolverhampton) and Darlaston to Walsall (no train company on the map, but Wolverhampton to Walsall trains use it).
  Items already used next door avoided: the Grand Theatre (Bilbrook to Wolverhampton) and Penkridge church (Penkridge to
  Stafford), so St Peter's Collegiate Church and HM Prison Oakwood; Penkridge Viaduct is north of the village, on Penkridge
  to Stafford. Three salt stories round Droitwich are shared out: the brine (Droitwich to Hartlebury), Chateau Impney
  (Bromsgrove to Droitwich) and Corbett's Stoke Works (Bromsgrove to Worcestershire Parkway). Passed over: the Tipton
  Catastrophe of 1922; the Museum of Carpet (closed in December 2025) and St Agnes' Church, Cotteridge (demolished).
  **For John:** Stambermill Viaduct (Lye to Stourbridge Junction, `crosses`) uses its article's own point, 286 m from the
  track, though the train crosses it; it has not been moved. No point is our own calculation: most are Historic England's
  list points (facts from the Wikipedia article in `source`; Alvechurch's church from Alvechurch, Droitwich's salt remains
  from Droitwich Spa, Churchill Forge from Churchill Forge Mill, Forge Mill from Forge Mill Needle Museum, Metchley's
  scheduled area from Metchley Fort); the rest are Wikipedia's geotags. Four crossings: Stambermill Viaduct, the Lickey
  Incline, Metchley Fort and the Holliday Street Aqueduct (under it). The farthest items are Horseley Ironworks (676 m),
  Kings Norton Stop Lock (643 m) and All Saints', Bloxwich (591 m); the rest are within 540 m. Step 8 done: 1,550 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 36, the last two stretches of the East Midlands (Dronfield to
  Grindleford, Melton Mowbray to Sileby) and the first 38 of the West Midlands, from Shrewsbury to Welshpool through to
  Rugeley Trent Valley to Rugeley Town (round Shrewsbury: to Welshpool, Gobowen, Church Stretton, Yorton and Wellington;
  Chirk to Gobowen; the Welsh Marches line from Church Stretton by Craven Arms, Ludlow and Leominster to Hereford and on to
  Abergavenny; the Heart of Wales line from Craven Arms by Broome, Hopton Heath and Bucknell to Knighton and Knucklas;
  Wellington by Oakengates, Telford Central, Shifnal, Cosford, Albrighton, Codsall and Bilbrook to Wolverhampton; Bilbrook
  to Penkridge and Stafford; Crewe to Stafford; Stone to Stafford and Stoke-on-Trent; Kidsgrove and Longport to Stoke;
  Stoke by Longton and Blythe Bridge to Uttoxeter and Tutbury & Hatton; Rugeley Trent Valley to Stone, Stafford and Rugeley
  Town); 1,521 of 2,376 done, East Midlands 140 of 140 (finished), West Midlands 38 of 191. 40 items, none skipped, every
  fact checked against the article in `source` (`wiki_text.py`); nearby Wikipedia articles were also listed from
  `wiki/gb-articles.tsv.gz`. Kept, though they may carry few or no regular passenger trains: Dronfield to Grindleford (past
  Dore, by the Dore South curve), Melton Mowbray to Sileby (the curve at Syston) and Bilbrook to Penkridge (avoiding
  Wolverhampton). Five stretches round Shrewsbury share the town out: the Abbey (to Welshpool), Gay Meadow (Church
  Stretton), the Flaxmill Maltings (Yorton), the Castle (Wellington), with Whittington Castle for Gobowen; in Melton, St
  Mary's church, as Brooksby Hall is used on Melton to Syston; in Uttoxeter, the town itself with Johnson's penance (Blythe
  Bridge) and the racecourse (Tutbury). Three stretches run into Wales (Shrewsbury to Welshpool, Knighton to Knucklas,
  Abergavenny to Hereford): their items are in England. **For John:** Chirk to Gobowen's item is Chirk Viaduct (`crosses`),
  which the border crosses at an angle, so it is half in Wales. Passed over: the Hixon and Colwich rail crashes, the 1996
  Stafford rail crash, the Shrewsbury rail accident and Bathpool Park (Kidsgrove to Longport). No point is our own
  calculation: most are Historic England's list points (facts from the Wikipedia article in `source`; Penkridge's church
  from History of Penkridge, St Cuthbert's at Donington from Donington, Shropshire, Clungunford church from Clungunford,
  the Offa's Dyke section near Nether Skyborry from Offa's Dyke, Stoke Minster's point the Anglo-Scandinavian cross in its
  churchyard); the rest are Wikipedia's geotags, one rounded (Wolverhampton railway works, 52.6, -2.131). Two crossings:
  Chirk Viaduct and Shugborough Tunnel. The farthest items are Kilpeck church (641 m), Albrighton Moat (595 m), St
  Cuthbert's at Clungunford (547 m) and the Offa's Dyke section (508 m); the rest are within 470 m. Step 8 done: 1,510
  facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 35, 40 stretches of the East Midlands from Boston to
  Hubberts Bridge through to Leicester to Market Harborough (Boston to Hubberts Bridge; the line to Skegness by Thorpe
  Culvert, Wainfleet and Havenhouse; the joint line from Peterborough to Spalding and on by Ruskington and Metheringham to
  Lincoln; Lincoln to Saxilby, Hykeham and Market Rasen, and on by Barnetby to Brigg; the East Coast Main Line from
  Grantham to Peterborough; Gainsborough Central to Kirton Lindsey; the Derwent Valley line from Belper by Ambergate,
  Whatstandwell, Cromford and Matlock Bath to Matlock; Chesterfield by Dronfield to Dore & Totley; Syston by Melton
  Mowbray and Oakham to Stamford, and Corby to Oakham over the Welland Viaduct; Corby, Market Harborough and
  Wellingborough to Kettering; Banbury to Kings Sutton; the West Coast Main Line from Rugby to Wolverton and the
  Northampton loop by Long Buckby and Northampton; Glossop to Hadfield; Leicester to Market Harborough); 1,481 of 2,376
  done, East Midlands 138 of 140. 37 items, every fact checked against the article in `source` (`wiki_text.py`); nearby
  Wikipedia articles were also listed from `wiki/gb-articles.tsv.gz`. Three stretches skipped, with reasons in `skipped`
  (the first entries there): Lichfield Trent Valley, Tamworth and Burton-on-Trent to Market Harborough run over the
  Leicester to Burton freight line, as their South Wigston twins (skipped in batch 32) do. Kept: Ruskington to Spalding (the
  Sleaford avoiding line; no train company on the map, and Lincoln to Peterborough trains may call at Sleaford instead);
  Corby to Oakham, which the Welland Viaduct article says carries two return trains each weekday between Melton Mowbray
  and London; Glossop to Hadfield past Dinting, which Glossop's trains to Hadfield use after reversing (the station
  article lists Hadfield as Glossop's next stop); Leicester to Market Harborough, the Midland Main Line itself, shorter than
  the way by South Wigston, which is on the Birmingham line. Neighbouring stretches share sights out: in Boston, the
  Guildhall (to Hubberts Bridge) and the Stump (to Thorpe Culvert); in Wainfleet, Batemans Brewery (Thorpe Culvert) and
  Magdalen College School (Havenhouse); in Lincoln, St Mary le Wigford (Hykeham), the Stonebow (Saxilby), Greyfriars
  (Metheringham) and Monks Abbey (Market Rasen); Belper North Mill and the Great British Car Journey either side of
  Ambergate; Leawood Pump House, Lovers' Walks and the Heights of Abraham cable car on the three stretches by Cromford and
  Matlock Bath; Kilsby Tunnel (Rugby to Wolverton) and Wolverton Viaduct (Northampton to Wolverton). Passed over: the
  Wrawby Junction rail crashes (1898 and 1983), the Nocton rail crash, Toadmoor Tunnel (it may be on the main line beside
  Ambergate rather than the Matlock branch), North Road at Glossop (used on Dinting to Glossop), Welford Road (Leicester to
  South Wigston) and St Martin's, Stamford (Peterborough to Stamford). No point is our own calculation: Boston's Stump,
  Rowston church, Greyfriars, the Stonebow, St Mary le Wigford, St Pega's church, Tapton House, Ashwell church, Oakham
  Castle, the Triangular Lodge, Tooley's Boatyard and Northampton Castle use Historic England's list points (facts from
  the Wikipedia article in `source`; Rowston's church from the Rowston article, St Pega's from Peakirk, Magdalen College
  School from Wainfleet All Saints); the rest are Wikipedia's geotags, some rounded (Sheffield F.C.'s ground, Monks Abbey,
  which is the priory article's point, and the epicentre of the 2008 Market Rasen earthquake). Three crossings: Stoke Bank,
  the Welland Viaduct and Wolverton Viaduct, with Kilsby Tunnel (`crosses`; its article's point is 44 m from the track).
  The farthest items are Boston Guildhall (589 m), Tooley's Boatyard (488 m) and Oakham Castle (449 m); the rest are
  within 420 m. Some items are about one of the stretch's own stations' places (the Stump, Wainfleet's school, the
  Leicester museum), so the page may add no "Between …". Step 8 done: 1,470 facts in `src/data/passes-near.json`;
  `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 34, 40 stretches of the East Midlands from Creswell to
  Whitwell (Derbyshire) through to Hubberts Bridge to Swineshead (the Robin Hood line from Creswell by Whitwell to
  Shireoaks and Worksop; Worksop to Retford; the East Coast Main Line from Newark Northgate to Retford and Grantham;
  Gainsborough Central and Gainsborough Lea Road to Retford, and Gainsborough Lea Road to Saxilby; Saxilby and Hykeham
  round Lincoln; the Nottingham to Lincoln line from Nottingham by Carlton, Burton Joyce, Lowdham, Thurgarton, Bleasby,
  Fiskerton, Rolleston, Newark Castle, Collingham and Swinderby to Hykeham, and Collingham to Newark Northgate; the
  Nottingham to Grantham line by Netherfield, Radcliffe, Bingham, Aslockton, Elton & Orston and Bottesford; and the
  Poacher line from Grantham and Bottesford by Ancaster, Rauceby, Sleaford, Heckington and Swineshead to Hubberts
  Bridge, with Ruskington and Spalding to Sleaford); 1,441 of 2,376 done, East Midlands 98 of 140. 39 items, every
  fact checked against the article in `source` (`wiki_text.py`); nearby Wikipedia articles were also listed from
  `wiki/gb-articles.tsv.gz`. One stretch skipped, with its reason in `skipped` (the first entry there): Newark Castle to
  Retford, which turns from the Nottingham to Lincoln line at the Newark flat crossing onto the main line north, a way
  no passenger train goes. Kept, though they may carry few or no regular passenger trains: Hykeham to Saxilby (round
  Lincoln), Ancaster to Bottesford (by the Allington chord, avoiding Grantham), and Ruskington to Sleaford and Sleaford
  to Spalding (no train company on the map, but Lincoln to Peterborough trains use them). Neighbouring stretches share
  sights out: Worksop Town's ground (Worksop to Whitwell), Steetley Colliery (Shireoaks to Whitwell), Mr Straw's House
  (Shireoaks to Worksop) and Worksop Priory (Retford to Worksop); Gainsborough Old Hall and the West Burton power
  stations on the two Gainsborough to Retford stretches; the Newark flat crossing (Newark Northgate to Retford),
  Langford church (Collingham to Newark Northgate), Winthorpe Bridge (Collingham to Newark Castle) and Newark Castle
  (Newark Castle to Rolleston); in Grantham, the Trigge library (Grantham to Newark Northgate) and the Guildhall
  (Ancaster to Grantham), with Sedgebrook church (Bottesford to Grantham) and Newbo Abbey (Ancaster to Bottesford);
  St Mary's in the Lace Market and Meadow Lane on the two stretches into Nottingham; Cranmer's Mound and Bingham church
  either side of Aslockton; in Sleaford, the castle, Cogglesford Mill, the Bass Maltings and Car Dyke on four
  stretches. Passed over: the 1906 Grantham and 1870 Newark rail crashes, St Thomas's Church, Aslockton (its window
  recalls a vicar drowned in a shipwreck), the Battle of Worksop (its place is uncertain), Honington church (its
  article and the list disagree on its grade) and Creswell Crags (819 m). One station item: Thurgarton station
  (Bleasby to Thurgarton), as nothing else near that short stretch could be checked. No point is our own calculation:
  Worksop Priory, Gainsborough Old Hall, Winthorpe Bridge, Newark Castle, Bingham church, Cranmer's Mound, Bottesford
  church, Sedgebrook church, Wilsford church, Car Dyke at Helpringham and the Bass Maltings use Historic England's list
  points (facts from the Wikipedia article in `source`; Sedgebrook's and Wilsford's churches from the village articles,
  Cranmer's Mound from the Aslockton article); the rest are Wikipedia's geotags, some rounded (West Burton, the Battle
  of Gainsborough, Lincoln Racecourse, Saxondale). Car Dyke's list point is 310 m from the track, though the candidates
  measured its scheduled area at 127 m; Cranmer's Mound's point is 277 m (its area 193 m). Bingham church's list point
  is 203 m from the track; its article's point is about 600 m away, so the list's was used. Two crossings: the Newark
  flat crossing and Rectory Junction Viaduct (`crosses`). The farthest items are Worksop Priory (662 m), Mr Straw's
  House (652 m), Gainsborough Old Hall (621 m), Southwell Racecourse (620 m) and Cogglesford Mill (606 m); the rest are
  within 560 m. Some items are about one of the stretch's own stations' places (Creswell's church, Burton Joyce's
  church, Hubberts Bridge), so the page may add no "Between …". Step 8 done: 1,433 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 33, 40 stretches of the East Midlands from Narborough to
  South Wigston through to Creswell to Langwith-Whaley Thorns (Hinckley by Narborough and South Wigston to Leicester;
  Market Harborough to South Wigston; the Midland Main Line from Leicester by Syston, Sileby and Barrow-upon-Soar to
  Loughborough and East Midlands Parkway; the lines round Trent Junction to Long Eaton, Attenborough and Ilkeston; the
  Erewash Valley line from Ilkeston by Langley Mill and Alfreton to Chesterfield, and Belper to Chesterfield; Derby to
  Duffield and Belper, Peartree, Willington, Tutbury & Hatton, Spondon and Long Eaton; Beeston, Ilkeston and Bulwell to
  Nottingham; and the Robin Hood line from Bulwell by Hucknall, Newstead, Kirkby-in-Ashfield, Sutton Parkway, Mansfield,
  Mansfield Woodhouse, Shirebrook and Langwith-Whaley Thorns to Creswell); 1,401 of 2,376 done, East Midlands 58 of 140.
  40 items, every fact checked against the article in `source` (`wiki_text.py`); nearby Wikipedia articles were also
  listed from `wiki/gb-articles.tsv.gz`. None skipped. Kept, though they may carry few or no regular passenger trains:
  Beeston to Ilkeston and Beeston to Bulwell (curves round Lenton that avoid Nottingham), and Market Harborough to South
  Wigston (Midland Main Line trains to Leicester run past South Wigston without calling, so the page routes them this
  way). Neighbouring stretches share sights out: Ratcliffe-on-Soar Power Station on Attenborough to East Midlands Parkway,
  the Trent Viaducts on East Midlands Parkway to Long Eaton, St Giles' Church, Sandiacre, on East Midlands Parkway to
  Ilkeston and Toton Sidings on Ilkeston to Long Eaton; Nottingham Castle (Ilkeston to Nottingham), Boots D10 (Beeston to
  Nottingham), Lenton Priory (Bulwell to Nottingham) and the Nottingham Tennis Centre (Beeston to Ilkeston); St Mary's
  Church, Attenborough, and the nature reserve on separate stretches; Taylor's Bell Foundry and Brush's Falcon Works on
  either side of Loughborough; Chesterfield's crooked spire on Alfreton to Chesterfield, Wingfield station on Belper to
  Chesterfield. Passed over: the Barrow upon Soar rail crash (2008), the 2012 Derby arson attack, Creswell Crags (806 m)
  and Codnor Castle (971 m). No point is our own calculation: St Mary in Arden, St Mary's Church, Sileby, Taylor's Bell
  Foundry, St Giles' Church, Sandiacre, Bennerley Viaduct, the Crooked Spire, Wingfield station, Duffield Castle, the
  Midland Railway War Memorial, Tutbury Castle, St Mary's Church, Attenborough, Boots D10, Lenton Priory and Hucknall's
  church use Historic England's list points (facts from the Wikipedia article in `source`; Sileby's church from the
  Sileby article, as the candidate's Wikipedia link pointed at the Wesleyan chapel); the rest are Wikipedia's geotags,
  some rounded (Narborough Bog, Croft and Huncote Quarry, Barrow upon Soar, Ironville, Kirkby-in-Ashfield, British
  Celanese, Creswell Model Village). The Museum of Making's point is the Derby Silk Mill article's; its facts about the
  mill come from the Lombe's Mill article. One crossing: the Trent Viaducts (`crosses`). The farthest items are Notts Golf
  Club (659 m), Croft and Huncote Quarry (648 m), Tutbury Castle (612 m), Pride Park Stadium (595 m) and St Chad's Church,
  Pleasley Vale (587 m); the rest are within 565 m. Barrow upon Soar and Kirkby-in-Ashfield are about one of the stretch's
  own stations' places, so the page may add no "Between …". Step 8 done: 1,394 facts in `src/data/passes-near.json`;
  `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 32, 40 stretches from East Tilbury to Stanford-le-Hope
  through to Burton-on-Trent to South Wigston, finishing the East of England and starting the East Midlands (the London,
  Tilbury and Southend line from East Tilbury by Stanford-le-Hope to Pitsea, and from Upminster by West Horndon, Laindon,
  Basildon, Pitsea, Benfleet, Leigh-on-Sea, Chalkwell, Westcliff, Southend Central, Southend East and Thorpe Bay to
  Shoeburyness; Watford High Street and Bushey to Watford Junction; Colchester Town to Colchester; Ipswich to Mistley;
  then the Hope Valley line from New Mills Central by Chinley, Edale, Hope, Bamford and Hathersage to Grindleford, the
  Glossop line from Broadbottom by Dinting to Hadfield and Glossop, and the Buxton line from New Mills Newtown by Furness
  Vale, Whaley Bridge, Chapel-en-le-Frith and Dove Holes to Buxton); 1,361 of 2,376 done, East of England 237 of 237
  (finished), East Midlands 18 of 140. 33 items, every fact checked against the article in `source` (`wiki_text.py`).
  Seven stretches skipped, with reasons in `skipped` (the first entries there): Brundall Gardens to Wymondham, Salhouse
  to Wymondham, Diss to Salhouse and Brundall Gardens to Diss run through Norwich, a terminus where every train stops and
  reverses; Lichfield Trent Valley, Tamworth and Burton-on-Trent to South Wigston are the Leicester to Burton freight line
  by Coalville. Kept, though possibly avoiding lines: Watford High Street to Watford Junction (the DC line), Bushey to
  Watford Junction, Colchester Town to Colchester, and Ipswich to Mistley (the curve avoiding Manningtree, perhaps used by
  few or no passenger trains). Neighbours already used got another item: Mistley Towers (on Mistley to Manningtree), so
  the Willis Building for Ipswich to Mistley; Vicarage Road and Oxhey Chapel (near Bushey), so St Matthew's, Oxhey;
  Upminster Windmill (Barking to Upminster), so St Laurence's Church; within the batch, St Margaret of Antioch at
  Stanford-le-Hope was passed over for the Bata shoe factory and All Saints, Vange, Cliffs Pavilion goes to Southend
  Central to Westcliff (the Palace Theatre on Chalkwell to Westcliff), Southchurch Hall to Southend East to Thorpe Bay
  (the Cliff Railway on Southend Central to Southend East), Torr Vale Mill to New Mills Central to Strines (Bugsworth Basin
  on Chinley to New Mills Central), and Navio to Bamford to Hope (Edale's church on Edale to Hope). Passed over: the
  Watford rail crash, the Padley martyrs (Padley Gorge used, not the chapel), Reginald Warneford's memorial at Oxhey, and
  the Cliffs Pavilion's tribute concert. No point is our own calculation: the Danish Camp, the Bull Ring, the Whaley Bridge
  warehouse, the Willis Building, Hathersage church, Colchester Castle's keep and Southchurch Hall use Historic England's
  list points (their facts from the Wikipedia article in `source`); the rest are Wikipedia's geotags, some rounded
  (Hadfield, Langdon Nature Reserve, Torrs Hydro). The Danish Camp's text gives Hastein's camp of about 894 as a separate
  fact, as the article does not say it was the same site. Two crossings: Cowburn Tunnel and Dinting Viaduct (`crosses`).
  The farthest items are Hathersage church (740 m, a little more than the usual 700 m, for Little John's grave), the
  Willis Building (709 m), the Palace Theatre (687 m), Gloucester Park (680 m) and Torrs Hydro (665 m); the rest are
  within 645 m. Some items are about one of the stretch's own stations' places (Hadfield, Basildon Town Centre, Edale's
  church), so the page may add no "Between …". Step 8 done: 1,354 facts in `src/data/passes-near.json`; `npm run check`
  and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 31, 40 stretches of the East of England from Brandon to
  Lakenheath through to East Tilbury to Tilbury Town (the Breckland line from Brandon by Lakenheath to Shippea Hill; Diss
  to Norwich; the Bittern line from Norwich by Salhouse, Hoveton & Wroxham, Worstead, North Walsham, Gunton and Roughton
  Road to Cromer, West Runton and Sheringham; the Wherry line from Brundall by Lingwood and Acle to Great Yarmouth, and
  Berney Arms to Great Yarmouth and Reedham; Lowestoft to Oulton Broad North; the East Coast Main Line from Stevenage by
  Knebworth, Welwyn North, Welwyn Garden City, Hatfield, Welham Green, Brookmans Park and Potters Bar to Hadley Wood; the
  Hertford loop from Stevenage by Watton-at-Stone, Hertford North, Bayford and Cuffley to Crews Hill; the Watford DC line
  from Watford High Street by Bushey and Carpenders Park to Hatch End; High Speed 1 from Ebbsfleet International to
  Rainham; and the Tilbury lines from Purfleet by Grays, Chafford Hundred Lakeside and Ockendon, and Grays by Tilbury Town
  to East Tilbury); 1,321 of 2,376 done, East of England 215 of 237. Every fact checked against the article in `source`
  (`wiki_text.py`); nearby Wikipedia articles were also listed from `wiki/gb-articles.tsv.gz`. Neighbours already used got
  another item: the Six Hills (on Hitchin to Stevenage) for Broadhall Way and Stevenage's clock tower, Rainham Hall and
  St Helen and St Giles (on Dagenham Dock and Purfleet to Rainham) and Baker's Hole (on Ebbsfleet to Gravesend) for High
  House, Purfleet, on Ebbsfleet to Rainham, and Carrow Road and Trowse Swing Bridge near Norwich for Forncett's church
  and the Rosary Cemetery; within the batch, Cromer Hall goes to Cromer to Roughton Road only (the West Runton Mammoth's
  cliffs on Cromer to West Runton), Acle church to Acle to Lingwood only (Stracey Arms on Acle to Great Yarmouth), Berney
  Arms Windmill to Berney Arms to Great Yarmouth (Polkey's Mill on Berney Arms to Reedham), and the State Cinema to Grays
  to Tilbury Town (Lakeside on Chafford Hundred to Grays). Passed over: the Welwyn Tunnel, Hatfield (2000 and 1870) and
  Potters Bar rail crashes, and the Essex lorry deaths; Cromer Tunnel (its article's point, 304 m from the line, doesn't
  fit a tunnel said to pass under this line); the HS1 Thames tunnel (no position in the index). Two points are our own
  calculation, from Historic England's mapped outlines: the nearest edge of Tilbury Fort's scheduled area (291 m; the
  fort's middle is 873 m) and the nearest of the four scheduled sections of Grim's Ditch (47 m, on the right; one other
  section is 376 m away on the left). The wayside cross by Norwich Road, North Walsham, and High House's dovecote use
  Historic England's points, taken as the relocated battle cross by the town's water works and as High House from their
  list titles; the rest are Historic England's list points or Wikipedia's geotags (the Rosary Cemetery's, Berney Arms
  Windmill's, Bayfordbury Observatory's, Tolmers Park's and Potters Bar Tunnel's from their articles). Two crossings:
  Digswell Viaduct and Potters Bar Tunnel (`crosses`). The farthest items are Brandon (715 m, a little more than the usual
  700 m, the town's point), Tolmers Park (644 m), Berney Arms Windmill (611 m) and Bayfordbury Observatory (570 m); the
  rest are within 560 m. Some items are about one of the stretch's own stations' places (Brandon, Brookmans Park,
  Cuffley, Watton-at-Stone's church, North Walsham's church), so the page may add no "Between …". Ebbsfleet International
  to Rainham is High Speed 1 running past Rainham with no station of its own there; the Wherry line stretches have no
  train company on the map but carry Greater Anglia trains; all given items, none skipped. Step 8 done: 1,321 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 30, 40 stretches of the East of England from Great Bentley
  to Weeley through to Brandon to Thetford (the Sunshine Coast line from Great Bentley by Weeley and Thorpe-le-Soken to
  Clacton-on-Sea, Kirby Cross, Frinton-on-Sea and Walton-on-the-Naze; the Mayflower line from Manningtree by Mistley and
  Wrabness to Harwich International, Dovercourt and Harwich Town; round Ipswich by Westerfield and Derby Road, and the
  Felixstowe branch by Trimley; the East Suffolk line from Westerfield by Woodbridge, Melton, Wickham Market,
  Saxmundham, Darsham, Halesworth, Brampton and Beccles to Oulton Broad South and Oulton Broad North; the Wherry line
  from Oulton Broad North by Somerleyton, Haddiscoe, Reedham, Cantley, Buckenham and Brundall to Norwich; and the
  Breckland line from Norwich by Wymondham, Spooner Row, Attleborough, Eccles Road and Harling Road to Thetford and
  Brandon); 1,281 of 2,376 done, East of England 175 of 237. Every fact checked against the article in `source`
  (`wiki_text.py`); nearby Wikipedia articles were also listed from `wiki/gb-articles.tsv.gz`. Neighbours already used
  got another item: St Mary at Stoke and Portman Road (used on Ipswich to Manningtree and Ipswich to Needham Market)
  were passed over for the Sir Bobby Robson Bridge on Ipswich to Westerfield; within the batch, Thorpe Hall's gardens go
  to Kirby Cross to Thorpe-le-Soken only, Mistley Towers to Mistley to Manningtree only (Bradfield on Mistley to
  Wrabness), Somerleyton Swing Bridge to Haddiscoe to Somerleyton (the former lifeboat station on Oulton Broad North to
  Somerleyton), and Beccles bell tower to Beccles to Brampton (Castle Marshes on Beccles to Oulton Broad South).
  Passed over: the Thorpe rail accident of 1874 near Brundall (fatal), Great Bentley's martyrs of 1557, and the West
  End Bathing Place's drownings. Two points are our own calculation: the nearest edge of Thorpe Hall's registered
  gardens (339 m) and of Cockfield Hall's park (260 m), from Historic England's mapped outlines; St Andrew's Church,
  Bramfield, St Andrew's Church, Roudham, and Attleborough's church use Historic England's list points; the rest are
  Wikipedia's geotags. Three crossings: Somerleyton, Reedham and Trowse swing bridges (`crosses`). The farthest items
  are Weeley (627 m), Wymondham Bridewell (603 m), Frinton-on-Sea (579 m) and RAF Halesworth (499 m); the rest are
  within 490 m. Five items are about one of the stretch's own stations' places (Great Bentley, Weeley, Frinton-on-Sea,
  Cantley, Spooner Row), so the page adds no "Between …". The Sunshine Coast and Mayflower lines, Ipswich to
  Westerfield and Derby Road, and the Felixstowe branch have no train company on the map but carry Greater Anglia
  trains; all given items, none skipped. Step 8 done: 1,281 facts in `src/data/passes-near.json`; `npm run check` and
  `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 29, 40 stretches of the East of England from Needham Market to
  Westerfield through to Alresford (Essex) to Great Bentley (Needham Market to Westerfield and Ipswich; the Great Eastern
  Main Line from Ipswich by Manningtree, Colchester, Marks Tey, Kelvedon, Witham, Hatfield Peverel, Beaulieu Park and
  Chelmsford to Ingatestone, Shenfield, Brentwood and Harold Wood; the Southend Victoria line from Shenfield by
  Billericay, Wickford, Rayleigh, Hockley, Rochford, Southend Airport and Prittlewell to Southend Victoria; the Crouch
  Valley line from Wickford by Battlesbridge, South Woodham Ferrers, North Fambridge, Althorne and Burnham-on-Crouch to
  Southminster; the Braintree branch from Witham by White Notley, Cressing and Braintree Freeport to Braintree; the
  Gainsborough line from Marks Tey by Chappel & Wakes Colne and Bures to Sudbury; and Colchester and Colchester Town by
  Hythe to Wivenhoe, Alresford and Great Bentley); 1,241 of 2,376 done, East of England 135 of 237. Every fact checked
  against the article in `source` (`wiki_text.py`); nearby Wikipedia articles were also listed from
  `wiki/gb-articles.tsv.gz`. Three items take their facts from a wider article: Combretovium (the Baylham article), the
  Golden Fleece (Brook Street, Essex) and St Etheldreda's church (White Notley). Rayleigh's sights are shared out
  (Rayleigh Castle on Rayleigh to Wickford, the Dutch Cottage on Hockley to Rayleigh), and the Prittlewell burial and
  Southend Central Museum, which shows its finds, go to neighbouring stretches. Passed over: the Witham rail crash (1905)
  and the Little Cornard derailment (2010); Copford's church wall paintings (no position for the church). No point is our
  own calculation: Combretovium's, the Golden Fleece's and St Etheldreda's are Historic England's list points (the
  scheduled area at Baylham is 98 m from the track by its outline, its point 452 m), the rest Wikipedia's geotags. The
  farthest items are Blue House Farm and St Etheldreda's church (both 752 m, a little more than the usual 700 m),
  Brentwood Cathedral (687 m), Gainsborough's House (583 m), Witham's town hall (556 m) and Alec Hunter Academy (584 m);
  the rest are within 540 m. Chappel Viaduct is `crosses`. North Fambridge to South Woodham Ferrers, Althorne to North
  Fambridge, Colchester to Hythe and Colchester Town to Hythe have no train company on the map but carry Greater Anglia
  trains; Needham Market to Westerfield (round Ipswich) may carry few regular passenger trains. All given items, none
  skipped. Step 8 done: 1,241 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 28, 40 stretches of the East of England from Bishops
  Stortford to Stansted Mountfitchet through to Needham Market to Stowmarket (the West Anglia line from Stansted
  Mountfitchet by Bishops Stortford, Sawbridgeworth, Harlow Mill, Harlow Town and Roydon to Broxbourne, Cheshunt and
  Waltham Cross, and Cheshunt to Theobalds Grove and Turkey Street; the Hertford East branch from Broxbourne by Rye
  House, St Margarets and Ware to Hertford East; the Stansted Airport branch from Stansted Mountfitchet and Elsenham;
  Cambridge to Cambridge North, Waterbeach and Ely, and Cambridge to Dullingham and Newmarket; round Ely to Manea,
  March, Whittlesea, Shippea Hill, Soham and Littleport, with the two curves Littleport to Manea and Manea to Shippea
  Hill; the Fen line from Littleport by Downham Market and Watlington to Kings Lynn; Soham to Kennett, Newmarket and
  Bury St Edmunds; and Bury St Edmunds by Thurston and Elmswell to Stowmarket, with Diss and Needham Market to
  Stowmarket); 1,201 of 2,376 done, East of England 95 of 237. Every fact checked against the article in `source`
  (`wiki_text.py`); nearby Wikipedia articles were also listed from `wiki/gb-articles.tsv.gz`. Neighbours already used
  got another item: Mountfitchet Castle (on Elsenham to Stansted Mountfitchet) and the Eleanor Cross at Waltham Cross
  (on Enfield Lock to Waltham Cross) were passed over; within the batch, Theobalds and Cedars Park go to one stretch
  only (Theobalds Grove to Turkey Street), and the Ely stretches share out Ely Cathedral, the 2021 Boat Race, Queen
  Adelaide, Prickwillow, Ely Pits and Meadows and Hawk Bridge. Passed over: the Soham rail disaster and the Stowmarket
  Guncotton Explosion (both fatal); Bishop's Stortford Museum (Cecil Rhodes's birthplace), for Thorley Wash; the Food
  Museum at Stowmarket (more than 700 m from the line by its article's point). Every point is its article's own, from
  Wikipedia's geotags, except Devil's Dyke's, which is our own calculation: the nearest point of Historic England's
  mapped outline to the track (7 m; the railway cutting is left out of the scheduled area). The farthest items are the
  Lee Valley White Water Centre (714 m, a little more than the usual 700 m), Ely Cathedral (693 m), Denver Windmill
  (660 m) and the Glen Chalk Caves (556 m); the rest are within 460 m. Hawk Bridge and Devil's Dyke are `crosses`.
  Littleport to Manea and Manea to Shippea Hill (curves round Ely that may carry no regular passenger train) and Kennett
  to Soham (no train company on the map, though Ipswich to Peterborough trains use it) were given items, not skipped.
  Step 8 done: 1,201 facts in `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 27, 40 stretches of the East of England from Lidlington to
  Ridgmont through to Elsenham (Essex) to Stansted Mountfitchet (the Marston Vale line from Lidlington by Ridgmont and
  Aspley Guise to Woburn Sands; the West Coast Main Line from Tring by Berkhamsted, Hemel Hempstead, Apsley and Kings
  Langley to Watford Junction; the Abbey line from Watford Junction by Watford North, Garston, Bricket Wood, How Wood
  and Park Street to St Albans Abbey; Chorleywood to Rickmansworth; Peterborough to Stamford and Whittlesea; the East
  Coast Main Line from Peterborough by Huntingdon, St Neots, Sandy, Biggleswade and Arlesey to Hitchin and Stevenage;
  the Cambridge line from Hitchin by Letchworth Garden City, Baldock, Ashwell & Morden, Royston, Meldreth, Shepreth
  and Foxton to Cambridge South and Cambridge; and the West Anglia line from Cambridge South by Shelford, Whittlesford
  Parkway, Great Chesterford, Audley End and Newport to Elsenham and Stansted Mountfitchet); 1,161 of 2,376 done, East
  of England 55 of 237. Every fact checked against the article in `source` (`wiki_text.py`); nearby Wikipedia articles
  were also listed from `wiki/gb-articles.tsv.gz`. The Spirella Building has no article of its own, so its facts come
  from the Letchworth article. Passed over: the Bourne End, 1895 St Neots, Abbots Ripton and Connington South rail
  crashes, and the murder of Ross Parker; Soul Survivor (closed after a scandal); Quendon Hall (more than 850 m away)
  and Aspley Guise & Woburn Sands Golf Club (its name repeats both stations); Borough Hill, Sawston (an article of one
  sentence). Three items are about a station's own place (Woburn Sands, Shepreth and
  Elsenham), so the page leaves "Between X and Y" off them. Points are the articles' own, except four
  from Historic England's list entries: the Möhne Dam model at the Building Research Establishment, Wilbury Hill Camp,
  the Spirella Building and Therfield Heath (the five bowl barrows' entry). No point is our own calculation. The
  farthest items are Moor Mill Quarry (723 m, a little more than the usual 700 m), the Royal Masonic School for Girls
  (685 m), Royston Cave (660 m), the Six Hills (647 m), the Botanic Garden (631 m; its article's point, not the
  garden's edge) and Spielplatz (616 m); the rest are within 600 m. The Watford Tunnels and the Nene Viaduct are
  `crosses`; Husborne Crawley's old station is on the line, with no side. Step 8 done: 1,161 facts in
  `src/data/passes-near.json`; `npm run check` and `npm run build` pass.

- November 23rd 2026 (Claude Code, scheduled task): batch 26, 40 stretches from Brixton to Herne Hill through to
  Lidlington to Millbrook (Bedfordshire), finishing London and starting the East of England (Brixton, Herne Hill,
  Loughborough Junction and Denmark Hill; Cannon Street, Blackfriars and London Bridge to Waterloo East; Croydon to
  Norwood Junction; Canonbury to Dalston; Bethnal Green and Hackney Wick to Lea Bridge; Hither Green, Ladywell, Lewisham
  and St Johns; Grove Park to Hither Green and Lee; Barking to Stratford; Barnehurst to Crayford and Dartford; then the
  Midland Main Line from Elstree & Borehamwood by Radlett, St Albans, Harpenden, Luton and Flitwick to Bedford and
  Wellingborough, and the Marston Vale line from Bedford to Millbrook); 1,121 of 2,376 done, London 421 of 421
  (finished), East of England 15 of 237. Every fact checked against the article in `source` (`wiki_text.py`); nearby
  Wikipedia articles were also listed from `wiki/gb-articles.tsv.gz` (up to 700 m). Neighbours already used got another
  item: the Maudsley Hospital, Southwark Cathedral, Holy Innocents South Norwood, Brookmill Road nature reserve, the River
  Quaggy, Chinbrook Meadows, the Orbit, V&A East, Crayford Stadium, Slade Green Depot, Dartford Priory, Holy Trinity
  Dartford, Gate Studios, the Union Chapel, Barking Abbey and the Theatre Royal Stratford East were passed over; within
  the batch, Borough Market, the George Inn, the Rose and the Menier Chocolate Factory go one each to the four stretches
  round London Bridge. The Migration Museum was passed over (it left Lewisham in 2025). Passed over: the 1981 Brixton
  riot, the 1857 and 1957 Lewisham, 1898 St Johns, 1967 Hither Green and 2026 Bedford rail crashes, the 2017 and 2019
  London Bridge attacks, the Marchioness disaster, the murder of Gordon Semple and the bombing of Sandhurst Road School.
  Points are the articles' own, from Wikipedia's geotags, except St Mary's Church, Little Ilford (Historic England's
  list entry point) and four calculated as the nearest point of Historic England's mapped outline: the park of Luton
  Hoo (36 m), the grounds of Napsbury Hospital (20 m), Beech Bottom Dyke (21 m) and Waulud's Bank (179 m; the article's
  point is 398 m away). The farthest items are the Forest of Marston Vale (550 m), Millbrook Proving Ground (535 m),
  Stewartby (427 m), Trinity Green Almshouses (394 m), Kenilworth Road (391 m) and the Katherine cross (383 m); the rest
  are within 375 m. Cannon Street to Waterloo East and London Bridge to Waterloo East have no train company on the map;
  given items, not skipped. Step 8 done: 1,121 facts in `src/data/passes-near.json`; `npm run check` and `npm run
  build` pass.

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
