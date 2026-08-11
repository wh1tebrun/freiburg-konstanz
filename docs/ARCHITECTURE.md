# Architecture

## Overview

Freiburg–Konstanz is a client-only React application built around a deterministic TypeScript game
simulation. Gameplay rules do not depend on React, the DOM, browser storage, wall-clock APIs, or
`Math.random()`. The browser layer translates input and elapsed time into simulation calls; React
renders the returned state.

This separation makes the core mechanics reproducible in unit tests while keeping browser-specific
concerns small and explicit.

## Implemented boundaries

```text
src/
  game/
    engine.ts          State creation, transitions, sliced simulation, scoring
    collision.ts       Collision and near-miss interval rules
    random.ts          Seed normalization and deterministic random samples
    progress.ts        Versioned, defensive browser-progress format
    constants.ts       Simulation tuning values and product identity
    config/            Stage and vehicle configuration
    types.ts           Read-only domain state, inputs, events and persistence types
  app/
    useGameController.ts  RAF scheduling, keyboard input, lifecycle and storage wiring
    GameApp.tsx           Menu/gameplay composition
  components/          Stage selector, scene, HUD, touch controls and result dialog
  content/             Canonical public identity and route copy
  styles/              Responsive, motion and gameplay presentation
  assets/runtime/      Compressed runtime artwork
tests/                 Engine, persistence, randomness and UI-contract tests
```

Dependencies point toward `src/game/`. The domain layer neither imports presentation code nor reads
browser globals. `src/app/` is the integration boundary; components consume controller state and
actions without implementing game rules.

## Simulation contract

The engine exposes immutable `GameState` values and explicit transition functions. The primary entry
point is:

```ts
stepGame(state, input, deltaSeconds): GameState
```

The engine rejects invalid negative or non-finite time deltas. Valid elapsed time is processed in
slices no larger than 1/120 second. A slice is shortened when necessary to land exactly on a coffee
or banana expiry, the end of invulnerability, stamina exhaustion, a route speed threshold, or the
stage finish. This avoids skipping state boundaries during a long display frame.

Movement, stamina, distance, boost duration, and baseline score are integrated by elapsed simulation
time. Tests run equivalent input over 60, 120, and 144 Hz frame schedules and compare the resulting
time, distance, stamina, and score. The browser controller caps a single RAF delta at 100 ms and
pauses the run when the document is hidden or the window loses focus.

## Deterministic randomness

The current random seed is part of `GameState`. `src/game/random.ts` advances it through an explicit
32-bit linear congruential generator and returns both the sampled value and next seed. Vehicle type,
lane, pickup type, and respawn gap selection all consume this stream.

The production controller starts a fresh session from a time-derived seed. Tests provide a fixed
seed, making generated worlds and subsequent state transitions repeatable.

## Gameplay transitions

`GameState.phase` is one of `menu`, `playing`, `paused`, `gameOver`, or `stageComplete`. Transition
functions guard the valid source phases and return unchanged state when an action does not apply.

Within each simulation slice, the engine:

1. applies discrete lane and bottle input;
2. integrates player, traffic, pickup, stamina, distance, effect, and score values;
3. completes the stage when the finish boundary is reached;
4. records passed vehicles;
5. resolves vehicle collisions;
6. resolves near misses only when no collision occurred;
7. applies pickup effects;
8. recycles off-screen entities through the seeded random stream.

Game events are emitted as data and translated into visual and polite live announcements by the
controller.

## Near-miss combo model

A near miss requires the player and vehicle to share a lane, enter an expanded collision interval,
and remain outside the true collision interval. Each vehicle can award it only once. The active
combo increments for each award, while the score multiplier is capped at 5×. A damaging collision
resets the active combo but preserves `bestCombo`; a shielded collision consumes the shield instead.

Collision handling precedes near-miss handling, so one vehicle cannot award both outcomes in the
same slice. Dedicated tests cover one-time awards, multiplier capping, collision exclusion, and
combo reset semantics.

## Input and browser lifecycle

`useGameController` normalizes keyboard and touch actions into `GameInput` values:

- continuous left, right, and sprint input is held outside React event objects;
- lane changes and bottle use are discrete commands;
- repeated keydown events are ignored for discrete actions;
- interactive controls are not overridden by global gameplay shortcuts;
- window blur and document hiding release held controls and pause active gameplay.

Touch hold buttons use pointer capture, so release and cancellation are paired with the pointer that
started an action. The same controller actions power both input methods.

## Progression and storage

Only the highest unlocked stage is persisted. The canonical record uses
`freiburg-konstanz.progress.v1`, a version tag, and a clamped stage index. The adapter validates
parsed values and falls back to a clean first-stage record when storage is missing, corrupt,
incompatible, or unavailable.

The loader migrates the earlier `freiburg-to-konstanz.progress.v1` record and the original numeric
`ride-to-bodensee-unlocked` value. A failed migration write does not prevent the recovered value
from being used for the current session.

## Rendering, accessibility, and responsive behavior

The simulation uses a normalized 1,000-unit world. Components convert world coordinates to
percentages for layout, while stage artwork pans with compositor-friendly transforms. Runtime scene
and badge artwork is stored as purpose-sized WebP assets.

The interface provides:

- keyboard and touch access to every gameplay action;
- semantic stage buttons with selected and locked states;
- a labelled distance progress bar and pause control;
- focus-managed pause and result dialogs;
- polite live announcements for important game events;
- visible focus, dynamic viewport sizing, safe-area insets, portrait and landscape layouts;
- a reduced-motion mode that suppresses nonessential animation.

The route and artwork are a fictionalized presentation. They do not provide navigation or safety
guidance.

## Verification and delivery

Vitest coverage exercises:

- refresh-rate-independent movement, stamina, effects, distance, and score;
- collision, shields, invulnerability, and immutable transitions;
- near-miss detection and combo behavior;
- seeded random sequences and reproducible world generation;
- stage unlocking, key migration, corrupt storage, and blocked storage;
- essential rendered accessibility contracts for the route, HUD, and dialogs.

`npm run check` combines formatting, strict type-aware linting, TypeScript compilation, and the test
suite. CI repeats that gate and creates a production Vite build on Node.js 24. The Pages workflow
uploads only the resulting `dist/` directory and deploys it with GitHub's OIDC-backed Pages action.

## Scope boundaries

- No backend, accounts, telemetry, multiplayer, or cloud progression
- No user-generated or remotely supplied content
- No claim that demonstration artwork is covered by the source-code license
- No claim that the fictional route is suitable for real-world travel
