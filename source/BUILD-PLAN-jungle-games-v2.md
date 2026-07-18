# Jungle Games v2 — Technical Build Plan

Source: family design meeting (Nate, Ben, Declan, Finn, James — July 2026).
Audience: a software engineer or coding LLM executing against this repo.

---

## 0. Codebase context (read first)

- **Stack:** Static site on Firebase Hosting. **No build step, no frameworks.** Every game is one fully self-contained HTML file (inline CSS + vanilla JS) in `source/public/games/`, named `<level>-<slug>.html`. Rendering is DOM/emoji-based or 2D `<canvas>`.
- **Hub:** `source/public/index.html` contains hard-coded game registries: `LEVEL1` trail entries (~line 1542) and Level 2 carousel entries (~line 1558, ids 21–23). New games must be added there.
- **Conventions:** Each game has a start-screen overlay, emoji art, a game-over/win screen, and **mobile touch controls** (touch drag to move, tap to act). Forest Defender includes a rainforest-facts quiz between waves — the site has an educational bent; preserve it.
- **Deploy safety (critical):** All files live under `source/`. Deploy only via `cd source && firebase deploy --project vdmdd-c7404`. Never deploy from repo root; never switch the global Firebase default. Pull/rebase before pushing (multiple contributors).

---

## 1. Llama Escape rebalance — make it easier (Ben)

**File:** `source/public/games/1-llama-escape.html` (change in place)

Current state: goal at 20,000m, 3 hearts, acorns call `takeDamage()` (−1 heart), crocodiles are **instant death** (`health = 0; gameOver()` at ~line 930).

Changes:

1. **Distance 20,000 → 10,000.** Introduce `const GOAL_DISTANCE = 10000` and replace every hardcoded `20000`:
   - HUD text `Distance: … / 20000m` (~line 413)
   - tree-density falloff `1 - (x / 20000) * 0.8` (~line 561)
   - `goalPosition = 20000` (~line 643)
   - Grep for any others (`20000`, `20,000`).
2. **Hearts 3 → 5.** Introduce `const MAX_HEALTH = 5` and replace hardcoded `3` at: `let health = 3` (~line 430), reset in `startGame` (~line 665), and the broken-heart loop bound in `updateHealthDisplay()` (~lines 702–706).
3. **Crocodiles deal 1 heart, not instant death.** In `crocodileLoop()` (~lines 925–935), replace `health = 0; showOuch(); setTimeout(gameOver, 500)` with a call to `takeDamage()`. Requirements:
   - Grant ~1.5s of invincibility frames after any hit (reuse/extend whatever `takeDamage()` already does for acorns — verify, and add an `invincible` flag if absent) so a croc the llama is standing on doesn't drain multiple hearts across frames.
   - On croc hit, give the llama a small automatic hop/knockback so it isn't still overlapping the croc when i-frames end.
   - Death still occurs naturally when `health <= 0` via the existing check in `takeDamage()`.

**Acceptance:** Game is winnable at 10,000m; HUD shows 5 hearts; walking into a croc costs exactly 1 heart with visible "OUCH" feedback and brief flashing invincibility; 5 croc hits = game over.

---

## 2. Forest Defender — trajectory-aim 2.5D upgrade (Finn)

**File:** `source/public/games/2-forest-defender.html` (rework the core loop, keep wrapper/quiz/waves)

Finn's spec, verbatim intent: *you can see the ranger tossing it, with a trajectory and a landing marker "like a tank game"; an aiming spot — where you aim, it will go; fewer loggers, but they move, so you have to time the throw so it lands when the logger is there.*

Design:

