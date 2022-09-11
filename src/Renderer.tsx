import * as PIXI from 'pixi.js';
import * as Honeycomb from 'honeycomb-grid';

import { TICK_INTERVAL_MS } from './config';

import Context from './Context';
import Atom from './Atom';
import Grid, { Hex, hexFactory } from './Grid';
import Simulation from './Simulation';
import CameraController from './CameraController';

class Renderer {
  private context: Context;

  public app: PIXI.Application;

  constructor(context: Context) {
    this.context = context;

    this.app = new PIXI.Application({
      transparent: true,
      antialias: true,
    });

    // I think the 16-bit index bug will be fixed in the next PIXI release.

    const gridGfx = this.renderGrid();
    this.show(gridGfx);

    let atomsGfx: PIXI.Graphics | undefined;
    this.app.ticker.add((delta) => {
      if (atomsGfx) {
        this.hide(atomsGfx);
        atomsGfx.destroy();
      }

      atomsGfx = this.renderAtoms();
      this.show(atomsGfx);

      context.get(CameraController).tick();
    });
  }

  renderGrid() {
    // We could definitely render this with a shader instead of geometry
    // http://glslsandbox.com/e#45065.0
    // https://www.shadertoy.com/view/XdKyDt

    const grid = this.context.get(Grid);

    const gfx = new PIXI.Graphics();
    // gfx.cacheAsBitmap = true;
    gfx.lineStyle(0.1, 0x222222, 1);

    grid.arr.forEach((hex) => {
      if (!hex.shouldRender) {
        return;
      }

      const point = hex.toPoint();
      this.drawHex(gfx, hex, hex.bgColor, 1);
    });

    return gfx;
  }

  renderAtoms() {
    const grid = this.context.get(Grid);
    const atoms = this.context.get(Simulation).atoms;

    const gfx = new PIXI.Graphics();
    gfx.lineStyle(0.1, 0x222222, 1);

    atoms.forEach((b) => {
      const color = b.getColor();
      this.drawHex(gfx, b.hex, color, 1);

      // const start = b.hex.toPoint().add(b.hex.center());
      // const end = b.hex
      //   .add({ x: b.brain.io.LOOK_AT[0], y: b.brain.io.LOOK_AT[1] })
      //   .toPoint()
      //   .add(b.hex.center());
      // gfx.moveTo(start.x, start.y);
      // gfx.lineTo(end.x, end.y);

      // if (b.lookedAt) {
      //   this.drawHex(gfx, b.lookedAt, color, 0.2);
      // }
    });

    return gfx;
  }

  drawHex(gfx: PIXI.Graphics, hex: Hex, color: number, opacity: number) {
    const point = hex.toPoint();
    const corners = hex
      .corners()
      .map((corner: Honeycomb.Point) => corner.add(point));
    const [firstCorner, ...otherCorners] = corners;

    gfx.beginFill(color, opacity);
    gfx.moveTo(firstCorner.x, firstCorner.y);
    otherCorners.forEach(({ x, y }: Honeycomb.Point) => gfx.lineTo(x, y));
    gfx.lineTo(firstCorner.x, firstCorner.y);
    gfx.endFill();
  }

  show(gfx: PIXI.Graphics) {
    this.app.stage.addChild(gfx);
  }

  hide(gfx: PIXI.Graphics) {
    this.app.stage.removeChild(gfx);
  }

  getView() {
    return this.app.view;
  }

  setSize(width: number, height: number) {
    console.log(width, height);
    this.app.renderer.resize(width, height);
  }
}

export default Renderer;
