import {Type} from 'class-transformer';
import {Colour} from './Colour';
import {Albedo, Material} from './Material';
import {Vector} from './Vector';

export class Sphere {
  @Type(() => Vector)
  readonly centerPoint: Vector;
  @Type(() => Material)
  readonly material: Material;
  constructor(
    readonly radius: number,
    centerPoint: Vector,
    material: Material
  ) {
    this.centerPoint = centerPoint;
    this.material = material;
  }
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
    // prettier-ignore
    if ((Math.round(this.checkerboardScale * x) + Math.round(this.checkerboardScale * z)) & 1) {
      colour = new Colour(15, 15, 15);
    } else {
      colour = new Colour(200, 200, 200);
    }
    return new Material(colour, new Albedo(1, 0, 0, 0), 0, 1);
  }
}
