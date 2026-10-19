# Milestone 4.3 — CP0 + CP0-R / Results

> Packaging update: see the [consolidated implementation snapshot](_playtest/m43/implementation-snapshot/README.md)
> for the subsequently authorized local commit scope and curated evidence. The
> stop/uncommitted statements below describe their original historical handoffs.

> **Current handoff: final amendment implemented and verified; stop for review.**
> The user accepted the visual direction after reviewing five result screenshots.
> The final amendment below supersedes this report's earlier direct-Endless button
> and ungated-main-menu descriptions. All earlier diagnostics/evidence remain.

## Verified baseline (before behavioural changes)

- Inspected branch, HEAD, index/worktree diffs, all untracked paths, recent history
  and local/remote-tracking branches. `main`, `origin/main` and CP4 refs resolve to
  `8223bcd4afe4e1ed90f996ec852837bf36d6ae0e`. No tracked or staged changes.
- Created `milestone-4.3` at that actual HEAD. Preserved the existing untracked
  `_playtest/m42/` evidence and archives. No reset, clean, staging or commit.
  Remote-tracking references are local observations; no fetch was needed.
- Existing GitHub Desktop stash `stash@{0}` on `milestone-4.2` was inspected by
  listing and left untouched.
- **4.2 CP5 acceptance remains outstanding:** the environment ledger identifies
  CP4 as accepted, but only proposes CP5's final readability/performance/regression
  and normal-profile manual gates. No CP5 completion/acceptance record was found.
- No workspace `AGENTS.md`, package manifest or Godot project applies here.

## CP0 implementation audit

| Area | Actual source and lifecycle |
|---|---|
| Campaign | `chargefront.html`: four canonical mission definitions, numeric `P` phases, `activeMissionId`, `campaignRun` and separate durable `campaignProfile`. `completeCampaignMission` records completion then seamlessly transitions every non-final mission, including M3→M4. M4 boarding starts departure; its ship callback finishes extraction and opens results. Commander death fails the operation (it does not imply all squadmates died). |
| Mission Select | Uses `mission_select` origin and fresh authored supplies; completion does not write Campaign progression. Its existing onward chapter transitions are intentional. Persistent New/Continue completion unlocks successors; final completion clears Continue and unlocks replay. |
| Statistics | Real counters: `missionTime`, all-hostile death `kills` (not player-attributed kills), successful cartridge/medkit crafting counts. Chapter transitions archive counters in `chapterStats`, then reset current counters. Existing chapter archive lacks optional-objective counts. No reliable lifetime accuracy, damage, revives or personal-best record exists. `cacheFound`, combat shot diagnostics and Director pressure are not reliable debrief metrics. |
| Results | Campaign success uses a DOM overlay; failure and both Endless outcomes use a separate count-up Canvas renderer. `resultScreen` holds animation timing only; formatters read mutable live counters. Campaign DOM reads current M4 counters although archived chapters survive. Failure says “SQUAD WIPED OUT” on Commander death. Generic canvas labels “CARTRIDGES”/“MEDKITS” omit that these are crafted totals; Endless “WAVES” does not distinguish reached/cleared. |
| Campaign saves | `cf_campaign_v1` with v4 profile/checkpoints and `.backup`; `src/progression.js` validates finite trees and falls back to backup. Periodic (~10 s) and event checkpoints store actors/resources, current counters and chapter archives. M4 has its own extraction snapshot/restore. Retry after death deliberately starts the current mission fresh; Continue reloads the last valid checkpoint. Mission Select does not overwrite it. |
| Endless | Separate `cf_endless_v1` v1 boundary and backup. Saves at wave start/clear, not ambiguous mid-wave; Continue rolls back to that boundary. `resetEndlessRun`, `startEndless`, `beginEndless`, `restartEndlessRun` own reset/setup. Death or eligible six-wave extraction removes only Endless resume. Restart retains setup, arena and seed, resetting counters/resources/upgrades. No persisted personal best. |
| Enemy AI | HTML `Infested`: bounded targeting/LOS, pursuit/local steering, species attacks, Runner fuse/detonation, shield/marked damage, idempotent `die()` rewards. Death count includes hostile crossfire and kamikaze detonation; administrative `destroy(true)` does not count. |
| Squad AI | HTML `SquadMember`, tactical modes, formation/hold/separation, target commitment, weapon-specific ranges, manual/autonomous ability coordination, down/revive and supplies. Remains separate from result/persistence ownership. |
| Encounter Director | Shared HTML `encounterDirector`, request/spawn ledger, source caps, budgets, pressure/recovery and bounded retirement. Endless wave budget/composition/mutators live in `updateEndlessWaves`/`startEndlessWave`; Endless requests bypass Campaign admission limits. No CP1 AI/director work is included. |
| Tests | Standalone Node assertions for combat, progression, objective HUD, routing, placement and terrain; Playwright scripts run actual `file://` game via external `PLAYWRIGHT_PACKAGE`, Firefox/Edge. `m40-regressions.mjs` runs suites sequentially. Existing integration checks chapter archive/actors and completion, but not final DOM totals. Additional-refinement covers saves, mode isolation and Endless reset; traversal/transition suites cover real M3/M4/extraction. No dedicated result-payload/DOM regression existed. |

