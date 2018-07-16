'use strict';
const TaskKitTask = require('taskkit-task');
const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');
const uglify = require('rollup-plugin-uglify');
const es2015 = require('babel-preset-env');
const babelHelpers = require('babel-plugin-external-helpers');
const path = require('path');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
class RollupTask extends TaskKitTask {
  get description() {
    return 'Compiles your various client-executable files into a minified, source-mapped, browser-compatible js file that you can embed in a webpage';
  }

  // returns the module to load when running in a separate process:
  get classModule() {
    return path.join(__dirname, 'index.js');
  }

  get defaultOptions() {
    return {
      multithread: false,
      minify: (process.env.NODE_ENV === 'production'),
      sourcemap: true,
      rollup: {
        bundle: {
          format: 'iife',
          name: 'app'
        },
        external: []
      },
      nodeResolve: {
        module: true,
        main: true,
        browser: true
      },
      commonjs: {
        enabled: true
      },
      globals: true,
      builtins: true,
      babel: {
        exclude: []
      }
    };
  }

  async process(input, filename) {
    const cacheName = `${path.basename(filename)}.rollup-cache`;
    this.options.rollup.bundle.sourcemap = this.options.sourcemap;
    const babelPresets = [
      [es2015, { modules: false }]
    ];
    const plugins = [
      nodeResolve(this.options.nodeResolve)
    ];
    if (this.options.commonjs.enabled) {
      plugins.push(commonjs(this.options.commonjs));
    }
    if (this.options.globals) {
      plugins.push(globals());
    }
    if (this.options.builtins) {
      plugins.push(builtins());
    }
    plugins.push(babel({
      plugins: [babelHelpers],
      exclude: this.options.babel.exclude,
      presets: babelPresets,
      babelrc: false
    }));
    if (this.options.minify) {
      plugins.push(uglify());
    }
    if (this.options.cache && fs.existsSync(cacheName)) {
      this.cache = JSON.parse(await readFile(cacheName));
    }
    const bundle = await rollup({
      input,
      plugins,
      external: this.options.rollup.external,
      cache: this.cache
    });
    this.cache = bundle;
    if (this.options.cache) {
      await writeFile(cacheName, JSON.stringify(this.cache));
    }
    const result = await bundle.generate(this.options.rollup.bundle);
    if (!result) {
      throw new Error(`${input} resulted in an empty bundle`);
    }
    if (!this.options.sourcemap) {
      return this.write(filename, result.code);
    }
    //write sourcemap
    await this.write(`${filename}.map`, result.map.toString());
    const basename = path.basename(filename);
    await this.write(filename, `${result.code}\n//# sourceMappingURL=${basename}.map`);
  }
}
module.exports = RollupTask;
