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
      rollup: {
        bundle: {
          format: 'iife',
          name: 'app',
          sourcemap: true,
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

  process(input, filename, done) {
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
    rollup({
      input,
      plugins,
      external: this.options.rollup.external,
      cache: this.cache
    }).then(bundle => {
      this.cache = bundle;
      bundle.generate(this.options.rollup.bundle)
        .then((result) => {
          if (!result) {
            return done(new Error(`${input} resulted in an empty bundle`));
          }
          if (!this.options.sourcemap) {
            return this.write(filename, result.code, done);
          }
          //write sourcemap
          this.write(`${filename}.map`, result.map.toString(), (err) => {
            if (err) {
              return done(err);
            }
            const basename = path.basename(filename);
            this.write(filename, `${result.code}\n//# sourceMappingURL=${basename}.map`, done);
          });
        });
    }).catch(err => {
      done(err);
    });
  }
}
module.exports = RollupTask;
