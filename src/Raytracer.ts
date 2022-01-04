import {Colour} from './Colour';
import {Plane, Sphere} from './Geometry';
import {Albedo, Material} from './Material';
import {RaytraceContext} from './RaytraceContext';
import {Vector} from './Vector';

import {plainToInstance} from 'class-transformer';
import 'reflect-metadata';

self.onmessage = ({data}) => {
  if (data.type === 'raytraceStart') {
    const serialisedContext: Object = JSON.parse(data.context);
    const context = plainToInstance(RaytraceContext, serialisedContext);

    const raytracer = new Raytracer(
      data.rowStartIndex,
      data.rowEndIndex,
      context
    );

    raytracer.process();
    self.close();
  }
};

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

class Raytracer {
  constructor(
    readonly rowStartIndex: number,
    readonly rowEndIndex: number,
    readonly context: RaytraceContext
  ) {}

  process() {
    for (let y = this.rowStartIndex; y <= this.rowEndIndex; y++) {
      const resultBuffer = new Uint8ClampedArray(3 * this.context.width);

      for (let x = 0; x < this.context.width; x++) {
        const rayX = x + 0.5 - this.context.width / 2;
        const rayY = -(y + 100) + this.context.height / 2;
        const rayZ =
          -this.context.height / (2 * Math.tan(this.context.fov / 2));
        const rayDirection = new Vector(rayX, rayY, rayZ).normalise();
        const ray = new Ray(new Vector(0, 0, 0), rayDirection);

        const pixelValue = this.raytrace(ray);

        const buffIdx = x * 3;
        resultBuffer[buffIdx] = pixelValue.r;
        resultBuffer[buffIdx + 1] = pixelValue.g;
        resultBuffer[buffIdx + 2] = pixelValue.b;
      }

      if (this.context.options.directMemoryTransfer) {
        // prettier-ignore
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        self.postMessage({type: 'raytraceResultRow', rowIndex: y, resultBuffer: resultBuffer.buffer}, [resultBuffer.buffer]);
      } else {
        self.postMessage({
          type: 'raytraceResultRow',
          resultBuffer: resultBuffer.buffer,
          rowIndex: y,
        });
      }
    }

    self.postMessage({type: 'raytraceComplete'});
  }

  private raytrace(ray: Ray, recursionDepth = 0): Colour {
    const result = this.processSceneGeometry(ray);

    if (
      recursionDepth > this.context.options.maxRecurseDepth ||
      !result.geometryHit
    ) {
      return this.context.backgroundColour;
    }

    let reflectionColour = new Colour(0, 0, 0);
    if (this.context.options.reflections) {
      const reflectionDirection = this.calculateReflectionVector(
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

    let refractionColour = new Colour(0, 0, 0);
    if (this.context.options.refractions) {
      const refractionDirection = this.calculateRefractionVector(
        ray.direction,
        result.normal,
        result.material.refractiveIndex
      );
      let refractionOrigin: Vector;
      if (refractionDirection.dotProduct(result.normal) < 0) {
        refractionOrigin = result.hitPoint.subtract(
          result.normal.multiply(0.001)
        );
      } else {
        refractionOrigin = result.hitPoint.add(result.normal.multiply(0.001));
      }
      refractionColour = this.raytrace(
        new Ray(refractionOrigin, refractionDirection),
        ++recursionDepth
      );
    }

    return this.processLighting(
      result,
      ray.direction,
      reflectionColour,
      refractionColour
    );
  }

  private processSceneGeometry(ray: Ray): RayTraceResult {
    let geometryDistance = 99999;
    let hitPoint = new Vector(0, 0, 0);
    let normal = new Vector(0, 0, 0);
    let material = new Material(
      new Colour(0, 0, 0),
      new Albedo(0, 0, 0, 0),
      0,
      0
    );

    this.context.spheres.forEach(sphere => {
      const result = this.intersectSphere(ray, sphere);

      if (result.geometryHit && result.rayDistance < geometryDistance) {
        geometryDistance = result.rayDistance;
        hitPoint = ray.origin.add(ray.direction.multiply(result.rayDistance));
        normal = hitPoint.subtract(sphere.centerPoint).normalise();
        material = sphere.material;
      }
    });

    this.context.planes.forEach(plane => {
      const result = this.intersectPlane(ray, plane);

      if (result.geometryHit && result.rayDistance < geometryDistance) {
        geometryDistance = result.rayDistance;
        hitPoint = ray.origin.add(ray.direction.multiply(result.rayDistance));
        normal = new Vector(0, 1, 0);
        material = plane.getMaterialAtPoint(hitPoint.x, hitPoint.z);
      }
    });

    const geometryHit = geometryDistance < this.context.options.maxDrawDistance;

    return new RayTraceResult(geometryHit, hitPoint, normal, material);
  }

  private processLighting(
    result: RayTraceResult,
    direction: Vector,
    reflectionColour: Colour,
    refractionColour: Colour
  ): Colour {
    let diffuseLightIntensity = 0;
    let specularLightIntensity = 0;

    this.context.lights.forEach(light => {
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
              this.calculateReflectionVector(
                lightDirection,
                result.normal
              ).dotProduct(direction)
            ),
            result.material.specularExponent
          ) * light.intensity;
      }
    });

