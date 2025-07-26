import {Framebuffer} from './Framebuffer';
import {RaytraceContext} from './models/RaytraceContext';
import {instanceToPlain} from 'class-transformer';
import 'reflect-metadata';
import {Logger} from './Logger';
import {FrameChunk} from "./models/FrameChunk";
import {Colour} from "./models/Colour";

export class RaytraceDispatcher {
  private readonly renderStartMs: number;
  private readonly contextJson: String;
  private readonly chunks: FrameChunk[];
  private readonly raytraceWorkers: Worker[];
  private nextChunkIndex = 0;
  private completedWorkers = 0;
  private chunkBorderWidth = 1;

  constructor(
    readonly framebuffer: Framebuffer,
    readonly context: RaytraceContext,
    readonly logger: Logger,
    readonly onComplete: Function
  ) {
    this.renderStartMs = new Date().getTime();
    this.contextJson = JSON.stringify(instanceToPlain(context))
    this.chunks = [];
    this.raytraceWorkers = [];
  }

  requestRender() {
    let chunkHeight, chunkWidth;

    if (this.context.height <= 720) {
      chunkHeight = 64;
      chunkWidth = 64;
      this.chunkBorderWidth = 2;
    } else {
      chunkHeight = 128;
      chunkWidth = 128;
      this.chunkBorderWidth = 5;
    }

    // Process scene into chunks
    for (let y = 0; y < this.context.height; y+= chunkHeight) {
      for (let x = 0 ; x < this.context.width; x+= chunkWidth) {
        this.chunks.push(new FrameChunk(x, y, chunkWidth, chunkHeight));
      }
    }
    this.logger.log(`Scene split into ${this.chunks.length} chunks of ${chunkWidth}x${chunkHeight}`);

    // Spawn worker threads
    for (let n = 0; n < this.context.options.numThreads; n++) {
      const worker = new Worker(new URL('./Raytracer.ts', import.meta.url));
      worker.onmessage = (event) => { this.onMessageHandler(worker, event) };
      this.raytraceWorkers.push(worker);
    }
    this.logger.log(`Spawned ${this.context.options.numThreads} render threads`);

    // Start raytrace
    for (let worker of this.raytraceWorkers) {
      this.raytraceNextChunk(worker);
    }
  }

  private raytraceNextChunk(worker: Worker) {
    const chunkIndex = this.nextChunkIndex++;
    let chunk = this.chunks[chunkIndex];
    this.drawChunkBorder(chunk, this.chunkBorderWidth);
    worker.postMessage({
      type: 'raytraceStart',
      chunk: chunk,
      chunkIndex: chunkIndex,
      context: this.contextJson,
    });
  }

  private onMessageHandler(worker: Worker, message: MessageEvent) {
    if (message.data.type === 'raytraceComplete') {
      this.writeChunkToFramebuffer(message.data.chunkIndex, message.data.resultBuffer);
    }

    // Queue next work if available
    if (this.nextChunkIndex < this.chunks.length) {
      this.raytraceNextChunk(worker);
    } else {
      worker.terminate();
      this.completedWorkers++;
    }

    if (this.completedWorkers == this.context.options.numThreads) {
      this.onComplete();
      this.logger.log(`Raytrace completed in ${new Date().getTime() - this.renderStartMs}ms\n`);
    }
  }

  private writeChunkToFramebuffer(chunkIndex: number, data: ArrayBuffer) {
    const clampedRowData = new Uint8ClampedArray(data);
    const chunk = this.chunks[chunkIndex];

    for (let y = 0; y < chunk.height; y++) {
      for (let x = 0; x < chunk.width; x++) {
        const idx = (x * 3) + ((chunk.width * 3) * y);
        const r = clampedRowData[idx];
        const g = clampedRowData[idx + 1];
        const b = clampedRowData[idx + 2];
        const colour = new Colour(r, g, b);

        this.framebuffer.writePixelAt( (x+chunk.xStart), (y+chunk.yStart), colour);
      }
    }

    this.framebuffer.flush();
  }

  private drawChunkBorder(chunk: FrameChunk, borderWidth: number) {
    const width = chunk.width;
    const height = chunk.height;

    const borderColour = new Colour(220, 128, 128);
    const unrenderedAreaColour = new Colour(160, 160, 160);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {

        if (y < borderWidth || y >= (height-borderWidth) || x < borderWidth || x >= (width-borderWidth)) {
          this.framebuffer.writePixelAt(chunk.xStart+x, chunk.yStart+y, borderColour);
        } else {
          this.framebuffer.writePixelAt(chunk.xStart+x, chunk.yStart+y, unrenderedAreaColour);
        }

      }
    }

    this.framebuffer.flush();
  }
}
