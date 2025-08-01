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
    // Process scene into chunks
    const chunkSize = this.getChunkSize();
    for (let y = 0; y < this.context.height; y+= chunkSize) {
      for (let x = 0 ; x < this.context.width; x+= chunkSize) {
        this.chunkQueue.push(new FrameChunk(x, y, chunkSize, chunkSize));
      }
    }
    this.logger.log(`Scene split into ${this.chunkQueue.length} chunks of ${chunkSize}x${chunkSize}`);

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

  public stopRender() {
    for (let worker of this.raytraceWorkers) {
      worker.terminate();
    }
  }

  private raytraceNextChunk(worker: Worker) {
    const chunk = this.getNextChunk();
    this.drawChunkBorder(chunk);
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
      const renderTimeMs = (new Date().getTime() - this.renderStartMs);

      this.logger.log(`Raytrace completed in ${renderTimeMs}ms\n`);

      const pixels = this.context.width * this.context.height;
      const score = Math.round(pixels/renderTimeMs);
      this.onComplete(score);
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

  private drawChunkBorder(chunk: FrameChunk) {
    const width = chunk.width;
    const height = chunk.height;

    let borderWidth = 0;
    if (this.context.height <= 720) {
      borderWidth = 4;
    } else {
      borderWidth = 8;
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {

        if (y < borderWidth || y >= (height-borderWidth) || x < borderWidth || x >= (width-borderWidth)) {
          this.framebuffer.writePixelAt(chunk.xStart+x, chunk.yStart+y, this.context.options.chunkBorderColour);
        } else {
          this.framebuffer.writePixelAt(chunk.xStart+x, chunk.yStart+y, this.context.options.chunkUnrenderedColour);
        }

      }
    }

    this.framebuffer.flush();
  }

  private getChunkSize(): number {
    if (this.context.options.chunkSize === 0) {
      // Auto sizing based on scene height
      if (this.context.height <= 720) {
        return 64;
      } else {
        return 128;
      }
    } else {
      return this.context.options.chunkSize;
    }
  }
}
