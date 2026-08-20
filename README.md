# CHARGE FRONT

**First-person tactical shooter.** Land on a purple-spotted alien world, command your squad into an abandoned bio-research facility, and recover a lost clone-DNA vial before the horde overwhelms you.

> Recover the sample · Restore the relays · Survive the horde.

Built as a **single self-contained HTML file** with [LittleJS](https://github.com/KilledByAPixel/LittleJS) + [Three.js](https://github.com/mrdoob/three.js). No build step, no dependencies to install — open it and play.

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

Your dropship sets down on a hostile frontier. The mission:

1. **Infiltrate** the abandoned bio-research facility.
2. **Power three external relays** — ALPHA, BETA, GAMMA — to unlock the main vault.
3. **Caution:** activating a relay emits a high-energy signature that **draws nearby creatures** to your position. Power it up, then hold the ground.
4. **Recover the clone-DNA sample** from the vault.
5. **Extract** with the vial at the landing zone.

Native lifeforms burrow up from the ground and attack on sight. Automated security drones still patrol the facility. Expect contact.

---

## 🕹 Controls

### Movement & Combat

| Key | Action |
|---|---|
| `W A S D` | Move |
| `MOUSE` | Look around |
| `LMB` | Fire the **BUL-117** |
| `RMB` | Aim down sights (zoom) |
| `SHIFT` | Sprint (uses stamina) |
| `SPACE` | Jump |
| `R` | Reload (consumes 1 cartridge) |
| `E` | Interact — hold to power relays, revive squadmates, take the vial |
| `G` | Throw an **ESG-180** grenade |
| `M` | Cycle sound mode — music / highlights / all sounds |

### Squad

| Key | Action |
|---|---|
| `1 / 2 / 3` | Squad command — ASSIST / SPREAD / HOLD |
| `T` | Give a spare cartridge to the neediest squadmate |
| `T` (aiming) | Give a cartridge to the squadmate under your crosshair (within 5 m) |
| `H` (aiming) | Use a medkit on the hurt squadmate under your crosshair (within 5 m) |

### Crafting

| Key | Action |
|---|---|
| `C` | Craft **MEDKIT** — 6 scrap (+60 HP, up to 3 stored) |
| `H` | Use MEDKIT |
| `V` | Craft **AMMO CARTRIDGE** — 4 scrap (+50 rounds) |
| `B` | Craft **GRENADE** — 1 power cell (+2, up to 5) |

> Scrap drops from downed creatures. Power cells are rare drops from the strongest hostiles.

---

## 🛡 Survival Systems

- **Shield** — absorbs any incoming damage while it holds; body damage is reduced by 40%. Regenerates to 100% after 10 s without a hit.
- **HP regen** — health below 25 slowly recovers back to 25 after 15 s of no damage.
- **Squad** — your squadmates share the same shield & HP-regen systems. Revive them with `E` when they're down.

---

## 🤖 Your Squadmates

You're the **fourth operator** — together with ROOK, VEX and KADE you make up a four-person fireteam. These are your AI squadmates:

| Member | Role | Loadout |
|---|---|---|
| **ROOK** | Heavy | Shotgun-style laser — fires **8 pellets** per trigger pull with a wide spread; shorter effective range, high-impact close-up |
| **VEX** | Medic | SMG-style laser — very fast fire, lighter damage, huge 70-round magazine |
| **KADE** | Rifleman | Standard laser rifle — long range, precise, dependable |

Squadmates fight alongside you, obey your formation commands, and carry their own shield/HP/regen. Keep them alive — they're the difference between extraction and a shallow grave on this planet.

---

## ⚙ Tech Stack

| | |
|---|---|
| **Engine** | [LittleJS](https://github.com/KilledByAPixel/LittleJS) (MIT) by Frank Force — 2D game loop, input, audio |
| **Rendering** | [Three.js](https://github.com/mrdoob/three.js) (MIT) — full 3D world via the LittleJS Three.js plugin |
| **Distribution** | One `chargefront.html` file — scripts, art and textures are inlined |

The game world, AI, squad behavior, crafting, cutscene and audio wiring are all hand-written in the single HTML file.

---

## 📁 Project Structure

```
Chargefront/
├── chargefront.html       ← the entire game (open this to play)
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
- **Font:** *Glitch Slap* (from [dafont.com](https://www.dafont.com/glitch-slap.font)) — used for the title and HUD headings
- **SFX:** extracted from [Soundly](https://soundly.com); original 24-bit files kept in `SFX/original/`. Remaining game sounds are synthesized in-browser via LittleJS's bundled **ZzFX** generator.
