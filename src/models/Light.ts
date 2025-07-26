import {Type} from 'class-transformer';
import {Vector} from './Vector';

export class Light {
  @Type(() => Vector)
  readonly position: Vector;
  constructor(position: Vector, readonly intensity: number) {
    this.position = position;
  }
}
