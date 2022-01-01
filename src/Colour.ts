import {Vector} from './Vector';

export class Colour extends Vector {
  constructor(readonly r: number, readonly g: number, readonly b: number) {
    super(r, g, b);
  }

  static fromVector(vector: Vector): Colour {
    return new Colour(vector.x, vector.y, vector.z);
  }

  toVector(): Vector {
    return new Vector(this.r, this.g, this.b);
  }
}
