import { WORLD_WIDTH, getLevel, getVehicleKind, type GameState, type PickupKind } from "../game";
import type { GameController } from "../app/useGameController";
import { lanePercentage } from "../app/useGameController";
import { GameDialog } from "./GameDialog";
import { GameHud } from "./GameHud";
import { TouchControls } from "./TouchControls";
import { VehicleSprite } from "./VehicleSprite";

type GameSceneProps = {
  controller: GameController;
};

const PICKUP_SYMBOL: Readonly<Record<PickupKind, string>> = {
  water: "H₂O",
  shield: "◆",
  banana: "B",
  coffee: "C",
  croissant: "+",
};

function getRiderAnimation(state: GameState, heldInput: GameController["heldInput"]): string {
  if (state.phase === "stageComplete") return "victory";
  if (state.phase === "gameOver" || state.player.invulnerabilityRemaining > 0) return "hurt";
  if (heldInput.left) return "left";
  if (heldInput.right) return "right";
  if (heldInput.sprint || state.buffs.coffeeRemaining > 0) return "sprint";
  return "normal";
}

export function GameScene({ controller }: GameSceneProps) {
  const { state, displayScore, announcement, heldInput, actions } = controller;
  const level = getLevel(state.stageIndex);
  const progress = Math.min(1, state.distance / level.finishDistance);
  const riderAnimation = getRiderAnimation(state, heldInput);
  const warningLanes = new Set(
    state.vehicles
      .filter((vehicle) => vehicle.x >= WORLD_WIDTH - 40 && vehicle.x <= WORLD_WIDTH + 180)
      .map((vehicle) => vehicle.lane),
  );

  return (
    <section className="gameplay" aria-label={`${level.title} gameplay`}>
      <GameHud state={state} displayScore={displayScore} onPause={actions.pause} />

      <div className="gameplay__scene" aria-hidden="true">
        <div className="landscape">
          <img
            src={level.backgroundImage}
            alt=""
            draggable="false"
            style={{ transform: `translate3d(${-progress * 44}%, 0, 0)` }}
          />
          <div className="landscape__wash" />
        </div>

        <div className="road">
          <div className="road__edge road__edge--top" />
          <div className="road__lane road__lane--one" />
          <div className="road__lane road__lane--two" />
          <div className="road__texture" />
        </div>

        {[0, 1, 2].map((lane) =>
          warningLanes.has(lane as 0 | 1 | 2) ? (
            <span
              className="traffic-warning"
              key={lane}
              style={{ bottom: `${lanePercentage(lane as 0 | 1 | 2) + 4}%` }}
            >
              Traffic
            </span>
          ) : null,
        )}

        {state.vehicles.map((vehicle) => {
          const kind = getVehicleKind(vehicle.kindId);
          return (
            <div
              className="vehicle-entity"
              key={vehicle.id}
              style={{
                left: `${(vehicle.x / WORLD_WIDTH) * 100}%`,
                width: `${(vehicle.width / WORLD_WIDTH) * 100}%`,
                bottom: `${lanePercentage(vehicle.lane)}%`,
              }}
            >
              <VehicleSprite kindId={kind.id} />
            </div>
          );
        })}

        {state.pickups.map((pickup) => (
          <div
            className={`pickup pickup--${pickup.kind}`}
            key={pickup.id}
            style={{
              left: `${(pickup.x / WORLD_WIDTH) * 100}%`,
              width: `${(pickup.width / WORLD_WIDTH) * 100}%`,
              bottom: `${lanePercentage(pickup.lane) + 2}%`,
            }}
          >
            {PICKUP_SYMBOL[pickup.kind]}
          </div>
        ))}

        <div
          className={`rider ${state.player.hasShield ? "rider--shielded" : ""} ${
            state.player.invulnerabilityRemaining > 0 ? "rider--invulnerable" : ""
          }`}
          style={{
            left: `${(state.player.x / WORLD_WIDTH) * 100}%`,
            width: `${(state.player.width / WORLD_WIDTH) * 100}%`,
            bottom: `${lanePercentage(state.player.lane)}%`,
          }}
        >
          <span className={`rider__sprite rider__sprite--${riderAnimation}`} />
        </div>
      </div>

      <div className="buffs" aria-label="Active effects">
        {state.player.hasShield && <span>Shield ready</span>}
        {state.buffs.coffeeRemaining > 0 && (
          <span>Coffee · {Math.ceil(state.buffs.coffeeRemaining)}s</span>
        )}
        {state.buffs.bananaRemaining > 0 && (
          <span>Banana · {Math.ceil(state.buffs.bananaRemaining)}s</span>
        )}
      </div>

      {announcement && <div className="event-toast">{announcement}</div>}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <TouchControls
        bottles={state.bottles}
        leftActive={heldInput.left}
        rightActive={heldInput.right}
        sprintActive={heldInput.sprint}
        onLaneUp={() => actions.changeLane(1)}
        onLaneDown={() => actions.changeLane(-1)}
        onLeft={actions.holdLeft}
        onRight={actions.holdRight}
        onSprint={actions.holdSprint}
        onUseBottle={actions.useBottle}
      />

      <aside className="key-legend" aria-label="Keyboard controls">
        <span>
          <kbd>W</kbd>
          <kbd>S</kbd> lane
        </span>
        <span>
          <kbd>A</kbd>
          <kbd>D</kbd> position
        </span>
        <span>
          <kbd>Shift</kbd> boost
        </span>
        <span>
          <kbd>E</kbd> water
        </span>
        <span>
          <kbd>P</kbd> pause
        </span>
      </aside>

      <GameDialog
        state={state}
        displayScore={displayScore}
        onResume={actions.pause}
        onRetry={actions.retry}
        onRoute={actions.returnToRoute}
        onContinue={actions.continueRoute}
      />
    </section>
  );
}
