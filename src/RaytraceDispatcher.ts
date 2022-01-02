import {Colour} from './Colour';
import {Framebuffer} from './Framebuffer';
import {RaytraceContext} from './RaytraceContext';
import {instanceToPlain} from 'class-transformer';
import 'reflect-metadata';
import {Logger} from './Logger';

export class RaytraceDispatcher {
  private renderStartMs: number;
  private responsesReceived = 0;
  constructor(
    readonly framebuffer: Framebuffer,
    readonly context: RaytraceContext,
    readonly logger: Logger,
    readonly onComplete: Function
  ) {
    this.renderStartMs = new Date().getTime();
  }

  requestRender() {
    // Assumes height and threads are always even
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
    if (++this.responsesReceived === this.context.options.numThreads) {
      this.logger.log(
        `Raytrace completed in ${new Date().getTime() - this.renderStartMs}ms`
      );
      this.onComplete();
    }
  }

  private processResponse(rowIndex: number, rowData: Colour[]) {
    for (let x = 0; x < this.framebuffer.width; x++) {
      this.framebuffer.writePixelAt(x, rowIndex, rowData[x]);
    }
    this.framebuffer.flush();
  }
}
