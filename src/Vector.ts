export class Vector {
  constructor(readonly x: number, readonly y: number, readonly z: number) {}

  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  addScalar(n: number): Vector {
    return new Vector(this.x + n, this.y + n, this.z + n);
  }

  subtract(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(n: number): Vector {
    return new Vector(this.x * n, this.y * n, this.z * n);
  }

  dotProduct(v: Vector): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  normalise(): Vector {
    const vecLength = this.norm();
    return new Vector(
      this.x / vecLength,
      this.y / vecLength,
      this.z / vecLength
    );
  }

  norm(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  negative(): Vector {
    return new Vector(-this.x, -this.y, -this.z);
  }
}
