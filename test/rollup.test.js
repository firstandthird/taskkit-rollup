/* eslint-disable no-console */
const tap = require('tap');
const TaskkitRollup = require('../');
const fs = require('fs');
const validate = require('sourcemap-validator');

const clean = () => {
  try {
    fs.unlinkSync('./test/output/domassist.js');
    fs.unlinkSync('./test/output/domassist.js.map');
    fs.unlinkSync('./test/output/domassist.esm.js');
    fs.unlinkSync('./test/output/domassist.esm.js.map');
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

  // ESM files
  const expectedEsm = fs.readFileSync('./test/expected/domassist.esm.js', 'utf-8').trim();
  const outputEsm = fs.readFileSync('./test/output/domassist.esm.js', 'utf-8').trim();
  const expectedEsmMap = fs.readFileSync('./test/expected/domassist.esm.js.map', 'utf-8').trim();
  const outputEsmMap = fs.readFileSync('./test/output/domassist.esm.js.map', 'utf-8').trim();

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

tap.test('cjs build enabled', async (t) => {
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
  const output = fs.readFileSync('./test/output/domassist.js', 'utf-8').trim();
  const outputMap = fs.readFileSync('./test/output/domassist.js.map', 'utf-8').trim();
  const expectedMap = fs.readFileSync('./test/expected/domassist.cjs.js.map', 'utf-8').trim();

  t.equal(fs.existsSync('./test/output/domassist.js'), true, 'output exists');
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
  t.equal(fs.existsSync('./test/output/domassist.js'), true, 'output exists');
  t.equal(fs.existsSync('./test/output/domassist.esm.js'), false, 'ESM wasn\'t created');
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
  t.equal(fs.existsSync('./test/output/domassist.esm.js'), true, 'output esm exists');
  t.equal(fs.existsSync('./test/output/domassist.js.map'), false, 'map wasn\'t created');
  t.equal(fs.existsSync('./test/output/domassist.esm.js.map'), false, 'ESM map wasn\'t created');
});

tap.test('can store and read from file cache', async(t) => {
  const cachePath = './rollup-cache/domassist.js.rollup-cache';
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }
  const rollup = new TaskkitRollup('rollup', {
    files: {
      './test/output/domassist.js': './test/input/domassist.js'
    },
    cache: true
  });

  clean();

  // get the execution time for the first run:
  const start = new Date().getTime();
  await rollup.execute();
  const end1 = new Date().getTime();

  await rollup.execute();
  const end2 = new Date().getTime();
  // show the performance increase as part of the test:
  console.log(`First execution: ${end1 - start}ms`);
  console.log(`Cached execution: ${end2 - end1}ms`);
  t.ok(end1 - start > end2 - end1, 'executes faster when using an existing cache');
  t.end();
});

tap.test('will not cache if there is an error', async(t) => {
  const cachePath = './rollup-cache/broke.js.rollup-cache';
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }
  const rollup = new TaskkitRollup('rollup', {
    files: {
      './test/output/broke.js': './test/input/broke.js'
    },
    cache: true
  });

  clean();

  try {
    await rollup.execute();
  } catch (e) {
    //
  }
  t.notOk(fs.existsSync(cachePath));
  t.end();
});
