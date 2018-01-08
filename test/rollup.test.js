const tap = require('tap');
const TaskkitRollup = require('../');
const fs = require('fs');

const clean = () => {
  try {
    fs.unlinkSync('./test/output/domassist.js');
    fs.unlinkSync('./test/output/domassist.js.map');
  } catch (e) {
    // Fail silently
  }
};

tap.test('setup', (t) => {
  t.plan(2);

  t.equal(typeof TaskkitRollup.constructor, 'function', 'TaskkitRollup is a class');
  const rollup = new TaskkitRollup();

  t.equal(typeof rollup.process, 'function', 'process is a function');
});

tap.test('process', (t) => {
  t.plan(2);

  const rollup = new TaskkitRollup('rollup', {
    sourcemap: true,
    files: {
      './test/output/domassist.js': './test/input/domassist.js'
    }
  });

  clean();

  rollup.execute((err, results) => {
    if (err) {
      throw err;
    }

    const expected = fs.readFileSync('./test/expected/domassist.js', 'utf-8').trim();
    const expectedMap = fs.readFileSync('./test/expected/domassist.js', 'utf-8').trim();
    const output = fs.readFileSync('./test/output/domassist.js', 'utf-8').trim();
    const outputMap = fs.readFileSync('./test/output/domassist.js', 'utf-8').trim();

    t.equal(output, expected, 'output matches expected');
    t.equal(outputMap, expectedMap, 'output map matches expected');
  });
});

tap.test('map file disabled', (t) => {
  t.plan(2);

  const rollup = new TaskkitRollup('rollup', {
    sourcemap: false,
    files: {
      './test/output/domassist.js': './test/input/domassist.js'
    }
  });

  clean();

  rollup.execute((err, results) => {
    if (err) {
      throw err;
    }

    t.equal(fs.existsSync('./test/output/domassist.js'), true, 'output exists');
    t.equal(fs.existsSync('./test/output/domassist.js.map'), false, 'map wasn\'t created');
  });
});

