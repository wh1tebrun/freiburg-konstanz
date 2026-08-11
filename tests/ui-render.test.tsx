import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { GameDialog } from "../src/components/GameDialog";
import { GameHud } from "../src/components/GameHud";
import { StageSelect } from "../src/components/StageSelect";
import { createGameState, startGame, stepGame } from "../src/game";

describe("server-rendered interface contracts", () => {
  it("renders an accessible route selector with locked stages", () => {
    const html = renderToStaticMarkup(
      <StageSelect
        selectedStageIndex={0}
        unlockedStageIndex={0}
        onSelect={vi.fn()}
        onStart={vi.fn()}
      />,
    );

    expect(html).toContain("Choose the next stretch.");
    expect(html).toContain("Freiburg Departure");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("not intended for real-world navigation");
  });

  it("exposes distance as a semantic progress bar", () => {
    const state = startGame(createGameState({ populateWorld: false }));
    const html = renderToStaticMarkup(<GameHud state={state} displayScore={0} onPause={vi.fn()} />);

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Stage distance"');
    expect(html).toContain('aria-label="Pause game"');
  });

  it("renders a labelled result dialog after completion", () => {
    const playing = startGame(createGameState({ populateWorld: false }));
    const complete = stepGame({ ...playing, distance: 499.9 }, {}, 1);
    const html = renderToStaticMarkup(
      <GameDialog
        state={complete}
        displayScore={3_500}
        onResume={vi.fn()}
        onRetry={vi.fn()}
        onRoute={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Stage complete");
    expect(html).toContain("Next stage");
  });
});
