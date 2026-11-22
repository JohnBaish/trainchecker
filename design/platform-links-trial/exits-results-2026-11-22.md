# Exits: a trial on six stations (November 22nd 2026)

For a possible "Exits" section under Arrivals (John): "The exits are by platforms 1 and 4", then
for the train you're on, how to get to the exit. Nothing built. Not checked at the stations.

**How:** maps of the six stations from api.openstreetmap.org (downloaded November 22nd 2026), and
`exits.py` on `build_table.py`'s walking graph. From each platform, follow footways, steps,
subways, bridges and lifts until a road (or a car park's road) is reached; points joined by road
within 80 metres are one way out. A way out is kept if it is the nearest for at least one platform,
and is "by" the platforms that reach it on the level within 10 metres of the shortest walk. A
station building beside a platform (not over it) and beside a road counts as a way out even where
no path is drawn through it (Newton Abbot); a train shed over the platforms doesn't (Bristol).

**Why not the map's entrances:** most points tagged as entrances are ordinary building doors (shops,
offices, flats); only one station entrance at Bristol and three subway entrances at Clapham
Junction are marked as such.

**Results** (the "way out" numbers are the script's own, not used anywhere):

```

== TWY: platforms 1, 2, 3, 4, 5; 3 way(s) out found, 2 nearest for some platform
  way out 1: onto Hurst Road, unclassified (51.47513,-0.86306), by platform(s) 1
  way out 2: onto service (51.47495,-0.86511), by platform(s) 4, 5
    platform 1: way out 1, 6 m, level
    platform 2: way out 1, 37 m, bridge
    platform 3: way out 1, 41 m, bridge
    platform 4: way out 2, 8 m, level
    platform 5: way out 2, 8 m, level

== NTA: platforms 1, 2, 3; 2 way(s) out found, 1 nearest for some platform
  way out 1: onto service (50.52991,-3.59982), by platform(s) 3
    platform 1: way out 1, 53 m, bridge
    platform 2: way out 1, 53 m, bridge
    platform 3: way out 1, 25 m, level

== OXF: platforms 1, 2, 3, 4; 8 way(s) out found, 2 nearest for some platform
  way out 1: onto Roger Dudman Way (51.75351,-1.27080), by platform(s) 4
  way out 2: onto service (51.75348,-1.26964), by platform(s) 3
    platform 1: way out 2, 65 m, level
    platform 2: way out 2, 57 m, level
    platform 3: way out 2, 34 m, level
    platform 4: way out 1, 12 m, level

== RDG: platforms 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15; 14 way(s) out found, 4 nearest for some platform
  way out 1: onto Forbury Road, Vastern Road (51.45830,-0.96843), by platform(s) 4
  way out 3: onto Greyfriars Road, Station Hill (51.45876,-0.97538), by platform(s) 1
  way out 4: onto Trooper Potts Way, unclassified (51.46006,-0.97203), by platform(s) 15
  way out 6: onto Garrard Street, Station Approach, service (51.45832,-0.97230), by platform(s) 4, 5, 6, 7
    platform 1: way out 3, 77 m, level
    platform 2: way out 3, 94 m, level
    platform 3: way out 3, 142 m, level
    platform 4: way out 1, 26 m, level
    platform 5: way out 6, 95 m, level
    platform 6: way out 6, 95 m, level
    platform 7: way out 6, 92 m, level
    platform 8: way out 6, 127 m, bridge
    platform 9: way out 6, 129 m, bridge
    platform 10: way out 4, 140 m, bridge
    platform 11: way out 4, 138 m, bridge
    platform 12: way out 4, 122 m, bridge
    platform 13: way out 4, 131 m, bridge
    platform 14: way out 4, 89 m, level
    platform 15: way out 4, 77 m, level

== BRI: platforms 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15; 8 way(s) out found, 4 nearest for some platform
  way out 1: onto Station Approach, service (51.44915,-2.58145), by platform(s) 3
  way out 2: onto service (51.45013,-2.58128), by platform(s) 3
  way out 4: onto Cattle Market Road (51.44785,-2.58217), by platform(s) 2
  way out 5: onto Cattle Market Road, service (51.44846,-2.57937), by platform(s) 2
    platform 1: way out 2, 91 m, level
    platform 2: way out 4, 100 m, level
    platform 3: way out 1, 32 m, level
    platform 4: way out 1, 66 m, level
    platform 5: way out 1, 89 m, subway
    platform 6: way out 1, 135 m, subway
    platform 7: way out 1, 97 m, subway
    platform 8: way out 1, 135 m, subway
    platform 9: way out 1, 116 m, subway
    platform 10: way out 1, 160 m, subway
    platform 11: way out 1, 122 m, subway
    platform 12: way out 1, 160 m, subway
    platform 13: way out 5, 131 m, subway
    platform 15: way out 5, 131 m, subway

== CLJ: platforms 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17; 8 way(s) out found, 2 nearest for some platform
  way out 1: onto Grant Road (51.46546,-0.17057), by platform(s) 1
  way out 2: onto Junction Approach (51.46394,-0.16904), by platform(s) 17
    platform 1: way out 1, 28 m, level
    platform 2: way out 1, 74 m, level
    platform 3: way out 1, 66 m, subway
    platform 4: way out 1, 69 m, subway
    platform 5: way out 1, 81 m, subway
    platform 6: way out 1, 84 m, subway
    platform 7: way out 1, 156 m, subway
    platform 8: way out 1, 156 m, subway
    platform 9: way out 2, 133 m, subway
    platform 10: way out 2, 133 m, subway
    platform 11: way out 2, 109 m, subway
    platform 12: way out 2, 109 m, subway
    platform 13: way out 2, 93 m, subway
    platform 14: way out 2, 93 m, subway
    platform 15: way out 2, 71 m, subway
    platform 16: way out 2, 71 m, subway
    platform 17: way out 2, 36 m, level
```

**Limits seen:** a way out that is no platform's nearest is left out (Clapham Junction's Brighton
Yard, over the footbridge); some names are only "service" (a road with no name, often a car park or
forecourt); the distances are along the map's lines, not measured at the station.

