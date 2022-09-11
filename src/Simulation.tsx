import Context from './Context';
import Grid, { Hex, CELL_EMPTY, CELL_WALL, DIRECTIONS } from './Grid';
import Atom from './Atom';

const assert = (cond: boolean) => {
  if (!cond) {
    throw new Error(`Assertion failed!`);
  }
};

const shuffleInPlace = <T,>(arr: T[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

const hasIntersection = <T,>(a: Set<T>, b: Set<T>): boolean => {
  if (a.size > b.size) {
    return hasIntersection(b, a);
  }
  for (const el of Array.from(a)) {
    if (b.has(el)) {
      return true;
    }
  }
  return false;
};

class Simulation {
  private context: Context;

  public atoms: Atom[] = [];

  constructor(context: Context) {
    this.context = context;

    const makeRandomIndex = () =>
      Math.floor(Math.random() * this.context.get(Grid).arr.length);

    const sampleCharge = () => Math.floor(1 / Math.random() / Math.random()) * Math.sign(Math.random() - 0.5);

    for (let i = 0; i < 10; i++) {
      const hex = this.context.get(Grid).getAtIndex(makeRandomIndex());
      
      const [mq, mr] = DIRECTIONS[Math.floor(Math.random() * 6)];
      
      const charge = sampleCharge();
      
      const mask = new Set<number>();
      mask.add(charge);
      const count = sampleCharge();
      for (let j = 0; j < count; j++) {
        mask.add(sampleCharge());
      }

      this.addAtom(new Atom(hex, mq, mr, charge, mask));
    }
  }

  addAtom(atom: Atom) {
    if (atom.hex.type === CELL_EMPTY && atom.hex.atom === undefined) {
      atom.hex.atom = atom;
      this.atoms.push(atom);
    }
  }

  tick() {
    const grid = this.context.get(Grid);

    shuffleInPlace(this.atoms);

    this.atoms.forEach((a, idx) => {
      assert(a.hex.atom === a);

      assert(a.mask.has(a.charge));
      const emitCharge = Math.floor(1 / Math.random() - 1) * Math.sign(Math.random() - 0.5);
      if (emitCharge && a.mask.has(emitCharge) && a.mask.has(a.charge - emitCharge) && a.charge !== emitCharge * 2) {
        const [mq, mr] = DIRECTIONS[Math.floor(Math.random() * 6)];
        const hex = this.context.get(Grid).getAtIndex((a.hex.q + mq) * grid.size + (a.hex.r + mr));

        if (hex.type === CELL_EMPTY && hex.atom === undefined) {
          const mask = new Set<number>();
          mask.add(emitCharge);

          const emitAtom = new Atom(hex, mq, mr, emitCharge, mask);

          hex.atom = emitAtom;
          this.atoms.push(emitAtom);

          a.mask.delete(emitCharge);
          a.charge -= emitCharge;
          // assert(a.mask.has(a.charge));
        }
      }

      const newIndex = (a.hex.q + a.mq) * grid.size + (a.hex.r + a.mr);
      const dst = grid.getAtIndex(newIndex);
      if (dst.type === CELL_WALL) {
        a.mq = -a.mq;
        a.mr = -a.mr;
      } else if (dst.atom) {
        const sumCharge = a.charge + dst.atom.charge;
        const canJoin = (a.mask.has(sumCharge) || dst.atom.mask.has(sumCharge)) && !hasIntersection(a.mask, dst.atom.mask);
        if (canJoin) {
          a.mask.forEach(i => dst.atom!.mask.add(i));
          dst.atom.charge = sumCharge;
          // assert(dst.atom.mask.has(dst.atom.charge));
          a.hex.atom = undefined;

          // Idx could have changed if we removed other atoms prior.
          idx = this.atoms.lastIndexOf(a, idx);
          assert(idx !== -1);
          this.atoms.splice(idx, 1);
        } else {
          a.mq = -a.mq;
          a.mr = -a.mr;
        }
      } else {
        a.hex.atom = undefined;
        dst.atom = a;
        a.hex = dst;
      }
    });

    /*
    const obstruction = {} as Boid;
    const obstructedHexes: Hex[] = [];

    this.boids.forEach((b) => {
      assert(b.hex.boid === b);
      b.hex.boid = undefined;
    });

    this.boids.forEach((b) => {
      b.prevHex = b.hex;
    });

    const rollbackBoid = (b: Boid) => {
      if (b.hex !== b.prevHex) {
        if (b.prevHex.boid) {
          rollbackBoid(b.prevHex.boid);
        }
        b.hex = b.prevHex;
      }

      b.prevHex.boid = b;
    };

    this.boids.forEach((b) => {
      if (
        isFinite(b.brain.io.MOVE_TOWARDS[0]) &&
        isFinite(b.brain.io.MOVE_TOWARDS[1])
      ) {
        const moveTo = grid.getTowards(
          b.hex,
          b.brain.io.MOVE_TOWARDS[0],
          b.brain.io.MOVE_TOWARDS[1],
          1,
        );

        if (moveTo.hex === b.hex) {
          b.restingTicks++;
        } else {
          b.restingTicks = 0;
        }

        if (moveTo.hex.type === CELL_WALL) {
          rollbackBoid(b);
        } else if (moveTo.hex.boid) {
          if (moveTo.hex.boid !== obstruction) {
            rollbackBoid(moveTo.hex.boid);

            moveTo.hex.boid = obstruction;
            obstructedHexes.push(moveTo.hex);
          }

          rollbackBoid(b);
        } else {
          moveTo.hex.boid = b;
          b.hex = moveTo.hex;
        }
      } else {
        rollbackBoid(b);
      }
    });

    this.boids.forEach((b) => b.brain.tick());

    // This could also perhaps be at the beginning
    this.boids.forEach((b) => {
      if (isFinite(b.brain.io.LOOK_AT[0]) && isFinite(b.brain.io.LOOK_AT[1])) {
        const las =
          LOOK_DISTANCE /
          Math.sqrt(
            b.brain.io.LOOK_AT[0] * b.brain.io.LOOK_AT[0] +
              b.brain.io.LOOK_AT[1] * b.brain.io.LOOK_AT[1],
          );

        const lookRes = grid.getTowards(
          b.hex,
          b.brain.io.LOOK_AT[0] * las,
          b.brain.io.LOOK_AT[1] * las,
          Infinity,
        );
        b.lookedAt = lookRes.hex;

        b.brain.io.SAW_OBJECT = lookRes.hitObject;
        b.brain.io.SAW_OFFSET = [
          lookRes.hex.x - lookRes.start.x,
          lookRes.hex.y - lookRes.start.y,
        ];

        if (lookRes.hex.type === CELL_WALL) {
          b.brain.io.SAW_ITEM = 'ITEM_WALL';
        } else if (lookRes.hex.boid) {
          b.brain.io.SAW_ITEM = 'ITEM_BOID';
          b.brain.io.SAW_COLOR = [...lookRes.hex.boid.brain.io.COLOR];
          b.brain.io.SAW_MOVEMENT = [...lookRes.hex.boid.brain.io.MOVE_TOWARDS];
        } else if (lookRes.hex.food) {
          b.brain.io.SAW_ITEM = 'ITEM_FOOD';
          b.brain.io.SAW_FOOD = lookRes.hex.food;
        } else {
          b.brain.io.SAW_ITEM = 'ITEM_EMPTY';
        }
      }
    });

    obstructedHexes.forEach((hex) => (hex.boid = undefined));

    */
  }
}

export default Simulation;
