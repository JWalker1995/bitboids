import React from 'react';

import Context from './Context';
import SceneContainer from './SceneContainer';
import Simulation from './Simulation';
import { Hex, CELL_EMPTY, CELL_WALL } from './Grid';
import Atom from './Atom';
import CameraController from './CameraController';

let targSteps = 0.0;
const context = new Context();

const Divider = () => (
  <hr
    style={{
      boxShadow: 'silver 0px 0px 2px 1px',
      border: 'none',
      margin: '16px 8px',
    }}
  />
);

const App = () => {
  const stepsRef = React.useRef(0);
  const [steps, setSteps] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [selected, setSelected] = React.useState<Hex | Atom | undefined>(
    undefined,
  );
  const hex = selected instanceof Atom ? selected.hex : selected;

  React.useEffect(() => {
    if (playing) {
      const time = Math.max(0.01, 1 / speed);
      const iv = setInterval(() => {
        targSteps += time * speed;
        while (stepsRef.current < targSteps) {
          context.get(Simulation).tick();
          stepsRef.current += 1;
        }
        setSteps(stepsRef.current);
      }, 1000 * time);
      return () => clearInterval(iv);
    }
  }, [playing, speed]);

  React.useEffect(() => {
    context.get(CameraController).onSelect(setSelected);
    return () => context.get(CameraController).offSelect(setSelected);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: '50px',
          backgroundColor: 'white',
          boxShadow: '0 0 8px 0 gray',
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            margin: '0px 16px',
            fontSize: '20px',
            verticalAlign: 'middle',
          }}
        >
          Game of Boids
        </h1>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SceneContainer context={context} />
        <div
          style={{
            width: '250px',
            backgroundColor: '#eeeeee',
            boxShadow: '0 0 8px 0 gray',
            zIndex: 2,
            padding: '8px',
            // whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div><strong>Steps:</strong> {steps}</div>
          <Divider />
          <div style={{ display: 'flex' }}>
            <button style={{ flex: 1 }} onClick={() => setPlaying(!playing)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              style={{ flex: 1 }}
              onClick={() => {
                context.get(Simulation).tick();
                stepsRef.current += 1;
                setSteps(stepsRef.current);
              }}
            >
              Step
            </button>
          </div>
          <div style={{ display: 'flex' }}>
            <button
              style={{ flex: 1 }}
              onClick={() => setSpeed(1)}
              disabled={speed === 1}
            >
              1x
            </button>
            <button
              style={{ flex: 1 }}
              onClick={() => setSpeed(4)}
              disabled={speed === 4}
            >
              4x
            </button>
            <button
              style={{ flex: 1 }}
              onClick={() => setSpeed(16)}
              disabled={speed === 16}
            >
              16x
            </button>
          </div>
          <div style={{ display: 'flex' }}>
            <button
              style={{ flex: 1 }}
              onClick={() => setSpeed(64)}
              disabled={speed === 64}
            >
              64x
            </button>
            <button
              style={{ flex: 1 }}
              onClick={() => setSpeed(256)}
              disabled={speed === 256}
            >
              256x
            </button>
            <button
              style={{ flex: 1 }}
              onClick={() => setSpeed(1024)}
              disabled={speed === 1024}
            >
              1024x
            </button>
          </div>
          <Divider />
          {hex && (
            <>
              <div>
                <strong>(q,r,s)</strong>
                {': '}
                {`(${hex.q},${hex.r},${hex.s})`}
              </div>
              <div>
                <strong>type</strong>
                {': '}
                {
                  { [CELL_EMPTY]: 'CELL_EMPTY', [CELL_WALL]: 'CELL_WALL' }[
                    hex.type
                  ]
                }
              </div>
              {hex.atom && (
                <>
                  <Divider />
                  <ul style={{overflow: 'auto', margin: 0}}>
                    {Array.from(hex.atom.mask).sort((a, b) => a - b).map(i => i === hex.atom!.charge ? <li key={i}><strong>{`${i} <<<`}</strong></li> : <li key={i}>{i}</li>)}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
