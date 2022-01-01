import {Vector} from './Vector';

export class Light {
  constructor(readonly position: Vector, readonly intensity: number) {}
}
