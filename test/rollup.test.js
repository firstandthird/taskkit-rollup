/* eslint-disable no-console */
const tap = require('tap');
const TaskkitRollup = require('../');
const fs = require('fs');
const validate = require('sourcemap-validator');

const clean = () => {
  try {
    fs.unlinkSync('./test/output/domassist.js');
    fs.unlinkSync('./test/output/domassist.js.map');
    fs.unlinkSync('./test/output/domassist.bundle.js');
    fs.unlinkSync('./test/output/domassist.bundle.js.map');
    fs.unlinkSync('./test/output/domassist.cjs.js');
    fs.unlinkSync('./test/output/domassist.cjs.js.map');
  } catch (error) {
    // Fail silently
  }
};

tap.test('setup', (t) => {
  t.plan(2);

  t.equal(typeof TaskkitRollup.constructor, 'function', 'TaskkitRollup is a class');
  const rollup = new TaskkitRollup();

  t.equal(typeof rollup.process, 'function', 'process is a function');
});

tap.test('process', async(t) => {
  t.plan(6);

  const rollup = new TaskkitRollup('rollup', {
    files: {
      './test/output/domassist.js': './test/input/domassist.js'
    }
  });

  clean();

  await rollup.execute();

  const expected = fs.readFileSync('./test/expected/domassist.js', 'utf-8').trim();
  const output = fs.readFileSync('./test/output/domassist.js', 'utf-8').trim();
  const outputMap = fs.readFileSync('./test/output/domassist.js.map', 'utf-8').trim();
  const expectedMap = fs.readFileSync('./test/expected/domassist.js.map', 'utf-8').trim();

  // Bundle files
  const expectedEsm = fs.readFileSync('./test/expected/domassist.bundle.js', 'utf-8').trim();
  const outputEsm = fs.readFileSync('./test/output/domassist.bundle.js', 'utf-8').trim();
  const expectedEsmMap = fs.readFileSync('./test/expected/domassist.bundle.js.map', 'utf-8').trim();
  const outputEsmMap = fs.readFileSync('./test/output/domassist.bundle.js.map', 'utf-8').trim();

  t.equal(output, expected, 'output matches expected');
  t.equal(outputMap, expectedMap, 'output map matches expected');
  t.equal(outputEsm, expectedEsm, 'output ESM matches expected');
  t.equal(outputEsmMap, expectedEsmMap, 'output ESM map matches expected');

  t.doesNotThrow(() => {
    validate(output, outputMap);
  }, 'map is valid');

  t.doesNotThrow(() => {
    validate(outputEsm, outputEsmMap);
  }, 'ESM map is valid');
  t.end();
});

tap.test('CJS build enabled', async (t) => {
  t.plan(4);

  const rollup = new TaskkitRollup('rollup', {
    sourcemap: true,
    files: {
      './test/output/domassist.js': './test/input/domassist.js'
    },
    formats: {
      cjs: true
    }
  });

  clean();

  await rollup.execute();

  const expected = fs.readFileSync('./test/expected/domassist.cjs.js', 'utf-8').trim();
  const output = fs.readFileSync('./test/output/domassist.cjs.js', 'utf-8').trim();
  const outputMap = fs.readFileSync('./test/output/domassist.cjs.js.map', 'utf-8').trim();
  const expectedMap = fs.readFileSync('./test/expected/domassist.cjs.js.map', 'utf-8').trim();

  t.equal(fs.existsSync('./test/output/domassist.cjs.js'), true, 'output exists');
  t.equal(output, expected, 'output cjs matches expected');
  t.equal(outputMap, expectedMap, 'output cjs map matches expected');
  t.doesNotThrow(() => {
    validate(output, outputMap);
  }, 'cjs map is valid');
});

tap.test('esm build disabled', async(t) => {
  t.plan(2);

  const rollup = new TaskkitRollup('rollup', {
    sourcemap: false,
    files: {
      './test/output/domassist.js': './test/input/domassist.js'
    },
    formats: {
      esm: false
    }
  });

  clean();

  await rollup.execute();
  t.equal(fs.existsSync('./test/output/domassist.js'), false, 'ESM wasn\'t created');
  t.equal(fs.existsSync('./test/output/domassist.bundle.js'), true, 'Bundle exists');
});

tap.test('map file disabled', async (t) => {
  t.plan(4);

  const rollup = new TaskkitRollup('rollup', {
    sourcemap: false,
    files: {
      './test/output/domassist.js': './test/input/domassist.js'
    }
  });

  clean();

  await rollup.execute();
  t.equal(fs.existsSync('./test/output/domassist.js'), true, 'output exists');
  t.equal(fs.existsSync('./test/output/domassist.bundle.js'), true, 'output bundle exists');
  t.equal(fs.existsSync('./test/output/domassist.js.map'), false, 'map wasn\'t created');
  t.equal(fs.existsSync('./test/output/domassist.bundle.js.map'), false, 'Bundle map wasn\'t created');
});
