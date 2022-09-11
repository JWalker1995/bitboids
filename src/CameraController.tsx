import * as PIXI from 'pixi.js';
import * as Honeycomb from 'honeycomb-grid';

import Context from './Context';
import Renderer from './Renderer';
import Grid, { hexFactory, Hex, swapHexes } from './Grid';
import Atom from './Atom';

const assert = (cond: boolean) => {
  if (!cond) {
    throw new Error(`Assertion failed!`);
  }
};

class CameraController {
  private context: Context;

  private keys: { [key: string]: boolean } = {};

  private scale: number = 10.0;
  private dx: number;
  private dy: number;

  private selectCallbacks: ((hex: Hex | Atom | undefined) => void)[] = [];

  constructor(context: Context) {
    this.context = context;

    window.addEventListener('keydown', (e) => (this.keys[e.key] = true), false);
    window.addEventListener('keyup', (e) => (this.keys[e.key] = false), false);

    const view = this.context.get(Renderer).app.view;
    const stage = this.context.get(Renderer).app.stage;
    stage.interactive = true;

    const bounds = stage.getBounds();
    this.dx = 0.5 * view.width - (bounds.x + 0.5 * bounds.width) * this.scale;
    this.dy = 0.5 * view.height - (bounds.y + 0.5 * bounds.height) * this.scale;

    const getHexAt = (e: PIXI.InteractionEvent) => {
      const { x, y } = e.data.global;
      let hex: Hex | undefined = Honeycomb.defineGrid(hexFactory).pointToHex(
        (x - this.dx) / this.scale,
        (y - this.dy) / this.scale,
      );
      hex = this.context.get(Grid).getAtHex(hex);
      hex = hex && hex.shouldRender ? hex : undefined;
      return hex;
    };

    let startDrag: Hex | undefined;
    let selected: Atom | undefined;

    stage.on('mousemove', (e: PIXI.InteractionEvent) => {
      const hex = getHexAt(e);
      if (!selected) {
        this.selectCallbacks.forEach((cb) => cb(hex));
      }
      if (startDrag && hex && hex !== startDrag) {
        swapHexes(startDrag, hex);
        startDrag = hex;
      }
    });
    stage.on('mousedown', (e: PIXI.InteractionEvent) => {
      const hex = getHexAt(e);
      this.selectCallbacks.forEach((cb) => cb(hex));
      startDrag = hex;
    });
    stage.on('mouseup', (e: PIXI.InteractionEvent) => {
      const hex = getHexAt(e);
      if (hex && hex === startDrag) {
        // Clicked on hex
        startDrag = undefined;
        if (hex.atom) {
          selected = hex.atom;
          this.selectCallbacks.forEach((cb) => cb(selected));
        } else {
          selected = undefined;
          this.selectCallbacks.forEach((cb) => cb(hex));
        }
      } else {
        this.selectCallbacks.forEach((cb) => cb(hex));
      }
    });

    const scrollHandler = (e: any) => {
      let value: number;
      if (e.detail) {
        if (e.wheelDelta) {
          // Opera
          value = (e.wheelDelta / e.detail / 40) * (e.detail > 0 ? 1 : -1);
        } else {
          // Firefox
          value = -e.detail / 3;
        }
      } else {
        // IE,Safari,Chrome
        value = e.wheelDelta / 120;
      }

      const { x, y } = e;
      const factor = Math.exp(value * 0.1);

      // (x - this.dx) / this.scale === (x - (this.dx + ddx)) / (this.scale * factor)
      this.dx += (x - this.dx) * (1 - factor);
      this.dy += (y - this.dy) * (1 - factor);

      this.scale *= factor;
    };
    view.addEventListener('mousewheel', scrollHandler, { passive: false });
    view.addEventListener('DOMMouseScroll', scrollHandler, { passive: false });
  }

  tick() {
    if (this.keys.ArrowLeft) {
      this.dx += 8.0;
    }
    if (this.keys.ArrowRight) {
      this.dx -= 8.0;
    }
    if (this.keys.ArrowUp) {
      this.dy += 8.0;
    }
    if (this.keys.ArrowDown) {
      this.dy -= 8.0;
    }

    const stage = this.context.get(Renderer).app.stage;
    stage.x = this.dx;
    stage.y = this.dy;

    stage.scale.set(this.scale, this.scale);
  }

  onSelect(cb: (hex: Hex | Atom | undefined) => void) {
    this.selectCallbacks.push(cb);
  }

  offSelect(cb: (hex: Hex | Atom | undefined) => void) {
    const index = this.selectCallbacks.indexOf(cb);
    assert(index !== -1);
    this.selectCallbacks.splice(index, 1);
  }
}

export default CameraController;
