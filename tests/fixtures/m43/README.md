# Milestone 4.3 lightweight regression baseline

`src-progression.js` is the captured pre-CP2-R progression module from the accepted
CP1/CP2 working tree (`_playtest/m43/cp2-r/before/edge/src-progression.js`). It is
test data loaded in an isolated VM, never a gameplay script. It preserves the
historical Endless reward/RNG implementation for exact compatibility checks.

`protected-sections.json` contains LF-normalized SHA-256 digests of the protected
HTML sections from the same captured baseline. It replaces a dependency on the
887 KB historical HTML/embedded artwork for the default quick test.

Run `node tests/cp2r-state.mjs` from the project root without local playtest output.
To additionally compare the complete original archived source, set
`CF_CP2R_BASELINE` to its directory and rerun the same test. The optional browser
historical-performance/reproduction tools still require those full local archives;
they are intentionally not part of this lightweight implementation snapshot.
