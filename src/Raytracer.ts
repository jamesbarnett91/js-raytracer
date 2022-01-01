import {Colour} from './Colour';
import {Framebuffer} from './Framebuffer';
import {Plane, Sphere} from './Geometry';
import {Light} from './Light';
import {Material} from './Material';
import {Vector} from './Vector';

class Ray {
  constructor(readonly origin: Vector, readonly direction: Vector) {}
}

class RayTraceResult {
  constructor(
    readonly geometryHit: boolean,
    readonly hitPoint: Vector,
    readonly normal: Vector,
    readonly material: Material
  ) {}
}

class RayIntersectionResult {
  constructor(readonly geometryHit: boolean, readonly rayDistance: number) {}
}

export interface RaytracerOptions {
  shadows: boolean;
  diffuseLighting: boolean;
  specularLighting: boolean;
  reflections: boolean;
  maxRecurseDepth: number;
  maxDrawDistance: number;
}

export class Raytracer {
  constructor(
    readonly framebuffer: Framebuffer,
    readonly fov: number,
    readonly spheres: Sphere[],
    readonly planes: Plane[],
    readonly lights: Light[],
    readonly options: RaytracerOptions
  ) {}

  render() {
    const height = this.framebuffer.height;
    const width = this.framebuffer.width;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const rayX = x + 0.5 - width / 2;
        const rayY = -(y + 0.5) + height / 2;
        const rayZ = -height / (2 * Math.tan(this.fov / 2));
        const rayDirection = new Vector(rayX, rayY, rayZ).normalise();
        const ray = new Ray(new Vector(0, 0, 0), rayDirection);

        const pixelValue = this.raytrace(ray);

        this.framebuffer.writePixelAt(x, y, pixelValue);
      }
    }

    this.framebuffer.flush();
  }

  private raytrace(ray: Ray, recursionDepth = 0): Colour {
    const result = this.processSceneGeometry(ray);

    if (recursionDepth > this.options.maxRecurseDepth || !result.geometryHit) {
      // No hit, show background colour
      // return new Colour(50, 178, 203);
      // return new Colour(150, 150, 150);
      return new Colour(0, 128, 128);
    }

    let reflectionColour = new Colour(0, 0, 0);
    if (this.options.reflections) {
      const reflectionDirection = this.calculateReflection(
        ray.direction,
        result.normal
      );
      let reflectionOrigin: Vector;
      if (reflectionDirection.dotProduct(result.normal) < 0) {
        reflectionOrigin = result.hitPoint.subtract(
          result.normal.multiply(0.001)
        );
      } else {
        reflectionOrigin = result.hitPoint.add(result.normal.multiply(0.001));
      }
      reflectionColour = this.raytrace(
        new Ray(reflectionOrigin, reflectionDirection),
        ++recursionDepth
      );
    }

    return this.processLighting(result, ray.direction, reflectionColour);
  }

  private processSceneGeometry(ray: Ray): RayTraceResult {
    let geometryDistance = 99999;
    let hitPoint = new Vector(0, 0, 0);
    let normal = new Vector(0, 0, 0);
    let material = new Material(new Colour(0, 0, 0), 0, 0, 0, 0);

    this.spheres.forEach(sphere => {
      const result = this.intersectSphere(ray, sphere);

      if (result.geometryHit && result.rayDistance < geometryDistance) {
        geometryDistance = result.rayDistance;
        hitPoint = ray.origin.add(ray.direction.multiply(result.rayDistance));
        normal = hitPoint.subtract(sphere.centerPoint).normalise();
        material = sphere.material;
      }
    });

    this.planes.forEach(plane => {
      const result = this.intersectPlane(ray, plane);

      if (result.geometryHit && result.rayDistance < geometryDistance) {
        geometryDistance = result.rayDistance;
        hitPoint = ray.origin.add(ray.direction.multiply(result.rayDistance));
        normal = new Vector(0, 1, 0);
        material = plane.getMaterialAtPoint(hitPoint.x, hitPoint.z);
      }
    });

    const geometryHit = geometryDistance < this.options.maxDrawDistance;

    return new RayTraceResult(geometryHit, hitPoint, normal, material);
  }

  private processLighting(
    result: RayTraceResult,
    direction: Vector,
    reflectionColour: Colour
  ): Colour {
    let diffuseLightIntensity = 0;
    let specularLightIntensity = 0;

    this.lights.forEach(light => {
      const lightDirection = light.position
        .subtract(result.hitPoint)
        .normalise();
      const lightDistance = light.position.subtract(result.hitPoint).norm();

      if (!this.isShadowCast(lightDirection, lightDistance, result)) {
        diffuseLightIntensity +=
          light.intensity *
          Math.max(0, lightDirection.dotProduct(result.normal));

        specularLightIntensity +=
          Math.pow(
            Math.max(
              0,
              this.calculateReflection(
                lightDirection,
                result.normal
              ).dotProduct(direction)
            ),
            result.material.specularExponent
          ) * light.intensity;
      }
    });

    let rgbVector = result.material.diffuseColour.toVector();

    if (this.options.diffuseLighting) {
      rgbVector = rgbVector.multiply(diffuseLightIntensity);
    }

    if (this.options.specularLighting) {
      const totalSpecularIntensity = new Vector(255, 255, 255)
        .multiply(specularLightIntensity)
        .multiply(result.material.specularAlbedo);

      rgbVector = rgbVector
        .multiply(result.material.diffuseAlbedo)
        .add(totalSpecularIntensity);
    }

    if (this.options.reflections) {
      rgbVector = rgbVector.add(
        reflectionColour.multiply(result.material.reflectionAlbedo)
      );
    }

    return Colour.fromVector(rgbVector);
  }

  private calculateReflection(
    incidentAngle: Vector,
    surfaceNormal: Vector
  ): Vector {
    // I - N*2.f*(I*N);
    // v2 = v1 – 2(v1.n)n https://bocilmania.com/2018/04/21/how-to-get-reflection-vector/
    return incidentAngle.subtract(
      surfaceNormal
        .multiply(2)
        .multiply(incidentAngle.dotProduct(surfaceNormal))
    );
  }

  private isShadowCast(
    lightDirection: Vector,
    lightDistance: number,
    result: RayTraceResult
  ): boolean {
    if (!this.options.shadows) {
      return false;
    }

    let shadowOrigin: Vector;

    if (lightDirection.dotProduct(result.normal) < 0) {
      shadowOrigin = result.hitPoint.subtract(result.normal.multiply(0.001));
    } else {
      shadowOrigin = result.hitPoint.add(result.normal.multiply(0.001));
    }

    const shadowTrace = this.processSceneGeometry(
      new Ray(shadowOrigin, lightDirection)
    );

    return (
      shadowTrace.geometryHit &&
      shadowTrace.hitPoint.subtract(shadowOrigin).norm() < lightDistance
    );
  }

  private intersectSphere(ray: Ray, sphere: Sphere): RayIntersectionResult {
    // See https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-sphere-intersection
    // for an explanation of the variables

    const l = sphere.centerPoint.subtract(ray.origin);
    const tca = l.dotProduct(ray.direction);
    const d2 = l.dotProduct(l) - tca * tca;

    if (d2 > sphere.radius * sphere.radius) {
      return new RayIntersectionResult(false, 0);
    }

    const thc = Math.sqrt(sphere.radius * sphere.radius - d2);

    const t0 = tca - thc;
    const t1 = tca + thc;

    if (t0 >= 0) {
      return new RayIntersectionResult(true, t0);
    } else if (t1 >= 0) {
      return new RayIntersectionResult(true, t1);
    } else {
      return new RayIntersectionResult(false, 0);
    }
  }

  private intersectPlane(ray: Ray, plane: Plane): RayIntersectionResult {
    if (Math.abs(ray.direction.y) > 0.001) {
      const distance = -(ray.origin.y + -plane.yPos) / ray.direction.y;
      const hitPoint = ray.origin.add(ray.direction.multiply(distance));
      if (
        distance > 0 &&
        Math.abs(hitPoint.x) < plane.width &&
        hitPoint.z < plane.zStartPos &&
        hitPoint.z > plane.zEndPos
      ) {
        return new RayIntersectionResult(true, distance);
      } else {
        return new RayIntersectionResult(false, 0);
      }
    } else {
      return new RayIntersectionResult(false, 0);
    }
  }
}