## John's check (November 22nd 2026)

- Oxford, Twyford and Bristol Temple Meads: right. Clapham Junction: sounds right, not sure.
- Newton Abbot: right, but say "by the station building", not "through": there may be a gate.
- Reading: platforms 4 to 7 can all use the exit near Forbury Road. From platforms 8 to 15 you
  can go either way off the bridge: to Station Approach South or Forbury Road, or to Trooper Potts
  Way (the north side). That way isn't level: there's an escalator.
- Network Rail's Reading station map (shown by John) names the ways out as people see them:
  Station Hill (two), Forbury Road, Apex Plaza, and Station Car Park on the north side. The map
  data has road names instead ("Trooper Potts Way" for the north side).

**National Rail's station maps:** every station page tried (the six, and Midgham, Earley and
Theale) lists one or two "Station Map" files, as a picture or a PDF. From this session the pages
can be read (www.nationalrail.co.uk), but the files themselves can't: images.nationalrail.co.uk
and assets.nationalrail.co.uk are refused by the environment's network rules.

## National Rail's station maps, read (November 22nd 2026)

The two hosts were allowed in the environment (John). All twelve files for the six stations
downloaded: a station map and an "Onward Travel Information" PDF each.

- **Small stations** (Twyford, Newton Abbot, Oxford): a picture (800 pixels wide) drawn in one
  style, with an "Entrance/Exit" symbol, ticket gates, the footbridge and lifts, and the road
  named. Readable by eye; no text inside to read automatically.
- **Network Rail's own stations** (Reading, Clapham Junction; Bristol's is a PDF of a picture): the
  PDF has real text with positions, "Entrance/exit" and each exit's name ("Grant Road",
  "Brighton Yard", "St John's Hill") and the platform numbers, so these could be read by script.
- **Onward Travel Information:** a local street map with "Station Entrance/Exit" marked; not used.

Against the trial: Twyford, Newton Abbot and Oxford agree (Newton Abbot's ticket gates are by
platform 3, which fits John's "by", not "through"; Twyford's map names the road "Hurst Lane",
the map data "Hurst Road", not settled). Clapham Junction: three ways out, Grant Road (by platform
1, and by the subway from the others), St John's Hill (by the subway, on the platform 17 side) and
Brighton Yard (by the footbridge, also on the platform 17 side); the trial found the first two.
