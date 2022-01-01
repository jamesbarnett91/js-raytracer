import {Colour} from './Colour';
import {Material} from './Material';
import {Vector} from './Vector';

export class Sphere {
  constructor(
    readonly centerPoint: Vector,
    readonly radius: number,
    readonly material: Material
  ) {}
}

export class Plane {
  constructor(
    readonly yPos: number,
    readonly width: number, // How far the plane extends into x/-x from 0
    readonly zStartPos: number,
    readonly zEndPos: number,
    readonly checkerboardScale: number
  ) {}

  getMaterialAtPoint(x: number, z: number): Material {
    let colour: Colour;
    if ((Math.round(this.checkerboardScale * x) + Math.round(this.checkerboardScale * z)) & 1) {
      colour = new Colour(15, 15, 15);
    } else {
      colour = new Colour(200, 200, 200);
    }
    return new Material(colour, 1, 0, 0, 0);
  }
}
