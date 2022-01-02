import {Type} from 'class-transformer';
import {Colour} from './Colour';

export class Material {
  @Type(() => Colour)
  readonly diffuseColour: Colour;
  constructor(
    diffuseColour: Colour,
    readonly diffuseAlbedo: number,
    readonly specularAlbedo: number,
    readonly reflectionAlbedo: number,
    readonly specularExponent: number
  ) {
    this.diffuseColour = diffuseColour;
  }
}
