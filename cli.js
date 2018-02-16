#!/usr/bin/env node

const arrayFlatten = require('array-flatten');
const arrayUniq = require('array-uniq');
const chalk = require('chalk');
const fs = require('fs');
const glob = require('glob');

const extract = require('./lib/extract');

const files = arrayUniq(
  arrayFlatten(process.argv.slice(2).map(path => glob.sync(path)))
);

const log = msg => {
  process.stderr.write(`${msg}\n`);
};

const extractedKeys = files.map(fileName => {
  try {
    const code = fs.readFileSync(fileName, 'utf-8');
    const keys = extract(code);

    if (keys.length > 0) {
      log(
        chalk.green(
          `extracted ${keys.length} ${
            keys.length === 1 ? 'key' : 'keys'
          } from ${fileName}`
        )
      );
    }

    return keys;
  } catch (e) {
    log(chalk.red(`Error processing ${fileName}:`));
    log(e.message);
    process.exit(1);
  }
});

const uniqueKeys = arrayUniq(arrayFlatten(extractedKeys));

console.log(JSON.stringify(uniqueKeys, null, 2));
