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
        browser: true
      },
      formats: {
        esm: true,
        cjs: false
      },
      commonjs: {
        enabled: true
      },
      globals: true,
      builtins: true,
      babel: {
        exclude: [],
        presetConfig: {
          loose: true,
          exclude: [
            'transform-typeof-symbol'
          ]
        }
      }
    };
  }

  async getPackage() {
    let fileName = 'package.json';
    let includePath = process.cwd();
    const options = this.options;

    if (typeof options.package === 'object') {
      if (options.package.path) {
        includePath = options.package.path;
      }
    } else if (typeof options.package === 'string') {
      if (options.package.indexOf('package.json') > -1) {
        fileName = options.package;
      } else {
        fileName = path.join(options.package, 'package.json');
      }
    }
    const file = path.join(includePath, fileName);
    if (await new Promise(resolve => fs.access(file, fs.constants.F_OK, err => resolve(err === null)))) {
      const foreignPackage = require(file);
      return foreignPackage || {};
    }
    return {};
  }

  getExternals(pkg) {
    const externals = [];

    if (this.options.external) {
      if (Array.isArray(this.options.external)) {
        this.options.external.forEach(external => externals.push(external));
      } else if (typeof this.options.external === 'string') {
        externals.push(this.options.external);
      }
    }

    if (pkg && pkg.dependencies) {
      Object.keys(pkg.dependencies).forEach(dep => externals.push(dep));
    }

    return externals;
  }

  async bundle(options, format, bundleI) {
    let filename;

    switch (format) {
      case 'cjs':
        filename = options.filename.replace('.js', '.cjs.js');
        break;
      case 'iife':
        filename = options.filename.replace('.js', '.bundle.js');
        break;
      default:
        filename = options.filename;
    }

    if (Array.isArray(format)) {
      const bundle = await rollup({
        input: options.input,
        plugins: options.plugins,
        external: []
      });

      return Promise.all(format.map(f => this.bundle(options, f, bundle)));
    }

    const external = format === 'esm' ? options.external : [];
    const bundle = bundleI || await rollup({
      input: options.input,
      plugins: options.plugins,
      external
    });

    let name = options.pkg.name || 'app';
    name = name.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());

    return bundle.write({
      file: filename,
      format,
      name,
      sourcemap: this.options.sourcemap
    });
  }

  async process(input, filename) {
    const pkg = await this.getPackage();
    const external = this.getExternals(pkg);

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

    const bundleOptions = {
      filename,
      pkg,
      input,
      plugins,
      external
    };

    if (this.options.formats.esm) {
      await this.bundle(bundleOptions, 'esm');
    }

    if (this.options.formats.cjs) {
      await this.bundle(bundleOptions, ['cjs', 'iife']);
    } else {
      await this.bundle(bundleOptions, 'iife');
    }
  }
}
module.exports = RollupTask;
