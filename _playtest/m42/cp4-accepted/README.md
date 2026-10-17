# Milestone 4.2 CP4 — accepted release record

The user confirmed that the complete CP4 implementation passed their manual
visual playtest and is accepted. This includes all three accumulated stages:

1. Campaign terrain/environment and targeted facility Z-fighting corrections.
2. Exterior terrain-side prop grounding/transform cleanup and backyard expansion.
3. Final prop removal, Alpha/Gamma route clearance and rounded backyard/minimap.

Finalization uses the requested single implementation commit on
`milestone-4.2-cp4`, starting from `3ad1938a90d3a432961373d3f5ea6757d1133522`,
followed by a normal push to `origin/milestone-4.2-cp4`. Main is not merged.
Product and test code remain exactly as reviewed; only acceptance documentation
and evidence curation are added in finalization.

## Verification and provenance

- [Finalization verification](finalization.json) verifies the three stage receipts,
  their successful selected runs, current source hashes, syntax, pure suites,
  Credits preservation and the diff check.
- [Explicit commit manifest](commit-manifest.json) identifies the curated files
  and selection reasons. It is the allowlist used for staging, not a blanket add.
- Latest stage:14 successful browser-suite executions match the final product;
  the two earlier stage records contain42 and15 successful selected executions.
  These counts describe checkpoint executions, not71 independent final-build tests.
- Final geometry:301 canonical solids,26 explicitly retired exterior records,
  425 protected facility mesh records, exact rear seam and v3 Continue coverage.
- The recorded `facility-e2` count update was maintenance only at the last stage;
  the earlier unaccelerated90s test remains historical evidence, not a newly run test.

The machine receipts and old gallery wording were produced before user acceptance.
Their `PENDING USER REVIEW` fields are preserved historical metadata; the user's
acceptance recorded here supersedes them. Timing/resource qualifications remain
documented; manual acceptance is not a new controlled desktop FPS certification.

## Curated evidence

Open [the accepted index](INDEX.html) for review sheets covering all three stages
and representative normal-gameplay captures. Committed evidence comprises those
directly linked sheets/captures, selected manifests, successful selected receipts/
logs, comparison metrics and the small baseline fixtures required by the tests.

The complete original galleries, raw traces, rejected/intermediate captures, full
source backups, uploaded ZIPs and one-off local inspection builders are intentionally
not part of the curated commit.
They remain on disk unchanged. Some historical report/JSON paths describe that
larger local archive; only the curated index/gallery links are commit-complete.
Historical before/after authoring tests apply to their recorded checkpoints;
`tests/final-exterior-refine.mjs` guards the accepted final geometry. Its small
prior-profile JS fixture and same-browser JSON baselines are retained explicitly.

No Credits, uploaded archives, unrelated assets, secrets or dependency changes
belong to this commit.
