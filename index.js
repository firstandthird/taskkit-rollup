'use strict';
const TaskKitTask = require('taskkit-task');
const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');

class RollupTask extends TaskKitTask {

  get description() {
    return 'Compiles your various client-executable files into a minified, source-mapped, browser-compatible js file that you can embed in a webpage';
  }

  process(input, filename, done) {
    const babelPresets = [
      ['es2015', { modules: false }]
    ];
    if (this.options.minify) {
      babelPresets.push(['babili']);
    }
    const plugins = [
      babel({
        exclude: 'node_modules/**',
        presets: babelPresets
      }),
      nodeResolve({
        module: true,
        main: true,
        browser: true
      })
    ];
    rollup({
      entry: input,
      plugins
    }).then(bundle => {
      const result = bundle.generate({
        //output format - 'amd', 'cjs', 'es', 'iife', 'umd'
        format: 'iife',
        moduleName: this.options.name,
      });
      this.write(filename, result.code, done);
    }).catch(err => {
      done(err);
    });
  }
}
module.exports = RollupTask;
