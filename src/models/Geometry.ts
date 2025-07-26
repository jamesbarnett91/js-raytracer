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
  @Type(() => Colour)
  readonly checkerboardColour1: Colour;
  @Type(() => Colour)
  readonly checkerboardColour2: Colour;
  constructor(
    readonly yPos: number,
    readonly width: number, // How far the plane extends into x/-x from 0
    readonly zStartPos: number,
    readonly zEndPos: number,
    readonly checkerboardScale: number,
    checkerboardColour1: Colour,
    checkerboardColour2: Colour
  ) {
    this.checkerboardColour1 = checkerboardColour1;
    this.checkerboardColour2 = checkerboardColour2;
  }

  getMaterialAtPoint(x: number, z: number): Material {
    let colour: Colour;
    // prettier-ignore
    if ((Math.round(this.checkerboardScale * x) + Math.round(this.checkerboardScale * z)) & 1) {
      colour = this.checkerboardColour1;
    } else {
      colour = this.checkerboardColour2;
    }
    return new Material(colour, new Albedo(1, 0, 0, 0), 0, 1);
  }
}
