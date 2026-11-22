# Reading station maps for exits (Trainchecker)

You are reading National Rail / Network Rail station maps (pictures) to record, for each station,
its ways out to the street and which platforms they are by. This will feed a page that tells
train passengers "The exits are by platforms 1 and 17" and, for the platform their train arrives
at, how to reach an exit ("over the footbridge", "through the subway", "on the same level").

Maps: PNG files in /tmp/claude-0/-home-user/d3c60e33-acbf-5534-93d2-95862bc437b9/scratchpad/nr/all/png/
named <CRS>-<n>.png or <CRS>-<n>-<page>.png. Look at every file for your station (Read tool shows
images). Some files are not station maps (rail replacement bus leaflets, ticket gate notices,
local street maps): note and ignore them. If an image is too small to read, crop/enlarge with
Python PIL into your own scratch file (write only under .../nr/all/work/).

For each station record, ONLY what the map actually shows (never guess; if unsure, say so):
- exits: each way out to the street. Its name as the map labels it ("Entrance/exit Grant Road"),
  or, if unnamed, the street it opens onto if shown, else null. "by": the platform numbers it
  opens off on the same level (where you can walk straight out). If it is only reached by a
  bridge/subway/concourse not beside any platform, "by" is [] and say where it is in "note".
  Include exits from the station building/concourse. Leave out car-park-only and staff doors
  unless they are clearly public entrances.
- routes: for each platform, how you get to each exit you can reach: "level", "footbridge",
  "subway", or "concourse" (a level concourse at the end of the platforms, as at terminus
  stations); add "lift", "escalator", "steps" if shown. Keep it short.
- unsure: anything you couldn't read or that looks ambiguous.

Write JSON (UTF-8) to the output file you're given, one object keyed by station code:
{"RDG": {"map_files": ["RDG-1-1.png"], "ignored": [], "exits": [{"name": "Forbury Road",
 "by": ["4","5","6","7"], "note": ""}], "routes": {"8": [{"exit": "Forbury Road", "via":
 "footbridge, escalator"}]}, "unsure": ""}}
Platform numbers as strings as the map shows them ("9B" kept). Be accurate; it's better to say
"unsure" than to fill in. At the end, reply with a short summary per station (exits found, how
sure you are).
