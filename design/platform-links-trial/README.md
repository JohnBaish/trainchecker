# How platforms connect: a first trial (November 21st 2026)

For "Connections": can the page say "over the footbridge"? Tried on six stations: Newton Abbot,
Twyford, Oxford, Reading, Bristol Temple Meads and Clapham Junction. Nothing built.

## Knowledgebase Stations feed (`kbread.py`)

The step-free note says how the station as a whole is crossed, not which platforms are together:

- Newton Abbot: "step free access to all platforms via lifts and an overbridge from platform 3"
- Twyford: "step free access to all platforms via a liftbridge"
- Oxford: "via lifts and an overbridge to access platform 4"
- Reading: "platforms can be reached via lift and bridge"
- Bristol Temple Meads: "Lifts to all platforms and facilities" (the subway is named only under Toilets)
- Clapham Junction: "the footbridge which has lifts to all platforms"

Other notes hint at shared platforms ("platforms 1/2 and 3", "Platform 13/15"). The files arrive
gzipped. Its licence for showing this text hasn't been read.

## OpenStreetMap (`osmread.py`, `islands.py`)

From `api.openstreetmap.org/api/0.6/map` (the Overpass service dropped every connection from here).
All six stations have every platform drawn with its number, and footbridges, subways, steps and
lifts.

A crude test (two platforms are together if a straight line between their middles crosses no
track) gave:

- Newton Abbot: 1/2 | 3 (right, by the Knowledgebase's "platforms 1/2 and 3")
- Twyford: 1 | 2/3 | 4/5
- Oxford: 1 | 2 | 3 | 4 (wrong: the bay platforms are reached on the level from platform 3)
- Reading: 1/2 | 3/7 | 4 | 5/6 | 8/9 | 10/11 | 12/13 | 14/15 (the islands 8 to 15 look right; the
  bays 1 to 6 are muddled)
- Bristol Temple Meads: 1 | 2 | 3 | 4 | 5/6 | 7 | 8 | 9/11 | 10/12 | 13/15
- Clapham Junction: 1/2 | 3/4 | 5/6 | 7 | 8 | 9/10 | 11/12 | 13/14 | 15/16 | 17

So the straight-line test isn't good enough: bay platforms fool it. The proper way is to follow the
drawn footpaths from one platform to the other and see whether the way uses a bridge, a subway or
steps. That is a piece of work of its own, done once for every station and saved as a table.
Not checked against the stations themselves.
