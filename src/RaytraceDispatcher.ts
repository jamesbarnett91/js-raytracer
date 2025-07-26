import {Framebuffer} from './Framebuffer';
import {ChunkAllocationMode, RaytraceContext} from './models/RaytraceContext';
import {instanceToPlain} from 'class-transformer';
import 'reflect-metadata';
import {Logger} from './Logger';
import {FrameChunk} from "./models/FrameChunk";
import {Colour} from "./models/Colour";

export class RaytraceDispatcher {
  private readonly renderStartMs: number;
  private readonly contextJson: String;
  private readonly chunkQueue: FrameChunk[];
  private readonly raytraceWorkers: Worker[];
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
    this.chunkQueue = [];
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
        this.chunkQueue.push(new FrameChunk(x, y, chunkWidth, chunkHeight));
      }
    }
    this.logger.log(`Scene split into ${this.chunkQueue.length} chunks of ${chunkWidth}x${chunkHeight}`);

    // Spawn worker threads
    for (let n = 0; n < this.context.options.numThreads; n++) {
      const worker = new Worker(new URL('./Raytracer.ts', import.meta.url));
      worker.onmessage = (event) => { this.processRaytraceWorkerResult(worker, event) };
      this.raytraceWorkers.push(worker);
    }
    this.logger.log(`Spawned ${this.context.options.numThreads} render threads`);

    // Start raytrace
    for (let worker of this.raytraceWorkers) {
      this.raytraceNextChunk(worker);
    }
  }

  private raytraceNextChunk(worker: Worker) {
    const chunk = this.getNextChunk();
    this.drawChunkBorder(chunk, this.chunkBorderWidth);
    worker.postMessage({
      type: 'raytraceStart',
      chunk: chunk,
      context: this.contextJson,
    });
  }

  private getNextChunk(): FrameChunk {
    switch(this.context.options.chunkAllocationMode) {
      case ChunkAllocationMode.SEQUENTIAL:
        return this.getNextChunkSequential();
      case ChunkAllocationMode.RANDOM:
        return this.getNextChunkRandom();
      case ChunkAllocationMode.CENTER_TO_EDGE:
        return this.getNextChunkCenterToEdge();
      case ChunkAllocationMode.EDGE_TO_CENTER:
        return this.getNextChunkEdgeToCenter();
    }
  }

  private processRaytraceWorkerResult(worker: Worker, message: MessageEvent) {
    this.writeChunkToFramebuffer(message.data.chunk, message.data.resultBuffer);

    // Queue next work if available
    if (this.chunkQueue.length > 0) {
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

  private getNextChunkSequential(): FrameChunk {
    return this.chunkQueue.shift()!;
  }

  private getNextChunkRandom(): FrameChunk {
    const index = Math.floor(Math.random() * this.chunkQueue.length);
    const chunk = this.chunkQueue[index];
    this.chunkQueue.splice(index, 1);
    return chunk
  }

  private getNextChunkCenterToEdge(): FrameChunk {
    const index = Math.floor((this.chunkQueue.length - 1) / 2);
    const chunk = this.chunkQueue[index];
    this.chunkQueue.splice(index, 1);
    return chunk;
  }

  private getNextChunkEdgeToCenter(): FrameChunk {
    if (this.chunkQueue.length % 2 == 0) {
      return this.chunkQueue.shift()!;
    } else {
      return this.chunkQueue.pop()!;
    }
  }

  private writeChunkToFramebuffer(chunk: FrameChunk, data: ArrayBuffer) {
    const clampedRowData = new Uint8ClampedArray(data);

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
