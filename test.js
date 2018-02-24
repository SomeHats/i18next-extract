const path = require('path');
const fs = require('fs');
const extract = require('./lib/extract');

const STACK = Symbol();
const fixturesDir = path.join(__dirname, 'fixtures');

const changeExt = (fileName, newExt) => {
  const currentExt = path.extname(fileName);
  return `${fileName.slice(0, currentExt.length * -1)}.${newExt}`;
};

const stringify = json => JSON.stringify(json, null, 2).trim();

const getOutput = input => {
  try {
    return extract(input);
  } catch (e) {
    return { ERROR: e.message.split('\n'), [STACK]: e.stack };
  }
};

let success = true;

fs.readdirSync(path.join(fixturesDir, 'in')).forEach(fileName => {
  const inputFile = path.join(fixturesDir, 'in', fileName);
  const outputFile = path.join(fixturesDir, 'out', changeExt(fileName, 'json'));

  const input = fs.readFileSync(inputFile, 'utf-8');
  const expextedOutput = stringify(
    JSON.parse(fs.readFileSync(outputFile, 'utf-8'))
  );

  const actualOutput = getOutput(input);

  if (expextedOutput === stringify(actualOutput)) {
    console.log(`✅  ${fileName}`);
  } else {
    console.log(`❌  ${fileName}:`);
    console.log('expected output:');
    console.log(expextedOutput);
    console.log('actual output:');
    console.log(stringify(actualOutput));
    console.log('');
    if (actualOutput[STACK]) {
      console.log(actualOutput[STACK]);
    }
    success = false;
  }
});

console.log('\n---\n');
if (success) {
  console.log('🌟 🌟  SUCCESS 🌟 🌟');
  process.exit(0);
} else {
  console.log('💀 💀  FAIL 💀 💀');
  process.exit(1);
}
