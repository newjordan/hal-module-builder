# HAL · Owl3D

An always-on stereo 3D portal for agent activity, built for the
[Owl3D Shift](https://www.owl3d.com/shift) glasses-free 3D monitor. HAL lives
in a grid room behind the glass. When agents work, HAL works: it plugs into
the inner computer under the floor to think and read, reaches out with
swiss-army arms to build, types replies at the cyberdesk in the foreground,
and sets finished work down on the desk.

The portal is part of HAL Agent Operations. It reads the same event contract
through the same validator as the console (`src/agent-system/validation.ts`),
gets live activity from the same bridge, and builds its eye from your HAL
Studio design.

## Run it

```bash
npm install
npm run owl3d        # build, then start the always-on shell
npm run owl3d:dev    # the shell against the Vite dev server (hot reload)
```

Bun works too, with no Node installed: `bun install && bun run owl3d`.

The shell (`electron/owl3d/main.cjs`):

- finds the display named Owl3D / Shift (or the one picked in the tray) and
  covers it full screen in side-by-side stereo, above other windows;
- starts the HAL bridge for every workspace (`HAL_WORKSPACE='*'`) unless one
  is already running on port 8765;
- serves the built app on the `hal://app` origin, with models read straight
  from `public/owl3d/models/` so Blender exports show up without a rebuild;
- adds a menu bar icon for mode, depth, eyes, display, HAL Studio, the agent
  console, the models folder and a demo shift.

Child processes run on Electron's bundled Node, so the shell works without a
system Node install.

Without the shell, open `/owl3d.html` from `npm run dev`. Query parameters:
`mode=sbs|window`, `demo` (loop a scripted shift), `ws=<bridge url>`. Press
`F` for full screen.

## The Owl3D Shift

The Shift's panel does not decode side-by-side input by itself. **Owl3D's
app does the 3D**: its *Stereo 3D Playback* tracks your eyes with the Shift's
USB camera and weaves the left and right images for the panel's lenses. To
see HAL in 3D:

1. Install and open the Owl3D app (owl3d.com; Mac needs Apple Silicon).
2. In the app: **Stereo 3D Playback → Side-by-side → Start**.
3. Put the portal in stereo (`S`, `⌘⌥H`, or the menu bar icon).

Without that app the Shift shows the side-by-side frame flat: two squeezed
copies of the room.

The portal renders the left eye into the left half of the frame and the right
eye into the right half, full SBS at 1920 × 2160 per eye, which is the
Shift's 3D resolution. Each half is rendered anamorphically at the
full-panel aspect ("Anamorphic halves" in the menu). If depth looks inside
out, toggle **Swap eyes**. In stereo the portal covers the display but is not
forced on top, so Owl3D's woven output can sit over it; "Keep Stereo on Top"
in the menu changes that.

The world is scaled to the panel: the glass is 16 × 9 units at z = 0,
matching the Shift's 339 × 200 mm panel, and the viewer sits about 55 cm in
front (the Shift's range is 45–100 cm), with a 6.4 cm eye separation. Both
are constants in `src/owl3d/config.ts`. The room's front edges line up with
the screen's edges, so nothing is clipped by the frame. Depth and
convergence are adjustable.

| Key | Action |
| --- | --- |
| `S` / `Esc` | Stereo full screen / floating window |
| `[` `]` | Less / more depth |
| `,` `.` | Push the zero-parallax plane in / out |
| `E` | Swap eyes |
| `A` | Anamorphic halves on/off |
| `H` | HUD on/off |
| `D` | Play the demo shift |
| `M` | Microphone on/off |
| `⌘⌥M` | Microphone on/off from anywhere (shell only) |
| `⌘⌥H` | Toggle stereo / window from anywhere (shell only) |

The floating window renders in mono; Owl3D's live 2D→3D conversion can add
depth to it.

## What HAL does

| Agent activity | HAL |
| --- | --- |
| New prompt | Perks up and looks at you |
| Thinking, reading, searching (`Read`, `Grep`, `Glob`, web tools) | Floor panels open, the inner computer rises, HAL docks, plugs a cable into its crown and probes it; data packets run down the cable, results run back up |
| Making things (`Bash`, `Edit`, `Write`, sub-agents, anything else) | Flies to its build plot and assembles a block per call with its arms, the tool head matching the tool (driver, pen, splitter …) |
| Tool error | A red block shatters, sparks, HAL flinches |
| Writing a reply | Hovers at the cyberdesk and types, facing you |
| Turn complete | Carries a cartridge to the desk, sets it down (logged on the holo screen), celebrates |
| Approval needed | Comes to the glass and waves |
| Quiet | Wanders, inspects floor tiles, peeks at you, tends its builds; naps after 8 minutes |

Each live agent gets its own bot (up to four) with a colored identity band and
its own build plot. HAL embodies the first agent and stays home when the last
one leaves.

## Talking to HAL

The portal listens on the Mac's microphone and runs Whisper (base.en) on
your machine: WebGPU on the Apple GPU, WebAssembly otherwise. Speech is
detected by level against the room's noise floor; each sentence is
transcribed when you pause. HAL turns to face you while you talk, and its eye
follows your voice. The dock at the bottom left shows the microphone state
and level, toggles listening, and stops HAL mid-sentence.

The shell connects that to an agent session through two JSON-lines files in
`~/.hal/voice` (or `HAL_VOICE_DIR`):

- `inbox.jsonl` gets one line per thing you say;
- each line appended to `outbox.jsonl` is rendered with macOS `say` (voice
  `HAL_VOICE`, default Daniel; rate `HAL_VOICE_RATE`) and spoken by HAL, with
  subtitles, while its eye moves with its own voice. The microphone is deaf
  while HAL talks.

`scripts/hal-voice.mjs` is the agent's side (`npm run hal-voice -- …`):

```bash
node scripts/hal-voice.mjs listen            # one line per sentence you say
node scripts/hal-voice.mjs say "Hello, Dave." # HAL speaks
node scripts/hal-voice.mjs say --agent claude:<session> "…"  # as that session's bot
```

An agent that can watch a command's output (for example a Claude Code
monitor on `hal-voice listen`) hears you as you speak and answers with
`hal-voice say`. Everything stays on the machine; Whisper's model downloads
once and the shell keeps it in `~/.hal/models`.

## The eye

The lens is your HAL Studio design. Each studio layer (shapes, strokes,
gradients, equalizers, images) is drawn flat into its own texture and
UV-mapped onto a spherical shell inside the lens opening, rear layers
deepest, under a glass dome. Equalizers and audio-reactive layers stay live,
driven by agent activity instead of audio, and tint toward the agent's state
color. See `src/owl3d/layerPlan.ts` (layer → shell plan, unit tested) and
`src/owl3d/eye.ts`.

The design comes from `localStorage['hal-layers']`, or the default HAL eye.
HAL Studio opened from the shell's menu shares the portal's origin, so studio
edits appear in the 3D eye as you make them.

## Blender kit

Every shape is built in Blender by `blender/build_owl3d_kit.py`, which
exports one `.glb` per part to `public/owl3d/models/` and saves
`blender/owl3d_kit.blend` (one collection per part) for hand sculpting:

```bash
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender npm run owl3d:kit
# add `-- --preview DIR` to the command to render a PNG of every part
```

Edit and re-export by hand from the `.blend` (File → Export → glTF 2.0,
`.glb`, selected collection, +Y up, apply modifiers) and the portal reloads
the file within a couple of seconds.

Conventions:

- **Axes.** Blender is Z-up; glTF export makes it Y-up, and Blender −Y becomes
  the portal's +Z, toward the viewer. The eye's lens faces Blender −Y.
- **Glow.** Materials named `HAL_State*` glow in the agent's state color;
  `HAL_Tool*` glow in the color of the tool in use.
- **Sockets.** Empties named `socket_*` mark attachment points. The shell's
  `socket_arm_L`, `socket_arm_R`, `socket_cable` and `socket_top` place the
  arms, the cable and `eye.top` models.
- **Clips.** Animation clips are actions pushed to NLA tracks; their names
  are what the manifest's `clips` refer to.
- **Proportions** the code relies on: shell radius 0.9 with a 0.62 lens
  opening; upper arm 0.9 and forearm 0.8 long along +Z with hinges on X; tool
  heads along +Z from the wrist; desk origin at floor center, top at 0.9;
  hatch doors 1 × 2 hinged on their X = 0 edge; build blocks with the origin
  at the base. The core and build blocks are scaled to fit.

## Model manifest

`public/owl3d/models/manifest.json` lists every model:

```json
{
  "models": [
    { "id": "desk", "file": "desk.glb", "attach": "part", "part": "desk" },
    { "id": "antenna", "file": "antenna.glb", "attach": "eye.top",
      "clips": { "work": "Work", "celebrate": "Celebrate", "*": "Idle" } },
    { "id": "server", "file": "server.glb", "attach": "build",
      "tools": ["Bash"], "tint": "tool" }
  ]
}
```

| Field | Default | Meaning |
| --- | --- | --- |
| `file` | required | Relative `.glb`/`.gltf` path in the models folder. |
| `attach` | `eye.top` | `eye.top`, `eye.bottom`, `eye.left`, `eye.right`, `eye.back`, `eye.front`, `eye.orbit`, `eye.body`, `world`, `build` or `part`. |
| `part` | — | For `attach: "part"`: `shell`, `arm.shoulder`, `arm.upper`, `arm.fore`, `tool.gripper`, `tool.driver`, `tool.pen`, `tool.probe`, `tool.dish`, `tool.splitter`, `desk`, `floor.panel`, `core`, `cable.plug`, `deliverable`. Missing parts fall back to plain shapes. |
| `tools` | — | For `build`: tool names (regular expressions, whole name) whose blocks this model replaces. |
| `position`, `rotation`, `scale` | origin, 0°, 1 | Placement relative to the socket (world units for `world`). |
| `tint` | `state` | `state`, `tool` or `none`. |
| `clips` | — | Agent state or bot activity → clip name; `*` is the fallback. Activities: `idle`, `wander`, `inspect`, `peek`, `tend`, `survey`, `alert`, `compute`, `work`, `speak`, `deliver`, `celebrate`, `attention`, `flinch`, `nap`. |
| `spin`, `orbitRadius`, `orbitSpeed` | 0, 1.7, 0.8 | Continuous spin; orbit for `eye.orbit`. |
| `hideShell` | `false` | For `eye.body`: hide the shell. |
| `enabled` | `true` | Keep an entry without loading it. |

Bad entries are reported on the HUD and in the console; good ones still load.

## Debugging

`OWL3D_SNAPSHOT=/tmp/owl3d.png npm run owl3d` saves what the portal shows
after it settles (`OWL3D_SNAPSHOT_DELAY`, default 12000 ms) and quits. In the
page, `window.owl3d` exposes `emit(event)`, `demo()`, `bots` and `models`.

## Files

| Path | Role |
| --- | --- |
| `owl3d.html`, `src/owl3d/main.ts` | Entry, renderer, stereo pipeline, agent → bot registry |
| `src/owl3d/bot.ts` | HAL: behaviors, motion, eye, arms, cable |
| `src/owl3d/eye.ts`, `layerPlan.ts` | Studio layers as UV-mapped lens shells |
| `src/owl3d/rig.ts` | Arms (two-bone IK, swiss-army heads) and data cables |
| `src/owl3d/station.ts` | Cyberdesk, deliverables, hatch and inner computer |
| `src/owl3d/plot.ts` | Build plots and blocks |
| `src/owl3d/world.ts` | Grid room shader, hatch cut-out, dust, floor pulses |
| `src/owl3d/models.ts`, `manifest.ts` | Model loading, sockets, clips, hot reload |
| `src/owl3d/events.ts` | Bridge, BroadcastChannel and window event intake |
| `src/owl3d/voice/` | Microphone, voice activity detection, Whisper worker, HAL's voice, the dock |
| `scripts/hal-voice.mjs` | Agent side of the voice link (`listen`, `say`) |
| `electron/owl3d/` | The always-on shell |
| `blender/` | The Blender kit script and `.blend` |
| `scripts/claude-code-source.mjs` | Claude Code transcripts for the bridge |