## CP0-R investigation plan / source-proven suspects

Trace events → current counters → archived chapters → terminal payload → DOM →
saved progression using isolated Playwright contexts and existing diagnostic hooks.
Use bounded accelerated fixtures for long objectives, real death/interaction/ship
completion handlers and native menu/replay buttons. Record exact fixture limits.

1. Compare full fresh Campaign totals with the sum of all four chapter snapshots.
2. Check non-final completions remain seamless, especially M3→M4.
3. Check Mission Select M4 completion identity and unchanged Campaign save bytes.
4. Check successful purge/boarding/departure and duplicate terminal callbacks.
5. Check failure, fresh retry, reload and valid-checkpoint Continue.
6. Check old checkpoint archives with missing optional counts (unknown ≠ zero).
7. Check Endless death/extraction, reached versus cleared, restart and resume.
8. Check Campaign→menu→Endless→menu isolation and responsive result layout.

Source indicates archived totals are unused by results and optional history is
lost; browser reproduction will establish observed defects before fixes. No
behavioural production changes had been made when this baseline was written.

## CP0-R diagnosis and fixes

**IMPLEMENTED AND VERIFIED — STOP FOR MANUAL REVIEW. CP1 not started.**

| Finding | Browser/source evidence and cause | Fix |
|---|---|---|
| Campaign totals represented only M4 | Seeded M1/M2/M3 archives contain 7/9/11 eliminations and 111/222/333 seconds; final M4 contains 21 and 444. Old DOM shows **21, 7:24, 5 cartridges, 4 medkits**, while the recorded operation totals are **48, 18:30, 14, 10**. `showCampaignResultPanel` and canvas formatters read current counters, never `chapterStats`. | Pure `src/results.js` assembles a terminal snapshot from canonical, deduplicated earlier chapters plus the current attempt. DOM reads that snapshot only. |
| Completed optional objectives disappeared | M1 2/2, M2 1/1 and M3 1/1 were completed in the fixture, but transitions archived no optional counts. Final M4 has zero optionals, so the old success panel omitted all earlier completion. Profile `bestOptional` cannot recover this run's history reliably. | Store the canonical mission's optional count at chapter completion, before reset. Report each chapter's main/optional completion. Legacy missing counts stay `null` and render **Not recorded**, with an explanation. Do not substitute personal bests or assume zero. |
| Failure retry destroyed completed-chapter statistics | Native Space retry after M4 death produces `chapterStats: []` and writes it into the fresh checkpoint. `restartCurrentRun` deliberately drops the current checkpoint for fresh actors/resources; `startCampaignMission` also creates an empty archive. | Carry only completed-chapter records through the existing retry session request and sanitize them against earlier canonical missions. Fresh mission actors, current statistics, supplies and retry progression remain fresh. Failed attempts are not counted twice. |
| Failure status asserted a squad wipe | Commander dies while all three squadmates are still alive. Old canvas says **SQUAD WIPED OUT**. | **MISSION FAILED / COMMANDER DOWN — OPERATION INTERRUPTED**, with the correct mission and partial main-objective count. |
| Mutable result lifecycle / ambiguous labels | Old `resultScreen` stores animation timing, while result formatters continue reading live counters. Separate Campaign-success/Canvas paths expose different labels and actions. “KILLS” includes all hostile deaths, including hostile crossfire/detonation, not just player kills; “CARTRIDGES”/“MEDKITS” mean crafted counts; “WAVES” means reached, not cleared. | One deeply frozen payload per terminal attempt; idempotent terminal entry; explicit reset at both run initializers. Clear labels for all-hostile eliminations, crafted items, reached and cleared waves. A regression mutates live death state after completion and verifies payload and DOM remain unchanged. |
| Deferred pointer-lock capture could consume a result click | During the first new UI regression, clicking the debrief title followed by Retry caused pointer-lock coordinates to target the title/card repeatedly. A still-pending `lockOnNextGesture` listener survived terminal entry. | Clear the existing deferred lock listener at terminal entry and exit pointer lock. Cancel delayed mission-analysis notifications. No arbitrary-key/background-click restart listener remains; dedicated controls and the guarded Space shortcut share the existing restart path. |
| Unknown/duplicate/out-of-scope archive values | Result aggregation must handle compatible old checkpoint histories without attributing unrelated mission entries or duplicating a chapter. Existing optional counting accepted all truthy keys. | Canonical mission order, earlier-mission-only history, last matching record, finite nonnegative numeric normalization and canonical optional IDs. Missing history is labelled **Recorded operation totals**, not a fabricated full run. |

