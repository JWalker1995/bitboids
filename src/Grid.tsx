import * as Honeycomb from 'honeycomb-grid';

import { GRID_RADIUS } from './config';

import Context from './Context';
import MapGenerator from './MapGenerator';
import Atom from './Atom';

const assert = (cond: boolean) => {
  if (!cond) {
    throw new Error(`Assertion failed!`);
  }
};

export const CELL_WALL = 1;
export const CELL_EMPTY = 2;

export const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, 1],
  [1, -1],
];

export type Hex = Honeycomb.Hex<{
  type: typeof CELL_WALL | typeof CELL_EMPTY;
  shouldRender: boolean;
  bgColor: number;

  atom?: Atom;
}>;
export const hexFactory = Honeycomb.extendHex({
  size: 1,
  // origin: {
  //   x: Honeycomb.extendHex({ size: 1 })().width() / 2,
  //   y: Honeycomb.extendHex({ size: 1 })().height() / 2,
  // },

  type: CELL_WALL as (typeof CELL_WALL | typeof CELL_EMPTY),
  shouldRender: false,
  bgColor: 0xffffff,

  atom: undefined,
});

export const swapHexes = (a: Hex, b: Hex) => {
  assert(a.shouldRender);
  assert(b.shouldRender);

  [a.type, b.type] = [b.type, a.type];
  [a.bgColor, b.bgColor] = [b.bgColor, a.bgColor];
  [a.atom, b.atom] = [b.atom, a.atom];

  if (a.atom) {
    assert(a.atom.hex === b);
    a.atom.hex = a;
  }
  if (b.atom) {
    assert(b.atom.hex === a);
    b.atom.hex = b;
  }
};

class Grid {
  public size: number;
  public arr: Honeycomb.Grid<Hex>;

  constructor(context: Context) {
    const radius = GRID_RADIUS + 1;
    const center = hexFactory({ q: radius, r: radius, s: -2 * radius });

    this.size = radius * 2 + 1;
    this.arr = Honeycomb.defineGrid(hexFactory).parallelogram({
      width: this.size,
      height: this.size,
    });

    const mapGenerator = context.get(MapGenerator);

    this.arr.forEach((hex) => {
      const dist = center.distance(hex);

      hex.type =
        dist > GRID_RADIUS || mapGenerator.isWall(hex)
          ? CELL_WALL
          : CELL_EMPTY;
      hex.shouldRender = dist <= GRID_RADIUS + 1;
      hex.bgColor = { [CELL_WALL]: 0x888888, [CELL_EMPTY]: 0xeeeeee }[hex.type];
    });
  }

  getAtIndex(index: number) {
    return this.arr[index]!;
  }

  getAtHex(hex: Hex) {
    return this.getAtIndex(this.getHexIndex(hex));
  }

  getHexIndex(hex: Hex) {
    return hex.q * this.size + hex.r;
  }

  getTowards(
    start: Hex,
    offsetX: number,
    offsetY: number,
    maxDistance: number,
  ) {
    const end = hexFactory(start.x + offsetX, start.y + offsetY);

    const distance = start.distance(end);
    const numSteps = Math.min(distance, maxDistance);
    const step = 1.0 / Math.max(distance, 1);

    let i = 1;
    while (true) {
      const hex = this.getAtHex(start.lerp(end, step * i).round());
      const hitObject = hex.type === CELL_WALL || hex.atom;
      if (hitObject || i >= numSteps) {
        return { start, hex, hitObject };
      }

      i++;
    }
  }
}

export default Grid;