    let rgbVector = result.material.diffuseColour
      .toVector()
      .multiply(result.material.albedo.diffuseAlbedo);

    if (this.context.options.diffuseLighting) {
      rgbVector = rgbVector.multiply(diffuseLightIntensity);
    }

    if (this.context.options.specularLighting) {
      const totalSpecularIntensity = new Vector(255, 255, 255)
        .multiply(specularLightIntensity)
        .multiply(result.material.albedo.specularAlbedo);

      rgbVector = rgbVector.add(totalSpecularIntensity);
    }

    if (this.context.options.reflections) {
      rgbVector = rgbVector.add(
        reflectionColour.multiply(result.material.albedo.reflectionAlbedo)
      );
    }

    if (this.context.options.refractions) {
      rgbVector = rgbVector.add(
        refractionColour.multiply(result.material.albedo.refractionAlbedo)
      );
    }

    return Colour.fromVector(rgbVector);
  }

  private calculateReflectionVector(
    incidentAngle: Vector,
    surfaceNormal: Vector
  ): Vector {
    // v2 = v1 – 2(v1.n)n https://bocilmania.com/2018/04/21/how-to-get-reflection-vector/
    return incidentAngle.subtract(
      surfaceNormal
        .multiply(2)
        .multiply(incidentAngle.dotProduct(surfaceNormal))
    );
  }

  private calculateRefractionVector(
    incidentAngle: Vector,
    surfaceNormal: Vector,
    refractiveIndex: number
  ): Vector {
    // See https://en.wikipedia.org/wiki/Snell's_law#Vector_form
    let cosIncidenceAngle = -Math.max(
      -1,
      Math.min(1, incidentAngle.dotProduct(surfaceNormal))
    );
    let n1 = 1;
    let n2 = refractiveIndex;

    let normal = surfaceNormal;
    if (cosIncidenceAngle < 0) {
      cosIncidenceAngle = -cosIncidenceAngle;
      n1 = refractiveIndex;
      n2 = 1;
      normal = surfaceNormal.negative();
    }

    const r = n1 / n2;
    const cosRefractedAngle = Math.sqrt(
      1 - r * r * (1 - cosIncidenceAngle * cosIncidenceAngle)
    );

    if (cosRefractedAngle * cosRefractedAngle < 0) {
      return new Vector(0, 0, 0);
    } else {
      return incidentAngle
        .multiply(r)
        .add(normal.multiply(r * cosIncidenceAngle - cosRefractedAngle));
    }
  }

  private isShadowCast(
    lightDirection: Vector,
    lightDistance: number,
    result: RayTraceResult
  ): boolean {
    if (!this.context.options.shadows) {
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
