# Following the drawn paths: six stations (November 21st 2026)

Handover §10 step 3. `paths.py` follows the map's footways, steps, corridors, paths and lifts,
and walks across platforms, from each platform to each other one, taking the shortest walk.
It then says what that walk uses: on the level, a bridge (`bridge=yes` or `layer` 1 or more) or
a tunnel (`tunnel=yes` or `layer` -1 or less). Ways marked `access=private` or `foot=no` are
left out. Map data from `api.openstreetmap.org` (boxes round each station, not kept). Nothing
here was checked at the stations themselves.

Platforms on the level with each other (|  separates groups), then how the groups are crossed:

1. Newton Abbot: 1/2 | 3, by the bridge. Agrees with the Knowledgebase ("overbridge from
   platform 3") and with the crude test.
2. Twyford: 1 | 2/3 | 4/5, by the bridge. Same as the crude test.
3. Oxford: 1/2/3 | 4, by the bridge. The crude test had 1 | 2 | 3 | 4; this is what Claude
   believes is right (the bays beside platform 3).
4. Reading: 1 to 7 all on the level (walks of up to about 190 metres, through the station);
   8/9, 10/11, 12/13, 14/15 islands, all by the bridge. The crude test muddled the bays.
5. Bristol Temple Meads: 1/2/3/4 | 5/6/7/8 | 9/10/11/12 | 13/15, all by the subway. No
   platform 14 on the map. Not checked.
6. Clapham Junction: nine islands, 1/2 … 15/16 and 17, crossed by the subway or the bridge,
   whichever is shorter for the pair (78 pairs by subway, 50 by bridge). Not checked.

Walk lengths are straight lines along the drawn paths, with no allowance for stairs or lifts.

What this doesn't yet do: platform labels such as 9B or Paddington's A and B (handover §6.4);
stations whose paths don't quite join a platform (none of these six); choosing between bridge
and subway when both are about as long.
