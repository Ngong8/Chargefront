# CHARGE FRONT

**First-person tactical shooter.** Land on a purple-spotted alien world, restore an abandoned bio-research facility with your squad, recover its lost clone-DNA vial, and fight to extract before the horde overwhelms you.

> Recover the sample · Restore the relays · Survive the horde.

Built with [LittleJS](https://github.com/KilledByAPixel/LittleJS) + [Three.js](https://github.com/mrdoob/three.js). No build step or game dependencies to install — keep `chargefront.html` and the `src/` folder together and open the HTML file to play.

---

## ▶ Play it

```bash
# just open the file in any modern browser
open chargefront.html
```

- No server required — it runs directly from `file://`.
- Add `?preview=1` to the URL for a cinematic flyover of the terrain.

---

## 🎮 Gameplay

Four independently replayable operations share one hostile frontier while using distinct deployment points, routes, objectives, and combat rhythms:

1. **Dead Signal** — land at the old LZ, follow the abandoned facility road, recover the Emergency Maintenance Battery, restore local power, and discover why the clone-DNA sample remains sealed inside the bio-lab. An optional Auxiliary Field Cell can power either tactical sensors or a field-gear locker.
2. **Power Through** — deploy from the facility staging yard, traverse the lowland Alpha yard, elevated Beta ridge, and contaminated Gamma crater, survive distinct enemy responses, and reopen laboratory access. A service-dock Survey Drone provides an optional forward escort and tactical scan without blocking relay progress.
3. **Sample Zero** — breach the reopened laboratory, bypass corrupted containment security, retrieve the DNA sample, and protect its portable containment sync. An optional security-turret restoration provides automated support and local hostile intel.
4. **Break Contact** — continue seamlessly from Sample Zero or deploy from Mission Select with the sample already secured, escape through the east maintenance breach, request extraction, hold the restoration LZ for two minutes, and board the transport.

Open **CAMPAIGN** for **Start New Game**, **Select Mission**, or **Continue Last Checkpoint**. Mission Select starts a fresh, fully healthy/shielded squad with the selected mission's supplies. Campaign uses an authored BUL-117 + CRW-8 loadout with ROOK, VEX and KADE. **Endless Horde** offers Continue/New when a saved run exists, otherwise opens deployment directly. Choose two weapons, each operator's ability and squad posture. Commander, ROOK, VEX and KADE can each choose Surge Pulse, Bulwark, Medic Pulse or Target Designator. Both guns deploy, initially in Slot 1. Restart retains your setup and arena with fresh resources.

Endless saves at wave starts and completed-wave intermissions. Leaving during a
wave resumes that wave's saved start, including its resources and chosen mutator;
completed rewards are not replayed. Browser reload preserves valid progress where
storage is available. Game Over clears only the Endless resume record.

Ordinary objective waypoints show **direction and distance**, not a guaranteed
walkable straight line. Mission 1 **Sensors** unlocks a cyan adaptive route out of
the Hall to Relay Alpha in Mission 2. Choosing the **Supply Locker** instead releases
3 reserve cartridges and 2 electric grenades as ground items: hold E to collect,
with full/partial inventory handled safely. Completing Mission 2's Survey Drone
retains tactical contact indicators and unlocks a cyan adaptive bypass route to Relay Gamma.
Rewarded guidance replans from the Commander about once every second while moving,
uses the authored safe corridors as preferences, and retires at relay interaction range.

Native lifeforms burrow up from the ground and attack on sight. Automated security drones still patrol the facility. Expect contact.

---

## 🕹 Controls

### Movement & Combat

| Key | Action |
|---|---|
| `W A S D` | Move |
| `MOUSE` | Look around |
| `LMB` | Fire the equipped weapon |
| `RMB` | Aim down sights (zoom) |
| `SHIFT` | Sprint (uses stamina) |
| `SPACE` | Jump |
| `R` | Reload (consumes 1 cartridge) |
| `E` | Interact — hold to use consoles, power relays, revive squadmates, secure the sample, and board extraction |
| `G` | Throw an **ESG-180** grenade |
| `1 / 2` | Equip Slot 1 / Slot 2 (Campaign: **BUL-117** / **CRW-8**) |
| `Q` | Cycle the two weapons |
| `F` | Use the Commander ability (SURGE PULSE in Campaign; selected ability in Endless) |
| `M` | Cycle sound mode — music / highlights / all sounds |

### Squad

| Key | Action |
|---|---|
| `4 / 5 / 6` | Squad command — ASSIST / SPREAD / HOLD |
| `Z / X / Y` | Use ROOK / VEX / KADE squad abilities |
| `K` | Extract from Endless after a six-wave milestone |
| `T` | Give a spare cartridge to the neediest squadmate |
| `T` (aiming) | Give a cartridge to the squadmate under your crosshair (within 5 m) |
| `H` (aiming) | Use a medkit on the hurt squadmate under your crosshair (within 5 m) |

### Crafting

| Key | Action |
|---|---|
| `C` | Craft **MEDKIT** — 6 scrap (+60 HP, up to 3 stored) |
| `H` | Use MEDKIT |
| `V` | Craft **UNIVERSAL CARTRIDGE** — 4 scrap (one magazine replacement for either gun) |
| `B` | Craft **GRENADE** — 1 power cell (+2, up to 5) |

> Scrap drops from downed creatures. Power cells are rare drops from the strongest hostiles. Each equipped weapon keeps its own magazine; both share one universal cartridge pool. Reload replaces the magazine and spends one cartridge on completion; switching cancels an unfinished reload without spending it. BUL-117 holds 50 rounds / 153 m reach; CRW-8 holds 20 eight-pellet bursts / 60 m reach.

Fresh Campaign player reserves are **6 / 5 / 4 / 3** cartridges in Missions 1–4;
each operator starts with **3 / 2 / 2 / 2**. Magazines remain full. Continue keeps
earned ammunition. Stronger hostiles offer better scrap bundles; ordinary enemy
deaths do not spawn reserve-cartridge objects. Endless still starts with 8 player
cartridges and 4 per squadmate.

Sprint interrupts held fire. Clicking fire while sprinting returns to weapon-ready
movement and retains that shot until the weapon is eligible; release Shift before
sprinting again. **Options** in the main/pause menus includes Fullscreen. Controls
& Guide scrolls inside its panel with its heading and Back button kept accessible.

Endless deployment chooses **two of four**: BUL-117, CRW-8, **ARC-9** (32 rounds,
72 m instant hitscan, chain disruption) and **PX-4** (15 rounds, 110 m, explosive plasma). Choose
starting slot, each operator's weapon/ability and squad posture. Restart preserves
deployment and arena, resets resources/upgrades/waves. Waves 1–5 are unmodified;
wave 6 onward automatically chooses a modifier or NONE. No Contract menu.

---

## 🛡 Survival Systems

- **Shield** — absorbs any incoming damage while it holds; body damage is reduced by 40%. Regenerates to 100% after 10 s without a hit.
- **HP regen** — health below 25 slowly recovers back to 25 after 15 s of no damage.
- **Squad** — your squadmates share the same shield & HP-regen systems. Revive them with `E` when they're down.

---

## 🤖 Your Squadmates

You're the **fourth operator** — together with ROOK, VEX and KADE you make up a four-person fireteam. These are the authored Campaign identities; Endless lets every operator choose any supported gun and any of the four abilities:

| Member | Role | Loadout |
|---|---|---|
| **ROOK** | Heavy | Eight-pellet laser, closes toward 13 m; intercepts close threats, quick reaction, Bulwark survivability |
| **VEX** | Medic | Fast 70-round SMG, prefers 22 m; protects vulnerable allies, evades more often, Medic Pulse |
| **KADE** | Rifleman | Precise long-range rifle, prefers 34 m; prioritizes dangerous targets, longer commitment, Target Designator |

Squadmates fight alongside you, obey your formation commands, and carry their own shield/HP/regen. Keep them alive — they're the difference between extraction and a shallow grave on this planet.

---

## ⚙ Tech Stack

| | |
|---|---|
| **Engine** | [LittleJS](https://github.com/KilledByAPixel/LittleJS) (MIT) by Frank Force — 2D game loop, input, audio |
| **Rendering** | [Three.js](https://github.com/mrdoob/three.js) (MIT) — full 3D world via the LittleJS Three.js plugin |
| **Distribution** | `chargefront.html` and its local facility script; terrain artwork is inlined |

The campaign, AI, squad behavior, crafting, cutscene and audio integration remain in `chargefront.html`. Facility geometry/navigation live in `src/world/facility.js`; canonical weapon definitions, two-slot action/shared-ammo ownership and sanitized Endless configuration live in `src/combat.js`. `src/progression.js` provides pure save validation/backup, durable-state helpers, seeded scenery and centralized reserve/scrap balance. See `MILESTONE-4.1-ENDLESS-HUD.md` for the original architecture, `MILESTONE-4.1-CORRECTIVE-REFINEMENT.md` for combat/animation/HUD corrections, and `MILESTONE-4.1-ADDITIONAL-REFINEMENT.md` for current menus, persistence, mission rewards, navigation and validation.

`src/relay-routing.js` provides player-only adaptive A* guidance; `src/fps-reload.js`
owns continuous cartridge/hand presentation driven by the existing combat clock.
See [MILESTONE-4.1-ROUTE-RELOAD-REFINEMENT.md](MILESTONE-4.1-ROUTE-RELOAD-REFINEMENT.md)
for the route/reload follow-up, validation and visual evidence.

The final 4.1 combat/presentation follow-up is documented in
[MILESTONE-4.1-COMBAT-VFX-ABILITY-REFINEMENT.md](MILESTONE-4.1-COMBAT-VFX-ABILITY-REFINEMENT.md):
three-second/thicker relay guidance, flat ARC magazine display, robust electrical
ribbons/contact timing, 15-shot PX-4 and universal Endless abilities.

The subsequent [route/hitscan correction](MILESTONE-4.1-ROUTE-HITSCAN-CORRECTION.md)
restores one-second A*, independently reconnects guidance from the Commander,
uses a visibly 3–4-pixel ground ribbon, and resolves ARC-9 hits immediately within
72 m. Continuous reloads, PX-4 and universal abilities retain their accepted settings.

---

## 📁 Project Structure

```
Chargefront/
├── chargefront.html       ← game entry point (open this to play)
├── src/world/facility.js  ← persistent facility sections, shell, door state and navigation data
├── src/combat.js          ← canonical two-weapon state and safe checkpoint migration
├── src/progression.js     ← safe persistence helpers and centralized reserve/drop balance
├── tests/facility-regression.mjs ← browser regression/traversal checks (optional Playwright)
├── convert_wav_16bit.js   ← dev tool: converts 24-bit SFX to 16-bit in place
├── Images/                ← textures used by the game
├── Music/                 ← soundtrack (see Credits.txt for attribution)
├── SFX/                   ← sound effects
│   └── original/          ← original 24-bit SFX (backups)
├── screenshots/           ← cover art + in-game screenshots
├── cover.png / itch-cover.png   ← generated cover art
└── Credits.txt            ← full asset attribution & licenses
```

---

## 📜 Credits & Licensing

Full attribution lives in [`Credits.txt`](Credits.txt)

- **Engine:** LittleJS (MIT), Three.js (MIT)
- **Music:** "Corrupt Data Stream", "Streets After Midnight", "Safe Space", "Dreams of a Silver Tower" by **Tsorthan Grove** ([OpenGameArt](https://opengameart.org))
- **Font:** *Glitch Slap* (from [dafont.com](https://www.dafont.com/glitch-slap.font)) — used throughout the affected menus and HUD
- **SFX:** extracted from [Soundly](https://soundly.com); original 24-bit files kept in `SFX/original/`. Remaining game sounds are synthesized in-browser via LittleJS's bundled **ZzFX** generator.
