const path = require('path');
const fs = require('fs');
const extract = require('./lib/extract');

const fixturesDir = path.join(__dirname, 'fixtures');
const changeExt = (fileName, newExt) => {
  const currentExt = path.extname(fileName);
  return `${fileName.slice(0, currentExt.length * -1)}.${newExt}`;
};
const stringify = json => JSON.stringify(json, null, 2);

const options = {
  func: ['t', 'i18n.t', 'this.props.t'],
};

const getOutput = input => {
  try {
    return stringify(extract(input, options));
  } catch (e) {
    return stringify({ ERROR: e.message.split('\n') });
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

  if (expextedOutput.trim() === actualOutput.trim()) {
    console.log(`✅  ${fileName}`);
  } else {
    console.log(`❌  ${fileName}:`);
    console.log('expected output:');
    console.log(expextedOutput);
    console.log('actual output:');
    console.log(actualOutput);
    console.log('');
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
