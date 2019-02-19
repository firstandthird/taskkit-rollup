'use strict';
const TaskKitTask = require('taskkit-task');
const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');
const { uglify } = require('rollup-plugin-uglify');
const path = require('path');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const exists = util.promisify(fs.exists);
const mkdirp = require('mkdirp');

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
      esm: {
        enabled: true,
      },
      cjs: {
        enabled: false
      },
      commonjs: {
        enabled: true
      },
      globals: true,
      builtins: true,
      babel: {
        exclude: [],
        presetConfig: {}
      }
    };
  }

  async process(input, filename) {
    const cacheName = `./rollup-cache/${path.basename(filename)}.rollup-cache`;

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
      exclude: this.options.babel.exclude,
      presets: [
        [
          '@babel/preset-env',
          this.options.babel.presetConfig
        ]
      ],
      babelrc: false
    }));

    if (this.options.minify) {
      plugins.push(uglify({
        sourcemap: this.options.sourcemap
      }));
    }

    if (this.options.cache && await exists(cacheName)) {
      this.cache = JSON.parse(await readFile(cacheName));
    }
    const bundle = await rollup({
      input,
      plugins,
      external: this.options.rollup.external,
      cache: this.cache
    });
    this.cache = bundle;

    await bundle.write({
      file: filename,
      format: this.options.cjs.enabled ? 'cjs' : 'iife',
      name: 'app',
      sourcemap: this.options.sourcemap
    });

    if (this.options.esm.enabled) {
      await bundle.write({
        file: `${filename.replace('.js', '.esm.js')}`,
        format: 'esm',
        name: 'app',
        sourcemap: this.options.sourcemap
      });
    }

    if (this.options.cache) {
      // make the caching dir if it does not exist:
      mkdirp.sync('./rollup-cache');
      await writeFile(cacheName, JSON.stringify(this.cache));
    }
  }
}
module.exports = RollupTask;
