# CHARGE FRONT

**First-person tactical shooter.** Land on a purple-spotted alien world, restore an abandoned bio-research facility with your squad, recover its lost clone-DNA vial, and fight to extract before the horde overwhelms you.

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

Four independently replayable operations share one hostile frontier while using distinct deployment points, routes, objectives, and combat rhythms:

1. **Dead Signal** — land at the old LZ, follow the abandoned facility road, recover the Emergency Maintenance Battery, restore local power, and discover why the clone-DNA sample remains sealed inside the bio-lab. An optional Auxiliary Field Cell can power either tactical sensors or a field-gear locker.
2. **Power Through** — deploy from the facility staging yard, traverse the lowland Alpha yard, elevated Beta ridge, and contaminated Gamma crater, survive distinct enemy responses, and reopen laboratory access. A service-dock Survey Drone provides an optional forward escort and tactical scan without blocking relay progress.
3. **Sample Zero** — breach the reopened laboratory, bypass corrupted containment security, retrieve the DNA sample, and protect its portable containment sync. An optional security-turret restoration provides automated support and local hostile intel.
4. **Break Contact** — continue seamlessly from Sample Zero or deploy from Mission Select with the sample already secured, escape through the east maintenance breach, request extraction, hold the restoration LZ for two minutes, and board the transport.

Use **Select Mission** to replay any unlocked mission directly. **Endless Horde** remains a separate mode with randomized arenas, mutator contracts, DNA progression, and six-wave extraction milestones.

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
| `E` | Interact — hold to use consoles, power relays, revive squadmates, secure the sample, and board extraction |
| `G` | Throw an **ESG-180** grenade |
| `Q` | Cycle weapon — rifle / scattergun / ARC / plasma HE |
| `F` | Use SURGE PULSE |
| `M` | Cycle sound mode — music / highlights / all sounds |

### Squad

| Key | Action |
|---|---|
| `1 / 2 / 3` | Squad command — ASSIST / SPREAD / HOLD |
| `Z / X / Y` | Use ROOK / VEX / KADE squad abilities |
| `N` | Choose the next Endless mutator contract at the relay |
| `K` | Extract from Endless after a six-wave milestone |
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
