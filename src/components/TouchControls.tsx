import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

type HoldButtonProps = {
  children: ReactNode;
  label: string;
  active: boolean;
  onChange: (active: boolean) => void;
  className?: string;
};

function HoldButton({ children, label, active, onChange, className = "" }: HoldButtonProps) {
  const start = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(true);
  };

  const stop = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onChange(false);
  };

  return (
    <button
      className={`touch-button ${active ? "is-active" : ""} ${className}`}
      type="button"
      aria-label={label}
      aria-pressed={active}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </button>
  );
}

type TouchControlsProps = {
  bottles: number;
  leftActive: boolean;
  rightActive: boolean;
  sprintActive: boolean;
  onLaneUp: () => void;
  onLaneDown: () => void;
  onLeft: (active: boolean) => void;
  onRight: (active: boolean) => void;
  onSprint: (active: boolean) => void;
  onUseBottle: () => void;
};

export function TouchControls({
  bottles,
  leftActive,
  rightActive,
  sprintActive,
  onLaneUp,
  onLaneDown,
  onLeft,
  onRight,
  onSprint,
  onUseBottle,
}: TouchControlsProps) {
  return (
    <div className="touch-controls" aria-label="Game controls">
      <div className="touch-controls__cluster touch-controls__cluster--lane">
        <button
          className="touch-button"
          type="button"
          onClick={onLaneUp}
          aria-label="Move to upper lane"
        >
          <span aria-hidden="true">↑</span>
        </button>
        <button
          className="touch-button"
          type="button"
          onClick={onLaneDown}
          aria-label="Move to lower lane"
        >
          <span aria-hidden="true">↓</span>
        </button>
      </div>

      <div className="touch-controls__cluster touch-controls__cluster--position">
        <HoldButton label="Move left" active={leftActive} onChange={onLeft}>
          <span aria-hidden="true">←</span>
        </HoldButton>
        <HoldButton label="Move right" active={rightActive} onChange={onRight}>
          <span aria-hidden="true">→</span>
        </HoldButton>
      </div>

      <div className="touch-controls__cluster touch-controls__cluster--actions">
        <button
          className="touch-button touch-button--water"
          type="button"
          onClick={onUseBottle}
          disabled={bottles === 0}
          aria-label={`Use water bottle; ${bottles} available`}
        >
          <span aria-hidden="true">H₂O</span>
          <small>{bottles}</small>
        </button>
        <HoldButton
          label="Sprint"
          active={sprintActive}
          onChange={onSprint}
          className="touch-button--sprint"
        >
          Boost
        </HoldButton>
      </div>
    </div>
  );
}
