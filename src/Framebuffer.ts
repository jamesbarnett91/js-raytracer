export class Framebuffer {
  readonly width: number;
  readonly height: number;
  readonly canvasContext: CanvasRenderingContext2D;
  readonly canvasImageData: ImageData;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    const canvas = document.getElementById(
      'render-output'
    ) as HTMLCanvasElement;

    canvas.width = this.width;
    canvas.height = this.height;

    this.canvasContext = canvas.getContext('2d')!;
    this.canvasImageData = this.canvasContext.createImageData(
      this.width,
      this.height
    );
  }

  writePixelAt(x: number, y: number, r: number, g: number, b: number) {
    const startIdx = (y * this.width + x) * 4;
    this.canvasImageData.data[startIdx] = r;
    this.canvasImageData.data[startIdx + 1] = g;
    this.canvasImageData.data[startIdx + 2] = b;
    this.canvasImageData.data[startIdx + 3] = 255; // No A
  }

  flush() {
    this.canvasContext.putImageData(this.canvasImageData, 0, 0);
  }
}
