# Freiburg–Konstanz

### A Black Forest cycling arcade.

Freiburg–Konstanz is a production-ready browser game and frontend engineering case study. It turns a
stylized journey from Freiburg im Breisgau to Lake Constance into ten short arcade stages built
around positioning, stamina management, pickups, traffic, and near-miss scoring.

[Play Freiburg–Konstanz](https://wh1tebrun.github.io/freiburg-konstanz/) ·
[View the source repository](https://github.com/wh1tebrun/freiburg-konstanz)

The route is fictionalized and is not intended for navigation or real-world cycling guidance.

## What the project demonstrates

- A deterministic TypeScript simulation that is independent of React and browser APIs
- Time-sliced state advancement with equivalent results at 60, 120, and 144 Hz
- Seeded vehicle and pickup generation for reproducible tests
- A near-miss combo system with a capped 5× score multiplier
- Equivalent keyboard and pointer-based touch controls
- Defensive, versioned local progression with migration from earlier storage keys
- Responsive layouts, safe-area support, visible focus, live announcements, and reduced motion
- A locked quality pipeline covering formatting, linting, strict type checking, tests, and builds

## Gameplay

The player guides Melissa across three lanes while moving horizontally to avoid traffic. Sprinting
trades stamina for speed; water, shields, bananas, coffee, and croissants change the available
options during a run. Passing close to a vehicle without colliding starts or extends a combo. Each
near miss raises the award multiplier up to 5×, while a collision resets the active combo without
erasing the best streak from the run.

Completing a stage unlocks the next stretch of the ten-stage route. Progress is stored only in the
current browser and the game continues safely when storage is blocked or contains invalid data.

## Controls

| Action                    | Keyboard               | Touch / pointer   |
| ------------------------- | ---------------------- | ----------------- |
| Start a stage             | `Enter` or Start stage | Start stage       |
| Move horizontally         | `A` / `D` or `←` / `→` | Hold Left / Right |
| Change lane               | `W` / `S` or `↑` / `↓` | Up / Down         |
| Sprint                    | Hold `Shift`           | Hold Boost        |
| Use a water bottle        | `E`                    | H₂O               |
| Pause or resume           | `P` or `Esc`           | Pause / Resume    |
| Return to the route       | `M`                    | Route map         |
| Retry after a failed run  | `R`                    | Retry stage       |
| Continue after completion | `N`                    | Next stage        |

Held movement is released and an active run is paused when the page loses focus or becomes hidden.

## Architecture

The application is split around one-way dependencies:

| Area                  | Responsibility                                                                   |
| --------------------- | -------------------------------------------------------------------------------- |
| `src/game/`           | Immutable game state, simulation, collision rules, scoring, RNG, progression     |
| `src/app/`            | Browser lifecycle, animation scheduling, input normalization, persistence wiring |
| `src/components/`     | Route selection, gameplay scene, HUD, touch controls, dialogs                    |
| `src/content/`        | Canonical product identity and presentation copy                                 |
| `src/styles/`         | Responsive application and gameplay styling                                      |
| `src/assets/runtime/` | Purpose-sized WebP artwork used by the application                               |
| `tests/`              | Timing, collision, effects, progression, RNG, and rendered-interface contracts   |

`stepGame(state, input, deltaSeconds)` is the central simulation boundary. It splits elapsed time
into bounded slices and stops precisely at effect, stamina, and route-speed boundaries. Scoring and
movement therefore depend on simulation time rather than the number of rendered frames. Random state
travels with the game state, so the same seed and inputs produce the same world.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the complete design and verification model.

## Local development

### Requirements

- Node.js 24 or newer
- npm with the committed lockfile

```bash
git clone https://github.com/wh1tebrun/freiburg-konstanz.git
cd freiburg-konstanz
npm ci
npm run dev
```

## Quality commands

| Command                | Purpose                              |
| ---------------------- | ------------------------------------ |
| `npm run format:check` | Verify repository formatting         |
| `npm run lint`         | Run strict, type-aware ESLint rules  |
| `npm run typecheck`    | Compile-check application and tests  |
| `npm run test`         | Run the deterministic Vitest suite   |
| `npm run check`        | Run all required quality gates       |
| `npm run build`        | Produce the optimized `dist/` bundle |

Pull requests and pushes to `main` run the CI quality and build workflow. Pushes to `main` also
produce a checked `dist/` artifact and deploy it through GitHub Pages.

## Release status

Version 1.0.0 is the production-ready case-study release. It includes the complete route, desktop
and touch gameplay, deterministic simulation, local progression, responsive presentation, automated
tests, and repository release standards. The application is client-only: it has no account system,
backend, analytics, or cloud save.

## Assets and licensing

The MIT license in [LICENSE](LICENSE) applies to source code only. Visual assets are demonstration
assets and are excluded from the MIT grant. Their provenance and redistribution rights must be
verified before reuse or publication; repository access must not be treated as permission to reuse
them. See [ASSETS.md](ASSETS.md).

Development expectations are in [CONTRIBUTING.md](CONTRIBUTING.md). Security issues should follow
the private reporting process in [SECURITY.md](SECURITY.md).
