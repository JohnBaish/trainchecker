# exits.json: licence and sources

`exits.json` (each station's ways out, and how each platform reaches them, for "Station exits") is
made partly from OpenStreetMap data, © OpenStreetMap contributors, available under the Open
Database Licence (ODbL) 1.0: https://opendatacommons.org/licenses/odbl/1-0/
(https://www.openstreetmap.org/copyright). For the larger stations and those the map data couldn't
answer, the exits come from National Rail's station maps, read by eye (facts only; no map is
reproduced; John, November 22nd 2026).

How it was made: `design/platform-links-trial/exits.py` (OpenStreetMap, the United Kingdom extract
from download.openstreetmap.fr dated November 21st 2026) and
`design/platform-links-trial/build_exits_table.py`, which joins it with the maps' readings
(`design/platform-links-trial/exits-2026-11-22/maps-strict-*.json`). The format is described at
the top of `build_exits_table.py`.