### Confirmed preserved behaviour

- M1→M2, M2→M3 and **M3→M4 remain seamless**. No new result interruption.
- M3 stabilization uses its existing security/rally/seal/defence/transfer checks.
  The regression accelerates time through those handlers rather than changing
  their rules. Existing native facility/playthrough suites also pass.
- Full persistent final extraction displays **CAMPAIGN COMPLETE** using the
  authoritative progression flag. Standalone M4 displays **MISSION 4 COMPLETE**.
  Mission Select M3 continues into M4 and also finishes as a standalone mission
  chain, retaining origin and leaving the Campaign save byte-for-byte unchanged.
- Purge, boarding and departure remain the successful M4 path. Mission failure
  does not mark M4 complete or unlock success. Duplicate terminal calls do not
  recreate results; a completion call while dead is ignored.
- Existing progression/unlock rules remain authoritative. ENTER ENDLESS HORDE
  remains a successful final-M4 action (including Mission Select). Endless is
  already available independently from the main menu; no new unlock was invented.
- Failure retry resets the current mission. Ordinary browser reload returns to
  the menu; Continue restores the latest living valid checkpoint. This does not
  resurrect terminal state or overwrite a Campaign checkpoint from Mission Select.
- Endless death/extraction removes its resume record **and backup only**. Replay
  retains arena/seed/configuration and resets wave/upgrades/current statistics.
  Active-wave Continue restores wave-start counters; paid wave rewards stay paid.
- Both storage keys and existing v4 Campaign/v1 Endless formats remain intact.
  `optionalCount` in an existing chapter record is additive compatible metadata.

### Lifecycle after the fix

1. Gameplay owns current time, hostile deaths and successful crafting counters.
2. A successful non-final chapter archives its own counters and optional count,
   then the existing world transition resets current counters and saves the next
   checkpoint atomically. `chapterStats` remains part of existing snapshots.
