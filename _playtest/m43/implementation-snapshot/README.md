# Milestone 4.3 consolidated implementation snapshot

This packages CP0, CP0-R, CP1, CP2 and CP2-R on `milestone-4.3`, based on
`8223bcd4afe4e1ed90f996ec852837bf36d6ae0e`, for the subsequently authorized local
commit. Earlier reports retain their original stop/uncommitted handoff language
as historical records. This note supersedes that packaging status only.

## Implementation

- Shared frozen Campaign/Endless debriefs, chapter totals and optional history,
  failure/retry statistics and explicit result navigation.
- Persistent Campaign-completion gate for new Endless runs, narrowly scoped legacy
  saved-run continuation and explicit diagnostic fixture opt-in.
- Height-aware perception, bounded last-seen search/local detours, enemy roles,
  attack wind-ups, support visibility restrictions and cover-aware mortar damage.
- Campaign-only resource reductions, saved quantities preserved, single-use M4
  emergency cache through portal recovery and carried-turret firing verification.
- Endless relay-perimeter advancement, visible-operator engagement and resumption
  after lost contact, without making the relay attackable.

## Curated receipts

These six individually reviewed JSON files are the portable verification evidence
included here (185,002 bytes total). All report `passed: true`. Paths mentioned
inside them can reference the larger local-only evidence archive.

| Receipt | Bytes | SHA-256 |
|---|---:|---|
| [CP0-R Edge results](../amendment/results-final/edge/results.json) | 68,323 | `a89b3441e32c4ca81bdf8da1b95f6feb2cd0f358c50cca0c16935b1939380899` |
| [CP0-R Firefox results](../amendment/results-final/firefox/results.json) | 68,340 | `e870b8db593675cc89ac595ab18771f46377689aaa41a785411c29421975507b` |
| [Edge unlock](../amendment/unlock-verified/edge/unlock.json) | 2,833 | `5861b1c57765722f61b6298219d2e467fc48a12426c1f7548817443b5e9aebfc` |
| [Firefox unlock](../amendment/unlock-verified/firefox/unlock.json) | 2,836 | `add8fc677d30ee354cbb7aa8e5fa4d051410599149838cb0bd7eff9cf09dd903` |
| [CP1/CP2 summary](../cp1-cp2/verified/summary.json) | 12,088 | `6d5eb41573895d16ef07d855ffc0fe52c46d44ed34c60eb28da101b5cedc0948` |
| [CP2-R final summary](../cp2-r/verified-final/summary.json) | 30,582 | `e4a0c88bf5871b5ce408dd23f54e44cf7dd44f2ec07935a2b24944f757adab32` |

CP0-R records 11 result states/15 layouts and 20 unlock scenarios per browser.
CP1/CP2 records 34 successful browser-suite executions; CP2-R records 29. These are
historical runs, not a newly rerun full browser matrix for this commit. The final
working-copy game HTML still matches the CP2-R receipt:
`17ba5af44eb96255d819aeff617876c8988e2dbd4bb3c94bd79c8074e25f4de7`.
Git's existing line-ending normalization produces the committed LF-only HTML hash
`2a7e0a7958ae14efaa055df1d3f1a0fa24b66652fe42d3bac5b38f0ffb9aa761`.
Index/worktree text equality after CRLF-to-LF normalization was verified.

## Packaging verification

Nine quick Node suites passed: `cp2r-state`, `progression-state`, `results-state`,
`combat-state`, `enemy-tactics-state`, `objective-hud-state`, `relay-routing-state`,
`environment-placement-state` and `campaign-terrain-state`. `cp2r-state` also passed
with the full original local archive selected via `CF_CP2R_BASELINE`. Its default
now uses the documented small baseline module/protected-section hashes under
`tests/fixtures/m43/`, so a clean checkout needs no historical HTML/artwork for
that quick test. No gameplay change was needed for packaging.

## Excluded evidence retained locally

All other untracked `_playtest/m42/` and `_playtest/m43/` contents remain untouched:
screenshots, recordings, ZIPs (including `m4_3_cp1-cp2.zip`), historical full HTML,
browser profiles, scratch drivers, raw logs, failed/intermediate attempts and HTML
indexes dependent on local assets. The reports describe their provenance; their
paths are local review references, not a promise that every artifact ships in Git.
The existing GitHub Desktop stash is preserved and its contents are excluded.

## Acceptance and deferred work

CP0-R visual direction was accepted; CP1/CP2 were reviewed with CP2-R corrections
requested and implemented. Automated verification does not claim new manual
gameplay acceptance. Outstanding qualifications:

- Continued-M3 ammunition has a thin buffer needing manual feel review; economy
  fixtures include relocations and an invulnerable Commander.
- The M4 turret complaint was not reproduced under valid active/in-range/LOS
  conditions. Actual firing and valid idle reasons were recorded without changing
  its accepted 42 m / .72 s / 22 damage baseline.
- Local navigation is bounded, not an all-seed/all-maze guarantee. Normal-profile,
  long-duration and broader Milestone 4.2 CP5 manual qualifications remain open.
- CP3 Endless economy work has not started. This snapshot ends at CP2-R.
