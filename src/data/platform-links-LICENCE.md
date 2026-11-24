# platform-links.json: licence

`platform-links.json` (how each station's platforms connect, for Connections' "over the
footbridge") is made from OpenStreetMap data, © OpenStreetMap contributors.

It is made available under the Open Database Licence (ODbL) 1.0:
https://opendatacommons.org/licenses/odbl/1-0/

OpenStreetMap's copyright and licence page: https://www.openstreetmap.org/copyright

How it was made: `design/platform-links-trial/build_table.py`, run on the United Kingdom extract
from download.openstreetmap.fr dated November 21st 2026. The rest of Trainchecker's code isn't
covered by this licence.

The format: for each station code, `g` lists the platforms in groups that are on the level with
each other, each group split into islands (platforms whose shapes touch on the map); `x` holds one
letter for each pair of groups, in order (1–2, 1–3, …, 2–3, …): `b` bridge, `s` subway, `e`
either, `r` out of the station by road, `x` level crossing, `u` over or under (not known which),
`?` no walk found, and `B`, `S`, `E` as `b`, `s`, `e` with a walk round on the level too.

John's own corrections (`design/platform-links-trial/links-overrides.json`: Reading's islands and its
"bridge") are applied after each rebuild with `python3 -I design/platform-links-trial/apply_links_overrides.py
src/data/platform-links.json`.
