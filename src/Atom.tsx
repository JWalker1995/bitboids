import { Hex } from './Grid';

class Atom {
  constructor(public hex: Hex, public mq: number, public mr: number, public charge: number,  public mask: Set<number>) {}

  getColor() {
    const r = this.charge > 0 ? Math.min(Math.floor(Math.log(4 + this.charge) * 64), 255) : 0;
    const g = Math.min(Math.floor(Math.log(this.mask.size) * 64), 255);
    const b = this.charge < 0 ? Math.min(Math.floor(Math.log(4 - this.charge) * 64), 255) : 0;
    return (r << 16) | (g << 8) | (b << 0);
  }
}

export default Atom;
