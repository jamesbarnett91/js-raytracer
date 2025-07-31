import {Plane, Sphere} from "./Geometry";
import {Light} from "./Light";
import {Albedo, Material} from "./Material";
import {Colour} from "./Colour";
import {Vector} from "./Vector";

export function getScene(): {
  spheres: Sphere[];
  planes: Plane[];
  lights: Light[];
} {
  return {
    spheres: [
      new Sphere(1, new Vector(-6.5, -3, -26), matteMaterial(27, 118, 255)),
      new Sphere(1, new Vector(-14, -3, -25), matteMaterial(146, 80, 188)),
      new Sphere(1, new Vector(-10, -3, -25), matteMaterial(0, 146, 178)),
      new Sphere(1, new Vector(-10, -3, -20), matteMaterial(185, 18, 27)),
      new Sphere(1, new Vector(-2.5, -3, -20), matteMaterial(115, 45, 217)),
      new Sphere(2, new Vector(-10.5, -2, -16), mirrorMaterial()),
      new Sphere(1, new Vector(-3, -3, -16), matteMaterial(247, 178, 173)),
      new Sphere(1, new Vector(-6, -3, -18), matteMaterial(154, 188, 167)),
      new Sphere(1, new Vector(-6, -3, -12), matteMaterial(96, 125, 139)),
      new Sphere(1, new Vector(-9.5, -3, -12), matteMaterial(122, 186, 242)),
      new Sphere(1, new Vector(0, -3, -14), matteMaterial(250, 91, 15)),
      new Sphere(1, new Vector(-3, -3, -11), glassMaterial()),
      new Sphere(1, new Vector(-1, -3, -10), matteMaterial(54, 95, 182)),
      new Sphere(1, new Vector(-4.5, -3, -8), matteMaterial(139, 195, 74)),
      new Sphere(4, new Vector(4, 0, -18), mirrorMaterial()),
      new Sphere(1, new Vector(4, -3, -12), matteMaterial(115, 45, 217)),
      new Sphere(1.5, new Vector(8.5, -2.5, -10), mirrorMaterial()),
      new Sphere(1, new Vector(1, -3, -11.5), matteMaterial(255, 200, 0)),
      new Sphere(1, new Vector(1.2, -3, -8.2), glassMaterial()),
      new Sphere(1, new Vector(4, -3, -7), matteMaterial(244, 67, 54)),
      new Sphere(1, new Vector(5.5, -3, -9.5), matteMaterial(150, 237, 137)),
      new Sphere(1, new Vector(6.5, -3, -15), matteMaterial(14, 234, 255)),
      new Sphere(1, new Vector(10, -3, -16), matteMaterial(171, 71, 188)),
      new Sphere(1, new Vector(11, -3, -20), matteMaterial(190, 189, 191)),
    ],
    planes: [
      new Plane(
        -4,
        50,
        40,
        -45,
        1.5,
        new Colour(116, 101, 87),
        new Colour(92, 78, 70)
      ),
    ],
    lights: [
      new Light(new Vector(30, 50, 40), 2.5),
      new Light(new Vector(-20, 50, -25), 0.5),
    ]
  }
}

function mirrorMaterial(): Material {
  return new Material(
    new Colour(220, 220, 220),
    new Albedo(0.1, 1, 0.8, 0.0),
    2500,
    1
  );
}

function glassMaterial(): Material {
  return new Material(
    new Colour(153, 179, 204),
    new Albedo(0.0, 0.5, 0.1, 0.8),
    125,
    1.5
  );
}

function matteMaterial(r: number, g: number, b: number): Material {
  return new Material(
    new Colour(r, g, b),
    new Albedo(0.4, 0.0, 0.0, 0.0),
    0,
    1
  );
}

function glossMaterial(r: number, g: number, b: number): Material {
  return new Material(
    new Colour(r, g, b),
    new Albedo(0.4, 0.1, 0.05, 0),
    250,
    1
  );
}

