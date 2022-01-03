import {Type} from 'class-transformer';
import {Plane, Sphere} from './Geometry';
import {Light} from './Light';

export class RaytraceContext {
  @Type(() => Sphere)
  readonly spheres: Sphere[];
  @Type(() => Plane)
  readonly planes: Plane[];
  @Type(() => Light)
  readonly lights: Light[];
  constructor(
    readonly height: number,
    readonly width: number,
    readonly fov: number,
    spheres: Sphere[],
    planes: Plane[],
    lights: Light[],
    readonly options: RaytracerOptions
  ) {
    this.spheres = spheres;
    this.planes = planes;
    this.lights = lights;
  }
}

export interface RaytracerOptions {
  numThreads: number;
  shadows: boolean;
  diffuseLighting: boolean;
  specularLighting: boolean;
  reflections: boolean;
  refractions: boolean;
  maxRecurseDepth: number;
  maxDrawDistance: number;
  bufferDrawCalls: boolean;
  directMemoryTransfer: boolean;
}