3. Failure or final extraction captures an immutable terminal payload once.
   Campaign results use earlier successful chapters plus this mission attempt;
   earlier failed attempts are not retained by the existing fresh-retry model.
4. Shared DOM rendering uses only that payload. Formatting cannot read a newly
   reset run or a later callback's mutable counters. `__cf.resultInfo()` is a
   read-only diagnostic copy of current counters and terminal payload.
5. Existing completion code persists the same progression flags, clears final
   Campaign Continue or invalidates Endless resume as appropriate. The debrief
   itself never changes unlocks or writes cross-mode saves. Results are not a new
   historical-results save or a personal-best database.

## Result-screen changes

- Shared responsive sci-fi panel: original purple/cyan palette and Glitch Slap
  headings, teal success/pink failure accents, readable sans-serif stat labels,
  tabular numeric values, objective table, explicit scope and contextual notes.
- Campaign: clear status and numbered mission identity, operation totals,
  per-chapter objectives/status, Retry on failure, Select Mission, Main Menu and
  Enter Endless on successful final extraction.
- Endless: **Survival Debrief**, Game Over or Extraction Secured, arena identity,
  final wave reached, waves cleared, survival time, hostile eliminations,
  cartridges/medkits crafted and DNA banked. Play Again and Main Menu.
- Values appear immediately rather than an animated count-up from mutable state.
  Dialog heading focus, real buttons, keyboard navigation, a retained guarded
  Space replay shortcut, wrapping controls and internal scrolling support narrow
  and short viewports. No personal-best/accuracy/damage metrics are claimed.

## Verification — actual results

### New regression coverage

| Suite | Result |
|---|---|
| `tests/results-state.mjs` | **PASS**: actual mission definitions, aggregate totals, optional/history semantics, duplicate/unknown records, identity, partial old saves, deep immutability, finite/negative values, grouping/hour formatting and reached-vs-cleared waves. |
| `tests/results-flow.mjs` — Edge | **PASS**, final receipt: `_playtest/m43/final-results/edge/results.json`. |
| `tests/results-flow.mjs` — Firefox | **PASS**, final receipt: `_playtest/m43/final-results/firefox/results.json`. |

Each final browser run records **11 lifecycle observations and 15 layout cases**:
Campaign success, Campaign failure and Endless Game Over at **1280×720, 768×600,
390×740, 320×568, 960×420**. Every visible navigation button must scroll into and
fit the viewport; no horizontal card overflow. Payload values match rendered DOM;
no NaN, undefined, Infinity, negative or stale values. Both final page-error arrays
are empty. Final Campaign fixture asserts **48 / 18:30 / 14 / 10** and optional
counts **2,1,1,0**. Endless counters include real successful crafting and an
idempotent hostile death; a valid wave-start duration fixture of **3675 s** verifies
reload/Continue → **1:01:15** in the Game Over DOM. Replay resets the duration.

Fixtures explicitly seed chapter statistics/checkpoints, position actors and
accelerate long objective timers using existing hooks. They exercise real M3
transfer, purge defenders, boarding/ship completion, death and native menu inputs.
They are not unassisted full-duration playthroughs or mobile gameplay certification.
Small subsecond elapsed-time tolerances permit actual rendered frames between a
native menu launch/replay and the quiet fixture's pause.

### Existing suites

All **seven selected browser suites pass in both Edge and Firefox (14 successful
suite/browser combinations)**:

- `m2-progression`, `facility-playthrough`, `transition-diagnose`:
  `_playtest/m43/existing-progression/results-edge-firefox.json` and suite logs.
- `traversal-performance`, `combat-playtest`, `endless-hud`, `additional-refinement`:
  `_playtest/m43/existing-persistence-combat/` (all four Edge, first two Firefox)
  and `_playtest/m43/existing-persistence-combat-firefox/` (remaining two Firefox).