1. **Perspective field (2.5D on the existing 2D canvas — no library).** Add a depth axis: horizon line ~35% from top, ground plane below. Project world `(x, depth)` → screen via `scale = 1 / (1 + depth * k)`; sprites scale down and rise toward the horizon with depth. Player ranger (Finn) rendered large in the foreground bottom-center, visibly performing a throw animation on fire.
2. **Aiming reticle.** A ground-target marker (e.g. 🎯 / circle) the player moves freely in 2D (x + depth) with arrow keys / WASD / touch-drag. The reticle marks **exactly** where the projectile will land — no scatter.
3. **Trajectory throw.** On Space / tap: projectile leaves the ranger's hand and flies a visible parabolic arc (interpolate x/depth linearly, add `arcHeight * sin(π·t)` to screen-y; scale sprite with depth) landing precisely on the reticle after a flight time proportional to distance (~0.5–1.0s). Optionally render a faint dotted arc preview while aiming. Flight time is the skill element.
4. **Fewer, always-moving loggers.** Reduce loggers per wave (e.g. wave counts 3/4/5/6/7 instead of current density — tune). Loggers walk continuously between trees (never idle-stand), so hitting them requires leading the target. A hit within a small landing radius scares the logger off (existing flee behavior).
5. **Keep:** 5-wave structure, tree destruction/persistence, between-wave rainforest quiz, win/lose screens, existing weapon unlocks if compatible (simplify to one aimed weapon if the multi-column weapons don't translate).
6. **Controls:** Desktop — arrows/WASD move reticle, Space throws. Mobile — drag to move reticle, release (or tap a throw button) to throw. Must remain playable on a phone.

**Acceptance:** Reticle lands projectiles exactly where shown; loggers are hittable only by leading their movement; wave/quiz flow unchanged; playable with touch.

---

## 3. Monkey Climb — full 3D remake (James)

**File:** `source/public/games/2-monkey-climb.html` (rewrite rendering; keep name, registry entry, and game rules)

Requirement: *"actually 3D"* — real 3D rendering, not parallax.

1. **Library:** Three.js. **Vendor it** — download a pinned minified build to `source/public/vendor/three.min.js` (or `three.module.js` + import map) and reference it relatively. Do **not** hot-link a CDN (games must stay self-contained on Firebase Hosting; no build step means no npm).
2. **Scene:** A tall cylindrical tree trunk the monkey climbs. Third-person camera behind/above the monkey, following upward. Left/right input orbits the monkey around the trunk; up input climbs. Jungle skybox/fog, canopy layers passing by for a sense of height.
3. **Preserve existing rules** (from current file): climb to the top; jaguars 🐆 appear on branches ahead; hold Space + aim to throw 💩; **6 poop ammo total** (`TOTAL_POOPS = 6`); HUD shows ammo; hitting a jaguar clears it; touching a jaguar = fail/knockdown per current behavior.
4. **Throwing in 3D:** aim mode shows a reticle/arc; poop is a 3D projectile with gravity. Keep it forgiving — generous hit radius (players are kids).
5. **Assets:** Simple geometry + emoji-as-sprite textures (render emoji to canvas → `THREE.CanvasTexture`) is acceptable and matches the site's art style. No external model files required.
6. **DOM overlays:** Keep start screen, HUD, and win/lose screens as HTML overlays above the WebGL canvas.
7. **Controls:** arrows/WASD + Space on desktop; on-screen touch controls on mobile (virtual left/right/up zones + throw button). Test on phone-sized viewport.
8. **Performance:** target 60fps on a mid-range phone — low-poly geometry, no shadows or cap to one directional light with cheap shadow settings.

**Acceptance:** Renders true 3D (camera orbits visibly); same win condition and 6-poop economy as current version; runs from static hosting with no network dependency beyond the site itself; playable on touch.

---

## 4. New game — Toucan arrow-dodge in 3D (Declan)

**New file:** `source/public/games/2-toucan-dash.html` — working title **"Toucan Sky Dash"** (distinct from the existing 2D `1-toucan-fly.html`, which stays untouched).
**Register** in `source/public/index.html` Level 2 carousel array (~line 1558) as `{ id: 24, name: 'Toucan Sky Dash', emoji: '🏹', color: <pick>, file: 'games/2-toucan-dash.html' }`.

Declan's spec: *a toucan flying; bow-and-arrows coming at it; you can dodge up, down, and side to side; 3D; 6 hearts.*

1. **Rendering:** Three.js from the same vendored copy as Task 3 (`source/public/vendor/`).
2. **Core loop — rail flyer:** The toucan auto-flies forward down a jungle corridor (river canyon / canopy tunnel). Player steers within a 2D plane perpendicular to flight: up/down/left/right. Camera sits behind the toucan (Star Fox–style).
3. **Hazard:** Arrow volleys fired from hunters/blinds ahead and below. Each volley telegraphs (brief flash or bow-draw indicator at origin, ~0.7s warning) then arrows fly toward the toucan's plane; player dodges. Arrow speed and volley frequency ramp with progress.
4. **Health: 6 hearts.** Arrow hit = −1 heart, ~1.5s i-frames with toucan flash. 0 hearts = game over → retry screen.
5. **Length: 1,000 m** course with a `Distance: x / 1000m` HUD (see Open Questions #2). Reaching 1,000m = win screen with celebration.
6. **Optional flavor to match the site:** passing conservation facts on the win screen, jungle scenery (emoji-sprite trees/macaws) as set dressing.
7. **Controls:** arrows/WASD desktop; touch-drag steering on mobile (same pattern as `1-toucan-fly.html`'s existing touch code — port the idea, not the code).
8. **Performance:** same 60fps mobile target as Task 3; recycle obstacle/arrow objects (object pooling) rather than allocating per volley.

**Acceptance:** New tile appears in the Level 2 carousel; toucan dodges in a visibly 3D corridor; 6-heart HUD; arrows telegraph before firing; winnable at 1,000m; touch playable.

---

## 5. River Run — 2.5D perspective treatment (Ben) — CONFIRMED

**File:** `source/public/games/2-river-run.html`

**Decision (confirmed by Nate):** same 2.5D treatment as Forest Defender — add a horizon and depth, but **do not change the play controls or gameplay.** This is a rendering-layer change only.

- Convert the river to pseudo-3D perspective (classic racing-game style): banks converge to a vanishing point, scrolling scanline water bands convey speed, obstacles/parrots spawn small at the horizon and scale up as they approach.
- Same projection math as Task 2: `scale = 1 / (1 + depth * K)`, draw sorted far-to-near.
- **Implementation rule:** keep the existing game-logic coordinates untouched and add a pure presentation layer that projects logic coords → screen coords at draw time. Collision math keeps running in the old flat space, which guarantees identical gameplay.
- Preserve: all controls (desktop + touch), the parrot rescue storyline, scoring, difficulty pacing, and all screens. No Three.js.

---

## 6. Sequencing, testing, delivery

**Order:** Task 1 (30 min) → Task 2 → Task 4 → Task 3 → Task 5 (blocked on confirmation). Tasks 3 and 4 share the Three.js vendoring step — whichever is built first sets up `source/public/vendor/`.

**Per-task verification:** run the local dev server (`.claude/launch.json`), play each changed game to its win and lose states, then test at mobile viewport (375×812) with touch. Check the browser console for errors on load and during play.

**Git/deploy:** one commit per task; pull/rebase before every push (repo rule); CI deploys `source/` on merge to `main`. Manual deploys only via `cd source && firebase deploy --project vdmdd-c7404`.

---

## Open questions (flag to Nate before/while building)

1. **Llama hearts — 5 or 6?** Ben asked for 5 hearts; Declan later said "6 hearts… 1,000 meters," and the transcript attribution is ambiguous ("Six hearts, okay, for Declan's game"). This plan uses **5 hearts for Llama Escape** (Ben's game, Ben's spec) and **6 hearts for Declan's new toucan game**.
2. **The "1,000 meters"** is likewise interpreted as the new toucan game's course length, not a further Llama Escape reduction. If it was meant for Llama Escape, change `GOAL_DISTANCE` — but 1,000m would make that game ~30 seconds long, so 10,000m is almost certainly the intended value.
3. ~~**Ben's Level 2 game**~~ — **RESOLVED.** Nate confirmed: River Run gets the same 2.5D horizon treatment as Forest Defender, with play controls left alone. See Task 5.
