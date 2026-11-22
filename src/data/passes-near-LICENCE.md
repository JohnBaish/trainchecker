# passes-near.json: licence

The stretches in `passes-near.json` (every stretch of railway between neighbouring stations with any
of it in England, and its length, for "Fact of the journey") are made from OpenStreetMap data,
© OpenStreetMap contributors.

They are made available under the Open Database Licence (ODbL) 1.0:
https://opendatacommons.org/licenses/odbl/1-0/

OpenStreetMap's copyright and licence page: https://www.openstreetmap.org/copyright

How it was made: `design/passes-near/build_stretches.py`, run on the United Kingdom extract from
download.openstreetmap.fr dated November 21st 2026, then `design/passes-near/to_site.py`.

The sentences in `items` are written afresh for Trainchecker, from facts checked against Historic
England's National Heritage List for England (Open Government Licence: contains Historic England
data © Historic England 2026), Wikipedia and other sources; they aren't covered by the Open Database
Licence. The rest of Trainchecker's code isn't covered by it either.
