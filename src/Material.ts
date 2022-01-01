import {Colour} from './Colour';

export class Material {
  constructor(
    readonly diffuseColour: Colour,
    readonly diffuseAlbedo: number,
    readonly specularAlbedo: number,
    readonly reflectionAlbedo: number,
    readonly specularExponent: number
  ) {}
}