Existing Node suites **PASS**: `combat-state`, `progression-state`,
`objective-hud-state`, `relay-routing-state`, `environment-placement-state`,
`campaign-terrain-state`. New Node suite passes too: **7 successful Node suites**.
`node --check` passes for the new production module/browser test.
`git diff --check` passes (Git emits only the repository's LF→CRLF notices).

### Investigation / failed-attempt ledger

- `_playtest/m43/cp0/before/`: complete baseline diagnostic evidence; its first
  runner failed only while printing its final summary because Endless has no
  Campaign chapter array. Fixed the scratch script, retained the artifacts.
- `_playtest/m43/cp0/before-verified/`: corrected baseline diagnostic **PASS**,
  source still at accepted behavioural baseline at capture time.
- `verification-01`: new result regression exposed the pending pointer-lock
  listener; fixed the product lifecycle as described above. Initial Node test
  also needed JSON normalization of VM-realm mission-definition arrays for Node's
  strict equality (equal values, different realm prototypes).
- `verification-02` / `verification-03`: strict zero/exact subsecond time fixtures
  rejected legitimate frames after Continue/Replay. Corrected test timing bounds,
  without changing timer/gameplay behaviour. Earlier assertion receipts retained.
- `verification-04`: Edge **PASS**; initial Firefox run exceeded the 120 s outer
  command budget after reaching Endless extraction, not an assertion failure.
  `verification-05`: longer-budget Firefox **PASS**.
- The long existing-suite batch exceeded its 900 s outer budget during Firefox
  Endless HUD after six successful combinations. The remaining Firefox Endless
  HUD and additional-refinement were rerun as a bounded batch; **both PASS**.
- `final-results/`: final code/test snapshot, **both browsers PASS** including
  Mission Select M3→M4 and the hour-long duration checkpoint fixture.

### Reproduction

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
# Use a new output root; results-flow refuses to overwrite browser evidence.
$env:CF_ARTIFACT_DIR='_playtest/m43/review-rerun'
node tests/results-state.mjs
node tests/results-flow.mjs
node tests/results-flow.mjs firefox

$env:CF_ARTIFACT_DIR='_playtest/m43/review-existing'
node tests/m40-regressions.mjs --final-refinement --suites=m2-progression,facility-playthrough,transition-diagnose
# Keep the long combat/persistence runs in separate browser batches.
node tests/m40-regressions.mjs --final-refinement edge --suites=traversal-performance,combat-playtest,endless-hud,additional-refinement
node tests/m40-regressions.mjs --final-refinement firefox --suites=traversal-performance,combat-playtest,endless-hud,additional-refinement
git diff --check
```

## Evidence and changed files

Start with [`_playtest/m43/INDEX.html`](_playtest/m43/INDEX.html) for curated
before/after images and receipts. Matched desktop Campaign screenshots visibly
show the correction from **7:24 / 21 / 5 / 4** to **18:30 / 48 / 14 / 10**.
Desktop, narrow-top and narrow-controls views of Campaign failure/success and
Endless Game Over were directly inspected in the image-reading tool.

| File | Change |
|---|---|
| `chargefront.html` | Shared debrief DOM/styles, terminal payload/reset ownership, pointer-lock/input cleanup, chapter optional archive, fresh-retry archive preservation, canonical optional counting, diagnostic result reader. |
| `src/results.js` (new) | Pure chapter/history normalization, aggregation, frozen mode-specific debrief payloads and numerical formatting. |
| `tests/results-state.mjs` (new) | Pure state/formatting regressions. |
| `tests/results-flow.mjs` (new) | Playwright terminal lifecycle, save/mode isolation, native navigation and responsive DOM regression. |
| `README.md` | Debrief semantics and review-report link. |
| `MILESTONE-4.3-CP0-RESULTS.md` (new) | Baseline-before-behaviour report, diagnosis, implementation, verification and handoff. |
| `_playtest/m43/` (new evidence) | Scratch baseline diagnostic, curated HTML index, immutable before/after PNGs, JSON receipts and existing-suite logs. |

## Manual-review handoff / remaining baseline risks

- **No known unresolved functional result defect from the tested matrix.** Review
  the presentation, labels, immediate values versus former count-up, and native
  Retry/Select/Menu/Endless controls in the normal browser profile before acceptance.
- Legacy optional history and chapter statistics already erased by an older retry
  cannot be reconstructed reliably. The UI identifies missing data; new chapter
  completions/retries retain the data going forward. No personal best is persisted.
- **4.2 CP5 is still outstanding**, including its broader normal-profile visual,
  performance and long-session acceptance. These selected result/progression tests
  do not retroactively accept CP5 or claim all historical suites were rerun.
- Existing external CDN module dependencies, browser-storage restrictions,
  cold shader/preparation costs and occasional long-frame/high-refresh concerns
  remain baseline risks. No new combat attribution or AI/director tuning work.
- Final tests use isolated browser contexts and accelerated fixtures. Long-run
  unassisted Campaign/Endless and subjective audio/normal-profile feel remain
  manual scope, not silently claimed by these receipts.

Branch remains **`milestone-4.3`**, HEAD **`8223bcd`**, with an empty index.
No staging, commit, merge, tag or push. Existing user evidence and stash preserved.
**STOP HERE for manual review. Do not proceed to CP1.**

---

## CP0-R final amendment — Campaign results and Endless unlocking

**IMPLEMENTED / VERIFIED — awaiting manual review.** Continued the existing
`milestone-4.3` worktree at `8223bcd`. Rechecked branch/HEAD, tracked and staged
diffs, recent commits and the existing Desktop stash. Prior CP0/CP0-R work and
all evidence remain present; no staging, commit, merge or push.

### A. Campaign results navigation

- Removed ENTER ENDLESS HORDE from the DOM, result-payload action model and click
  wiring. No Campaign outcome offers a direct Endless transition.
- Success: two equal-width actions, Select Mission (Return to Mission Select
  for standalone play) and Return to Main Menu.
- Failure: Retry Mission / Select Mission share the first row; Return to Main
  Menu spans the second row. Narrow layouts stack the same actions.
- Accepted colors, typography, panels, statistics, objective summaries and
  seamless M3→M4 gameplay retain their previous implementation.

### B. Unlock authority and persistence

The actual completion writer is `recordCampaignMissionCompletion`: only
**persistent** Campaign origins write mission completion records and final
`campaignComplete`; Mission Select does not write them. The canonical persisted
record is a valid `cf_campaign_v1` profile with **`campaignComplete === true` and
`missions.break_contact.completed === true`**. Accessible/unlocked replay entries
are not completion evidence.

`src/progression.js` now centralizes two distinct checks:

1. `campaignCompleted(profile)` recognizes the canonical record, or derives an
   omitted/false older completion flag when **all four** persisted mission
   `completed` records are true. Both helpers return strict Booleans for empty,
   missing and invalid records.
2. `campaignCleared(profile)` recognizes that evidence or the additive earned
   `completionRecord: {version:1, finalMission:'break_contact', completed:true}`.
   This minimal historical receipt is written on legitimate final Campaign
   completion and carried through an intentional Start New Game reset. It can
   also be derived in memory from supported old completion records. It preserves
   the earned unlock while the **new** Campaign's `campaignComplete` and mission
   flags reset and its checkpoint advances normally.

The gate reads the **persisted validated profile**, using the existing
primary/backup recovery order. Unsaved in-memory flags do not authorize it.
No new storage key or save-version bump; the receipt is optional v4 metadata.
Reading/deriving an old completion does **not** rewrite its save or checkpoint.
Ordinary Campaign saves and explicit New Game retain their existing ownership.

Main-menu ENDLESS HORDE remains visible. Before completion it is disabled with
“Complete the Campaign to unlock Endless Horde.” Completed players get its
normal appearance/actions. Successful Campaign persistence refreshes that same
document immediately; menu entry, relevant storage events and visibility return
also refresh its state. Returning to the menu uses the existing page navigation;
no browser restart is needed.

### Existing Endless runs — continuation only

An existing valid Endless boundary is not evidence of Campaign completion and
does not authorize a fresh deployment or Play Again. To avoid stranding an
already-valid run, a locked menu with such a boundary offers the explicit
**CONTINUE SAVED ENDLESS RUN** action alongside the locked normal button.

Continuation must match the currently persisted validated boundary at launch.
The ongoing run and its resources/waves are preserved. Pause Restart and terminal
Play Again require the earned Campaign unlock; the latter is visibly disabled
with an explanation for a grandfathered run. Death/extraction still invalidates
only its Endless boundary/backup. Completing or continuing such a run never sets
Campaign completion. This is a deliberately narrow existing-run exception, not
an alternative unlock source.

### Entry-point audit and protection

| Entry | Protection |
|---|---|
| Normal menu, setup, New Game confirmation, Confirm Setup | Recheck persisted new-run authorization; denied requests return to the menu. |
| Saved-run Continue / legacy continuation | Revalidate the actual saved boundary; removed/changed boundaries cannot launch stale state. |
| Sound confirmation and delayed two-second launch | Recheck again at confirmation and in `startEndless` before any reset, invalidation or world mutation. |
| Pause Restart, result Play Again, Space shortcut | Central `restartEndlessRun` guard before clearing saves/counters; fresh replay is locked if authorization is absent. |
| Diagnostic `startEndlessMode` / `continueEndless` | Use the same guarded runtime functions. Continue returns actual launch success. |
| Old Campaign-result button/handler | Removed. |
| Old `cf_endless_autostart` session request | Discarded at boot; never opens setup, even for an unlocked player. |

### Explicit isolated test fixtures

Existing combat, terrain, placement and persistence tests still need fresh Endless
setups independently of Campaign acceptance. They now opt in explicitly with
**both** `perfDiagnostics=1` and `endlessFixture=1` in their isolated browser URL.
The menu visibly says **ENDLESS TEST FIXTURE — no Campaign unlock saved.** This
test authorization is neither inferred from ordinary diagnostics nor persisted;
it changes no Campaign flag, checkpoint or completion receipt. The actual unlock
suite and result-lifecycle suite use **no** fixture authorization and must earn
or explicitly seed their persisted completion records.

Only a setup-URL line was added to these 15 existing harnesses:
`additional-refinement`, `arc-presentation`, `combat-playtest`, `combat-squad`,
`combat-vfx-diagnose`, `combat-vfx-refinement`, `cp4-traversal`, `endless-hud`,
`environment-placement`, `facility-regression`, `route-hitscan-correction`,
`route-reload-refinement`, `runner-kamikaze`, `traversal-performance`,
`universal-abilities`. Their gameplay assertions and accepted fixture semantics
were not weakened.

### Amendment verification — actual final results

| Test | Result / evidence |
|---|---|
| New `tests/endless-unlock.mjs` | **PASS Edge + Firefox**, 20 recorded authority/navigation scenarios each; `_playtest/m43/amendment/unlock-verified/{edge,firefox}/unlock.json`. |
| Updated `tests/results-flow.mjs` | **PASS Edge + Firefox**, 11 lifecycle observations and 15 result-layout cases each; `_playtest/m43/amendment/results-final/{edge,firefox}/results.json`. |
| Updated `tests/progression-state.mjs` | **PASS**, current versus historical completion, legacy derivation, invalid/empty/ambiguous records, strict Boolean defaults and retained receipt without completing a new Campaign. |
| Updated `tests/results-state.mjs` | **PASS**, existing totals/optional/formatting/frozen-payload regressions plus no direct-Endless Campaign action. |
| Existing Node `combat-state`, `objective-hud-state`, `relay-routing-state`, `environment-placement-state`, `campaign-terrain-state` | **5/5 PASS**. Together with the two above: **7 Node suites PASS**. |
| Existing `m2-progression`, `facility-playthrough`, `transition-diagnose` | **6/6 Edge/Firefox combinations PASS**; `amendment/existing-progression-final/results-edge-firefox.json`. |
| Existing `traversal-performance`, `combat-playtest`, `endless-hud`, `additional-refinement` | **8/8 Edge/Firefox combinations PASS**; `amendment/existing-edge/results-edge.json` and `amendment/existing-firefox/results-firefox.json`. |
| Syntax / whitespace | New/changed pure modules and all changed harnesses pass `node --check`; `git diff --check` passes. |

The new gate suite verifies fresh and partial saves, all-accessible Mission Select
entries, M4 alone and M3→M4 through Mission Select, legitimate persistent
completion, immediate same-document refresh, reload, earned unlock across Start
New Game, canonical v3 completion, all-four legacy derivation, unchanged legacy
checkpoint bytes, stale setup/sound/fade, primary-versus-backup order, retired
autostart, protected direct hooks, grandfathered continuation, unauthorized replay
and the double-opt-in fixture. Both final error arrays are empty.

The updated result suite preserves the exact **18:30 / 48 / 14 / 10** aggregate
and **2,1,1,0** optional counts, Campaign failure/retry/Continue and Endless
results/replay/save isolation. Its **30 combined layout cases** cover desktop,
320/390 px widths and short viewports. Desktop and narrow menu/result screenshots
were inspected directly. Test scenarios remain bounded/accelerated as described
in the original report, not unassisted long-run play.

One amendment regression was found and fixed before the final runs: the first
`m2-progression` run exposed an `undefined` completion default on an empty save,
which made a newly initialized Campaign profile fail finite-tree serialization.
The pure completion checks now always return Booleans, with explicit empty-save
unit coverage. The failed receipt remains at `amendment/existing-progression/`;
all six progression combinations subsequently pass in the final directory.
Earlier amendment trial receipts remain under `unlock-01`, `unlock-final` and
`results-01`; use **unlock-verified / results-final** for the final code snapshot.

### Amendment modified files

- Production: `chargefront.html`, `src/progression.js`, `src/results.js`.
- Regression logic: new `tests/endless-unlock.mjs`; updated
  `tests/progression-state.mjs`, `tests/results-state.mjs`, `tests/results-flow.mjs`.
- Fixture setup only: the 15 harnesses enumerated above.
- Documentation: `README.md`, this report.
- New evidence/index: `_playtest/m43/amendment/`; the prior evidence index links
  to its amendment index. Accepted original images and receipts are preserved.

### Legacy ambiguity / review boundary

- Supported prior four-mission completion records retain/derive their unlock,
  including canonical flagged completion when earlier per-mission detail is
  missing. A corrupt primary can recover through the existing valid backup.
- A much older **two-mission** `campaignComplete` record without a final
  `break_contact.completed` record cannot certify completion of the current
  four-mission Campaign. It remains locked; no completion is invented from access
  flags or an Endless save. Whether to grandfather that historically different
  Campaign is a manual product decision, not an automatic migration here.
- A valid partial primary does not gain an unlock from a completed backup, since
  the primary is authoritative under the existing recovery rules. Browser storage
  failure can prevent persistence; in-memory completion alone does not unlock.
- No enemy AI, encounter, wave balancing, drops, resource economy or accepted
  environment changes. The outstanding 4.2 CP5/manual long-session qualifications
  remain as recorded above.

Open [`_playtest/m43/amendment/INDEX.html`](_playtest/m43/amendment/INDEX.html) for
amended results, locked/unlocked menus and exact final receipts.
**STOP for review. Index empty; HEAD remains `8223bcd` on `milestone-4.3`.
No stage, commit, merge, tag or push. Do not begin CP1.**
