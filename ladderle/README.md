# Ladderle

**One letter at a time**

A four-letter word ladder game built with HTML, CSS, and browser JavaScript. Change exactly one letter per move, making a valid word each time, to connect the start and goal.

## Run locally

Keep this folder structure intact. Serve it with any static server:

```sh
python -m http.server 8080
```

Open http://localhost:8080. No build step or production dependencies are needed. Opening index.html directly can work, but browser storage, clipboard, and sharing behave more reliably on localhost or HTTPS.

## What changed

- Ladderle branding, favicon, tagline, and page metadata.
- A simple, responsive layout with warm paper, timber tones and blue matching tiles and a ladder logo, light/dark themes, a scrollable ladder, and simpler controls.
- Daily / Practice navigation; practice levels use actual shortest distances: Easy 4, Medium 5, Hard 6 moves.
- Two undos per puzzle. Deleting an unsubmitted letter is free. Backspace never spends an undo.
- Browser persistence for ladders, typed input, undos, hints, results, sound, and theme. Daily and custom attempts resume when reselected.
- Exact shortest paths from the same dictionary used to accept words.
- 2,052 accepted four-letter words and 1,000 distinct daily pairs. Every daily has a verified 4–6 move shortest solution using preferred vocabulary.
- Hints progress from position to letter to next word, based on the current route.
- Confirmed solution reveals end the attempt and do not count as solves.
- Separate daily/practice results; daily results are counted once per date.
- Correct four-letter tutorial and solution rows; changed-letter markers; spoiler-free result sharing; custom puzzle links.
- Accessible modal labels, keyboard focus trapping/restoration, reduced-motion support, screen-reader move announcements, and enabled browser zoom.
- Optional, responsive advertising containers. No ad network, analytics, or tracking is bundled.

## Style update

The interface uses plain, casual labels and a short worked tutorial. The palette uses a warm paper background, wood-toned ladder, apricot controls and blue matching tiles. Dark lettering keeps the light colors readable. The header logo and favicon share the same SVG: a simple ladder.

## Ladder theme

Words sit on timber-colored rungs between two thicker, shaded rails. Small inset fixings connect each rung to the rails, and dark feet finish the ladder. The active row uses an apricot focus marker. Move numbers sit outside the rails to keep the ladder easy to read. The logo and favicon use a matching ladder icon.

The local storage prefix remains `stepple_` internally so existing saved games, results, and the two-undo limit are preserved when updating on the same site origin. It is not shown in the game.

## Taller board

The game fills the available viewport, with a more compact header and controls. The word ladder takes the remaining height, without the previous height caps. Tighter row spacing shows more moves at once. Footer links and optional lower-page ads remain below the game.

## Rules and statistics

- Each transition is one move. The start word is move zero.
- Undo removes the latest accepted word and clears typed input. It reduces the route's move count, and results separately report undos used.
- Exactly two undos are available in each attempt. Completing or revealing an attempt locks it.
- Reopening a daily or the same custom word pair restores that attempt, including spent undos.
- New practice games are separate attempts. The latest practice attempt can be resumed; choosing a new difficulty replaces the current practice route.
- Revisiting an earlier word is allowed and produces a warning.
- Blue tiles match the goal at that position; they are not locked.
- “Perfect” means a shortest route without hints. Undos are allowed.
- Finished statistics include solves and reveals. Solved excludes reveals. Custom challenges do not affect daily/practice statistics.
- A daily streak counts consecutive solved UTC dates. Hints and undos are allowed. Revealing today's answer breaks the streak; yesterday's streak remains visible while today's attempt is unfinished.
- Saves are local to this browser and origin. Clearing site data removes them. This is not an anti-cheat system or cloud sync.
- Old Ladderle statistics are left untouched and are not imported because their scoring and streak rules differ.

## Daily scheduling

Daily puzzles change globally at **00:00 UTC**. Puzzle #1 is October 29, 2026. An unfinished earlier daily remains open after midnight or reload until the player chooses today's puzzle.

**The daily bank contains 1,000 unique word pairs and repeats after 1,000 days.** Reversing a pair does not count as a different puzzle. The schedule includes 334 puzzles at 4 moves, 333 at 5 moves, and 333 at 6 moves. It uses 1,396 different endpoints; no endpoint appears more than six times.

The dictionary contains **2,052 four-letter words**, including 422 additions to the previous version. The daily bank is generated from a preferred-word subset, and each stored solution uses only that subset. Its distance is checked against the entire accepted dictionary, so accepting a less common word cannot produce a route below the advertised shortest count.

Four to six moves is the shortest-route target, **not a limit on guesses**. Players may take longer. Practice uses exact targets of 4, 5, and 6 moves for Easy, Medium, and Hard.

