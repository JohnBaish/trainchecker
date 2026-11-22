# Turning the station-map readings into one strict table (Trainchecker "Station exits")

Input: maps-read-44.json and maps-read-85.json in this folder (free-text readings of National Rail
station maps). The maps themselves are PNGs in .../scratchpad/nr/all/png/ (the 44) and
.../scratchpad/nr/b85/png/ (the 85), named <CRS>-*.png; look at a map whenever the reading is
unclear. Write only under .../scratchpad/nr/strict/.

For each of your stations, write one object in this exact shape:

{"RDG": {
  "exits": [ {"name": "Forbury Road", "by": ["4","5","6","7"]},
             {"name": "Station Car Park", "by": []} ],
  "platforms": { "4": [[0, "l"]], "8": [[0, "b"], [1, "b"]] },
  "kind": "by",
  "hours": {"1": "6am to 10pm"},
  "note": ""
}}

- exits: each public way out to a street. "name": the short name as people would say it, taken
  from the map's label without "Entrance/exit", "Exit to", "Way out 3" or numbers ("Forbury Road",
  "Station Hill", "Apex Plaza", "Bishopsgate (East)"); keep a bracket only where two exits would
  otherwise share a name ("Station Hill (north)"). If the map gives no label, use the street or
  place it opens onto if the map shows it ("Station Road", "the car park"), else null. Two doors
  side by side onto the same street are ONE exit. "by": platforms it opens off on the same level.
- platforms: for EVERY platform on the map, the exits it can reach and how, as [exit index, via]:
  "l" on the level (straight out, or a short ramp), "b" over a footbridge or bridge, "s" through a
  subway, "x" across a level crossing (a public road or footpath level crossing only),
  "c" across a concourse at the end of the platforms (termini), "u" up or down by stairs, lift or
  escalator to a concourse or entrance hall above or below (not a footbridge or subway). Nearest
  or most usual exit first; at most three per platform. Never use a barrow crossing (staff only):
  if that is the only way, leave the platform out.
- kind: "by" (exits open off particular platforms), "concourse" (every platform goes out across
  a concourse at the end: termini), "above" or "below" (every exit is up, or down, from all the
  platforms), "mixed" (otherwise).
- hours: only if the map gives opening times for an exit (key = exit index as a string).
- note: anything a reader should know; keep it short.

Rules from John (who knows some of these stations): Chislehurst has NO exit from platform 1 to the
north car park. Southend Airport's exit is by platform 1. Newton Abbot-style wording "by the
station building" is fine. Leave out Kings Heath (no exit shown) and these stations where the
doubt is unresolved: Mistley, Gainsborough Central, Hall Road, Enfield Chase, Swinton (South
Yorks), Bridgeton, Greenhithe for Bluewater, Hampton Court, Bursledon, Moreton (Dorset), Bromley
North, Grove Park, New Eltham, Edenbridge Town, Carshalton Beeches — write them as {"skip": true}.
Southend Airport: exits by platform 1 only, platforms {} (no routes).

Write valid JSON to the output file you're given. Reply with a one-line summary per station only
where you changed something from the reading or were unsure.
