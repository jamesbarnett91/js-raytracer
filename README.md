# JS Raytracer
A minimal ray tracing engine written from scratch in JS (TypeScript). 

![](.github/output.png)

View an interactive demo [here](https://jamesbarnett.io/raytracer).

No graphics APIs or libraries are used, only a single HTML5 canvas call to draw the generated bitmap image.

Various effects are supported, including recursive optical reflections and refractions, and [Phong shading](https://en.wikipedia.org/wiki/Phong_reflection_model). 
Basic multi-threading is implemented using the [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/).

## Benchmarking
The raytracer can also be used as a basic CPU performance benchmarking tool.

This will test the JavaScript execution performance of your CPU and web browser, and provide a raytracing throughput score in pixels per millisecond.

I've run the benchmark on various different devices I have access to, which provide some reference scores for comparison.
View them on the [benchmarking page](https://jamesbarnett.io/raytracer#benchmark) and try your own device to see how it compares.

The JavaScript execution engine your browser used will influence the results. The reference benchmark scores were all run in V8 (Chromium), as unfortunately SpiderMonkey (Firefox) seems to be considerably slower, at least at this specific task.

## Building locally
You will need NodeJS >= 10.

Clone this repo and build with webpack:

``` 
$ git clone https://github.com/jamesbarnett91/js-raytracer.git
$ cd js-raytracer
$ npm install
$ npm run serve
```

This will build the project and start a webpack dev server listening on port 9000. Navigate to `http://localhost:9000/` in you browser to view the project. This also enables hot-compiling/reloading on change.

Alternatively, you can build a distributable with `npm run build`. This will compile and bundle the project into `./dist`.

## Useful resources

- https://www.scratchapixel.com/lessons/3d-basic-rendering/introduction-to-ray-tracing
- https://tmcw.github.io/literate-raytracer/
- https://github.com/ssloy/tinyraytracer