Rebuild the bank after editing COMMON_WORDS or DAILY_WORDS:

```sh
python scripts/build-puzzles.py
node --test tests/game.test.cjs
```

The builder is deterministic and uses only Python's standard library. It checks routes against all accepted words, requires a preferred-word route of equal length, balances route lengths, avoids reversed duplicate pairs, limits repeated endpoints, and avoids sharing an endpoint on consecutive days. This is generated content, not 1,000 individually hand-edited puzzles; vocabulary should still be playtested.

The runtime validates the selected daily, rather than solving all 1,000 puzzles during startup. Changing dictionary or schedule data may change date assignments and shortest routes. Already-saved attempts remain resumable, including spent undos; previously finished statistics remain recorded.

## Advertising integration

The game works without ads. js/ads.js only exposes layout inventory; it makes no requests. In the browser console, preview reserved space with:

```js
LadderleAds.setEnabled(true)
```

- Desktop uses the sidebar; narrower screens use a lower-page slot. A separate results slot is available.
- All containers are hidden by default. No fake advertisements are displayed to players.
- Use .ad-mount elements and their data-ad-placement attributes to mount your provider. Configure placements to match available width, including narrow phones.
- Pick the placements you actually want before enabling them; you do not have to fill every available slot.
- Keep the reserved container dimensions stable. Never place an ad over game controls or make the keyboard jump when an ad loads.
- Load provider code asynchronously and keep gameplay functional if it is blocked, slow, or unavailable.
- Preserve clear “Advertisements” labels and sufficient separation from clickable controls; verify the chosen provider's current placement requirements.
- Complete provider approval, consent settings, publisher verification, and ads.txt setup as required by your provider before serving ads.
- Replace/update the current no-ad privacy text to accurately describe the actual provider, data processing, consent options, hosting, and contact information before activating any third-party scripts.
- Google AdSense placement reference: https://support.google.com/adsense/answer/1346295
- Google consent requirements reference: https://support.google.com/adsense/answer/13554116

## Verification

Run the dependency-free logic tests with Node.js 18 or later:

```sh
node --test tests/game.test.cjs
```

Tests cover independent shortest-distance comparisons, two-undo enforcement, free deletion, invalid guesses, persistence, duplicate result protection, reveals, UTC dates, practice difficulty, custom validation, hints, malformed saves, blocked storage, and spoiler-free sharing.

A graphical browser was unavailable in the editing environment, and its download was blocked. **Rendered layout and real-device behavior still require browser testing.**

## Before public launch

- Test in current Safari/iOS, Chrome/Android, Firefox, and desktop Chrome/Edge.
- Check 320px-wide screens, landscape, 200% zoom, short viewports, and enlarged text.
- Play using both hardware and on-screen keyboards; check Enter after clicking controls.
- Confirm focus stays inside dialogs, Escape closes them, focus returns correctly, and screen-reader announcements are useful.
- Test reloads, switching between modes, midnight rollover, two exhausted undos, invalid custom links, sharing cancellation, and blocked browser storage.
- Inspect every selected ad placement at mobile and desktop sizes, including empty inventory and blocked scripts.
- Playtest/review the expanded daily bank and dictionary. The supplied list includes names, inflections, uncommon vocabulary, and potentially unsuitable entries; choose and document the intended acceptance policy.
- Confirm the supplied dictionary's provenance and commercial-use license. The uploaded source did not include a license; no license grant is implied by this update.
- Set your real domain, add a social preview image and its absolute og:image URL, and add a real contact/report-a-problem link. No placeholder contact address is shipped.
- Review the privacy copy against your actual host and any scripts you add.
- Deploy the entire folder to a static HTTPS host. Keep js/ paths unchanged. Check all assets return successfully.
- Have a few new players try it without coaching and fix confusing interactions.

## Files

- index.html — page structure, dialogs, instructions and current privacy copy
- styles.css — responsive light/dark UI and reserved ad layout
- favicon.svg — Ladderle icon
- js/words.js — 2,052-word dictionary, preferred vocabulary, and 1,000 verified daily puzzles
- js/solver.js — wildcard index, exact BFS paths, distance-based generation and UTC daily rotation
- js/game.js — game state, local persistence, undo/hints, results and optional sound
- js/ui.js — rendering, modal accessibility, sharing, keyboard and theme
- js/confetti.js — short, reduced-motion-aware celebration (invoked by game.js)
- js/ads.js — disabled-by-default advertising inventory
- tests/game.test.cjs — dependency-free logic tests, including full daily-bank validation
- scripts/build-puzzles.py — deterministic, dependency-free daily-bank generator

There are no accounts, leaderboard, server APIs, or analytics in this version.

OHIO is explicitly accepted as a proper-name exception. It is not added to the preferred daily-puzzle vocabulary.
