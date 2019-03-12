#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs-extra');
const getStdin = require('get-stdin');
const globby = require('globby');
const clangFormat = require('clang-format');
const tmp = require('tmp-promise');
const path = require('path');
const { argv } = require('yargs')
  .usage('Usage: $0 [options]')
  .example('$0 -i input.scad -o output.scad', 'Formats input.scad and saves it as output.scad')
  .example('$0 < input.scad > output.scad', 'Formats input.scad and saves it as output.scad')
  .example('$0 < input.scad', 'Formats input.scad and writes to stdout')
  .example('cat input.scad | $0 | less', 'Formats input.scad and displays in less')
  .example('$0 -i ./**/*', 'Formats all *.scad files and writes them to their respective files')
  .alias('i', 'input')
  .nargs('i', 1)
  .describe('i', 'Input file to read')
  .alias('o', 'output')
  .nargs('o', 1)
  .describe('o', 'Output file to write')
  .help('h')
  .alias('h', 'help')
  .epilog('This utility requires clang and openscad to be installed.');

tmp.setGracefulCleanup();

async function convertIncludesToClang(str) {
  // eslint-disable-next-line no-useless-escape
  const regex = /^\s*(include|use)\s*<([\.\w\/]*)>\s*$/gm;
  const backup = []; // {type: 'include' | 'use', path: 'cornucopia/../source.scad'}
  let matches = regex.exec(str);

  while (matches !== null) {
    if (matches.index === regex.lastIndex) {
      regex.lastIndex += 1;
    }

    let entry = {};
    // eslint-disable-next-line no-loop-func
    matches.forEach((match, groupIndex) => {
      if (groupIndex === 0) {
        entry = {};
      } else if (groupIndex === 1) {
        entry.type = match;
      } else if (groupIndex === 2) {
        entry.path = match;
        backup.push(entry);
      }
    });

    matches = regex.exec(str);
  }

  const updated = str.replace(regex, '');

  const newIncludes = [];
  backup.forEach((item) => {
    // Use include since we're converting to Clang.
    newIncludes.push(`#include <${item.path}>\n`);
  });
  newIncludes.push(updated);

  return { str: newIncludes.join(''), backup };
}

async function convertIncludesToScad(str, backup) {
  // eslint-disable-next-line no-useless-escape
  const regex = /^\s*#include\s*<([\.\w\/]*)>\s*$/gmi;
  let fixed = str;
  let matches = regex.exec(str);

  while (matches !== null) {
    if (matches.index === regex.lastIndex) {
      regex.lastIndex += 1;
    }

    let entry = {};
    // eslint-disable-next-line no-loop-func
    matches.forEach((match, groupIndex) => {
      if (groupIndex === 0) {
        entry = { full: match };
      } else if (groupIndex === 1) {
        entry.path = match;
        backup.forEach((item) => {
          if (item.path === entry.path) {
            fixed = fixed.replace(entry.full, `${item.type} <${item.path}>`);
          }
        });
      }
    });

    matches = regex.exec(str);
  }

  return fixed;
}

async function format(str, tmpDir) {
  function getClangFormattedString(file) {
    return new Promise((resolve, reject) => {
      const result = [];
      clangFormat(file, 'utf-8', 'file', () => {
        resolve(result.join());
      })
        .on('data', buffer => result.push(buffer.toString()))
        .on('err', err => reject(err));
    });
  }

  const clangConversionResult = await convertIncludesToClang(str);

  const virtualFile = {
    path: path.join(tmpDir.path, 'input.scad'),
  };
  await fs.writeFile(virtualFile.path, clangConversionResult.str);

  let result = await getClangFormattedString(virtualFile);

  result = await convertIncludesToScad(result, clangConversionResult.backup);

  try {
    await fs.remove(virtualFile.path);
  } catch (err) {
    console.error('Failed to remove temporary input file');
  }

  return result;
}

async function feed(input, output, tmpDir) {
  let str = null;

  if (input) {
    str = await fs.readFile(input);
  } else {
    str = await getStdin();
  }

  str = str.toString();

  const result = await format(str, tmpDir);

  if (result) {
    if (output) {
      await fs.writeFile(output, result);
    } else if (input && argv.isCLI) {
      // Write it back to the source location.
      await fs.writeFile(input, result);
    } else if (argv.isCLI) {
      process.stdout.write(result);
    }
    return result;
  }
  throw new Error('Failed to format content string');
}

async function main(input, output) {
  if (input) {
    argv.input = input;
  }

  if (output) {
    argv.output = output;
  }

  try {
    argv.input = await globby(argv.input);
  } catch (err) {
    console.error(err, argv.input);
  }

  if (argv.input.length > 1) {
    argv.output = null;
  } else if (!argv.output && argv.input.length === 1) {
    argv.output = argv.input;
  }

  const resultList = [];

  try {
    const tmpDir = await tmp.dir({ unsafeCleanup: true });

    try {
      await fs.copy('.clang-format', path.join(tmpDir.path, '.clang-format'));
    } catch (err) {
      console.error('Failed to copy clang format config file to temporary directory');
    }

    if (argv.input) {
      await Promise.all(argv.input.map(async (file) => {
        try {
          const result = await feed(file, argv.output, tmpDir);
          resultList.push({ source: file, formatted: result });
        } catch (err) {
          console.error(err);
        }
      }));
    } else {
      // Use stdin.
      try {
        const result = await feed(null, argv.output, tmpDir);
        resultList.push({ source: 'stdin', formatted: result });
      } catch (err) {
        console.error(err);
      }
    }

    try {
      await fs.remove(path.join(tmpDir.path, '.clang-format'));
    } catch (err) {
      console.error('Failed to remove temporary clang format config file');
    }

    try {
      tmpDir.cleanup();
    } catch (err) {
      console.error('Failed to cleanup temporary directory');
    }

    return resultList;
  } catch (err) {
    console.error(err);
  }
}

if (require.main === module) {
  // Called via CLI.
  argv.isCLI = true;
  if (!argv.help) {
    main();
  }
} else {
  // Called via require.
  argv.isCLI = false;
  module.exports = main;
}
