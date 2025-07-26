import {Type} from 'class-transformer';
import {Colour} from './Colour';

export class Material {
  @Type(() => Colour)
  readonly diffuseColour: Colour;
  @Type(() => Albedo)
  readonly albedo: Albedo;
  constructor(
    diffuseColour: Colour,
    albedo: Albedo,
    readonly specularExponent: number,
    readonly refractiveIndex: number
  ) {
    this.diffuseColour = diffuseColour;
    this.albedo = albedo;
  }
}

export class Albedo {
  constructor(
    readonly diffuseAlbedo: number,
    readonly specularAlbedo: number,
    readonly reflectionAlbedo: number,
    readonly refractionAlbedo: number
  ) {}
}
