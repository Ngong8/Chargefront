# CP3-C — resource economy review

- [Implementation / balancing report](../../../../MILESTONE-4.3-CP3-C.md)
- [Measured before/after results and model limitations](RESULTS.md)
- [CP3-B-roster economy before](before-verified.json)
- [Revised economy](after-verified.json)
- [Focused state receipt](state.json)
- [Normal-speed economy / compatibility receipt](runtime/economy.json)
- [Actual collection / crafting HUD](runtime/economy-hud.png)

The paired model uses identical Director/model hashes and sixteen seeds across
five profiles. It executes shipped rewards/crafting/upgrades, with explicit
shooting/collection assumptions and debt for unfunded ammo. Poor collection is a
budget-failure stress case, not evidence of a successful forty-wave run.

The runtime check is one ordinary-speed early wave plus real-input collection;
Carrier rewards and legacy-wallet compatibility use separate labelled fixtures.
Only this one focused Edge runtime run was needed. Campaign and cross-browser
regression remain outside this checkpoint.

`baseline.html` / `baseline-progression.js` retain the exact pre-CP3-C working
sources for seeded comparisons. `preserve.mjs --verify` checks 73 existing files
and protected sections against `preserved.json`. No CP3-A/B evidence was edited.
No CP3-D/E work or repository publication operations.
