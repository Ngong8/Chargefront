# CP3-C manual-review package

**Engineering PASS; manual acceptance pending. STOP AT CP3-C.**
Accepted CP3-B baseline `c0bb414492d5359b2d98367bf31ca7511f65f9ba`.

- [Implementation and complete results](../../../MILESTONE-4.2-ENVIRONMENT.md#cp3-c--functional-interior-environmental-refinement)
- [Final indexed normal before/after screenshots](SCREENSHOT-INDEX-final-verified.md)
- [Joined validation summary](validation-summary-verified.json)
- [Fresh accepted/current performance comparison](paired-performance-verified.json)

## Compact normal-lighting comparison sheets

Before is left; after is right. Each sheet is one or two matched gameplay views.

| Area | Firefox | Edge |
|---|---|---|
| Hall intake / axis | [01](review-final-verified/01-hall-firefox.png) | [01](review-final-verified/01-hall-edge.png) |
| Vault relay | [02](review-final-verified/02-vault-firefox.png) | [02](review-final-verified/02-vault-edge.png) |
| Decon / nozzle inspection | [03](review-final-verified/03-decon-firefox.png) | [03](review-final-verified/03-decon-edge.png) |
| Research instruments | [04](review-final-verified/04-research-firefox.png) | [04](review-final-verified/04-research-edge.png) |
| Security surveillance | [05](review-final-verified/05-security-firefox.png) | [05](review-final-verified/05-security-edge.png) |
| Containment composition / archive | [06](review-final-verified/06-containment-firefox.png) | [06](review-final-verified/06-containment-edge.png) |
| Generator / distribution | [07](review-final-verified/07-power-firefox.png) | [07](review-final-verified/07-power-edge.png) |
| Seed0 Research growth | [08](review-final-verified/08-research-growth-firefox.png) | [08](review-final-verified/08-research-growth-edge.png) |

All use the real eight-slot lighting selector, FOV75, exposure .78 and fog40–280.
Seed420042 except R0 (seed0). Quiet setup teleports with HUD/viewmodel/squad hidden
are composition evidence; independent native-input suites verify traversal.
No diagnostic fill/cutaway/lighting preview. Please judge subtle details in the
normal-lighting views, not by a proposed CP3-D treatment.

## Authoritative receipts

- `before/{firefox,edge}/manifest.json`: immutable pre-edit accepted snapshots.
- `accepted-cp3b-facility.js`: exact accepted source used for those snapshots.
- `final-verified/{firefox,edge}/manifest.json`: final source, five seeds, exact original
  geometry/collision/door preservation, source/growth parity, seating and screenshots.
- `regression-{firefox,edge}-verified/`: all seven unchanged suites pass on final source.
- `regression-{firefox,edge}/`: earlier runs; initial Firefox failures remain here.
- `regression-firefox-retry/`: earlier unchanged playthrough and M2 retries, both passed.
- `results-*.json`: durations/status/source hashes; not silently overwritten.
- `validation-summary-verified.json`: joins final passes, performance, enclosure
  and placement parity. Older attempts are preserved separately with original hashes.

`draft/`, `checked/`, `final/` and their sheets retain earlier fixture/design attempts.
Use **final-verified/** and **review-final-verified/** for manual acceptance.

The patch does not alter architecture, 329 solids, 30 map segments, six doors,
CP3-B corrected equipment/mounts, objectives, controls or lighting architecture.
The approved seed0 exterior growth/source intrusion is narrowly excluded from
Research. Remaining deterministic growth and lights are preserved.

Manual-review observations: small subdued plates/feeds; final intake plates are
seated and clear of the existing warning panel/rack border. Shallow
scientific controls and peripheral archive details are intentional. Sample Zero
remains the focal point. No new camera, floor machinery or taller cover.

**No CP3-D, CP3-E, staging, commit, merge or push. Await manual review.**
