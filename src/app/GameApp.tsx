import { PRODUCT_IDENTITY } from "../content/product";
import { GameScene } from "../components/GameScene";
import { StageSelect } from "../components/StageSelect";
import { useGameController } from "./useGameController";
import "../styles/app.css";

export function GameApp() {
  const controller = useGameController();
  const { state, actions } = controller;

  if (state.phase !== "menu") {
    return <GameScene controller={controller} />;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#route-heading">
        Skip to route
      </a>

      <header className="site-header">
        <a className="brand" href="./" aria-label={`${PRODUCT_IDENTITY.displayName} home`}>
          <span className="brand__mark" aria-hidden="true">
            <i />
            <i />
          </span>
          <span>
            <strong>{PRODUCT_IDENTITY.displayName}</strong>
            <small>{PRODUCT_IDENTITY.tagline}</small>
          </span>
        </a>

        <div className="site-header__meta">
          <span>Browser game</span>
          <span>React + TypeScript</span>
          <details className="control-guide">
            <summary>How to play</summary>
            <div>
              <p>
                Move with A/D, change lanes with W/S, hold Shift to boost, and press E to use water.
              </p>
              <p>Equivalent touch controls appear during every stage.</p>
            </div>
          </details>
        </div>
      </header>

      <main>
        <section className="hero-copy" aria-labelledby="game-title">
          <p className="eyebrow">Freiburg im Breisgau → Lake Constance</p>
          <h1 id="game-title">A route worth earning.</h1>
          <p>{PRODUCT_IDENTITY.pitch}</p>
        </section>

        <StageSelect
          selectedStageIndex={state.stageIndex}
          unlockedStageIndex={state.unlockedStageIndex}
          onSelect={actions.selectStage}
          onStart={actions.start}
        />
      </main>

      <footer className="site-footer">
        <p>Designed and engineered by Ege Tekin · 2026</p>
        <p>Progress stays on this device.</p>
      </footer>
    </div>
  );
}
