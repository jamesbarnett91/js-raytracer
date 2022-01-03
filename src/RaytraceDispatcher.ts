import {Framebuffer} from './Framebuffer';
import {RaytraceContext} from './RaytraceContext';
import {instanceToPlain} from 'class-transformer';
import 'reflect-metadata';
import {Logger} from './Logger';

export class RaytraceDispatcher {
  private renderStartMs: number;
  private completedThreads = 0;
  private processedResponses = 0;
  constructor(
    readonly framebuffer: Framebuffer,
    readonly context: RaytraceContext,
    readonly logger: Logger,
    readonly onComplete: Function
  ) {
    this.renderStartMs = new Date().getTime();
  }

  requestRender() {
    // Assumes height%threads = 0
    const rowBatchSize = this.context.height / this.context.options.numThreads;

    for (let y = 0; y < this.context.height; y += rowBatchSize) {
      const rowStartIndex = y;
      const rowEndIndex = y + rowBatchSize - 1;
      this.dispatchRaytraceWorker(rowStartIndex, rowEndIndex, this.context);
    }
  }

  private dispatchRaytraceWorker(
    rowStartIndex: number,
    rowEndIndex: number,
    context: RaytraceContext
  ) {
    this.logger.log(`Dispatching worker: rows ${rowStartIndex}-${rowEndIndex}`);

    const raytracer = new Worker(new URL('./Raytracer.ts', import.meta.url));

    raytracer.postMessage({
      type: 'raytraceStart',
      rowStartIndex: rowStartIndex,
      rowEndIndex: rowEndIndex,
      context: JSON.stringify(instanceToPlain(context)),
    });

    raytracer.onmessage = ({data}) => {
      if (data.type === 'raytraceResultRow') {
        this.processResponse(data.rowIndex, data.resultBuffer);
      }
      if (data.type === 'raytraceComplete') {
        this.handleWorkerComplete();
      }
    };
  }

  private handleWorkerComplete() {
    if (++this.completedThreads === this.context.options.numThreads) {
      this.framebuffer.flush();
      this.logger.log(
        `Raytrace completed in ${new Date().getTime() - this.renderStartMs}ms`
      );
      this.onComplete();
    }
  }

  private processResponse(rowIndex: number, rowData: ArrayBuffer) {
    const clampedRowData = new Uint8ClampedArray(rowData);

    for (let x = 0; x < this.context.width; x++) {
      const idx = x * 3;
      const r = clampedRowData[idx];
      const g = clampedRowData[idx + 1];
      const b = clampedRowData[idx + 2];
      this.framebuffer.writePixelAt(x, rowIndex, r, g, b);
    }

    if (
      this.context.options.bufferDrawCalls &&
      ++this.processedResponses >= this.context.height * 0.05
    ) {
      this.framebuffer.flush();
      this.processedResponses = 0;
    } else if (!this.context.options.bufferDrawCalls) {
      this.framebuffer.flush();
    }
  }
}
