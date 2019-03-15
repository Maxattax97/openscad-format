#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs-extra');
const getStdin = require('get-stdin');
const assert = require('assert');
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
  .example('$0 -i \'./**/*.scad\'', 'Formats all *.scad files recursively and writes them to their respective files')
  .alias('i', 'input')
  .nargs('i', 1)
  .describe('i', 'Input file to read, file globs allowed (quotes recommended)')
  .alias('o', 'output')
  .nargs('o', 1)
  .describe('o', 'Output file to write')
  .alias('f', 'force')
  .nargs('f', 1)
  .describe('f', 'Forcibly overwrite the source file')
  .alias('c', 'config')
  .nargs('c', 1)
  .describe('c', 'Use the specified config using the .clang-format style file')
  .alias('j', 'javadoc')
  .nargs('j', 1)
  .describe('j', 'Automatically add {Java,JS}doc-style comment templates to functions and modules where missing')
  .alias('d', 'dry')
  .nargs('d', 1)
  .describe('d', 'Perform a dry run, without writing')
  .help('h')
  .alias('h', 'help')
  .epilog('This utility requires clang-format, but this is automatically installed for most platforms.');

tmp.setGracefulCleanup();

async function convertIncludesToClang(str) {
  // eslint-disable-next-line no-useless-escape
  const regex = /^\s*(include|use)\s*<([-\.\w\/]*)>\s*$/gm;

  // {type: 'include' | 'use', path: 'cornucopia/../source.scad'}
  const backup = [];
  let matches = regex.exec(str);
  let updated = str;

  while (matches !== null) {
    if (matches.index === regex.lastIndex) {
      regex.lastIndex += 1;
    }

    let entry = {};
    // eslint-disable-next-line no-loop-func
    matches.forEach((match, groupIndex) => {
      if (groupIndex === 0) {
        entry = {};
        entry.full = match;
      } else if (groupIndex === 1) {
        entry.type = match;
      } else if (groupIndex === 2) {
        entry.path = match;
        updated = updated.replace(entry.full.trim(), `#include <${entry.path}>`);
        backup.push(entry);
      }
    });

    matches = regex.exec(str);
  }

  return { str: updated, backup };
}

async function convertIncludesToScad(str, backup) {
  // eslint-disable-next-line no-useless-escape
  const regex = /^\s*#include\s*<([-\.\w\/]*)>\s*$/gmi;
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

        // Must traverse in order.
        for (let i = 0; i < backup.length; i += 1) {
          if (backup[i].path === entry.path) {
            // Replace only _a single occurance_.
            fixed = fixed.replace(new RegExp(entry.full.trim(), ''), `${backup[i].type} <${backup[i].path}>`, '');

            // Splice out the one we just performed.
            backup.splice(i, 1);
            break;
          }
        }
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

  try {
    assert(str);
    const clangConversionResult = await convertIncludesToClang(str);
    assert(clangConversionResult.str);

    const { path: tmpFilePath, cleanup: cleanupTmpFile } = await tmp.file({ dir: tmpDir.path, postfix: '.scad' });

    const virtualFile = {
      path: tmpFilePath,
    };
    await fs.writeFile(virtualFile.path, clangConversionResult.str);

    let result = await getClangFormattedString(virtualFile);
    assert(result);

    result = await convertIncludesToScad(result, clangConversionResult.backup);
    assert(result);

    try {
      await fs.remove(virtualFile.path);
    } catch (err) {
      console.error('Failed to remove temporary input file', err);
    }

    cleanupTmpFile();

    return result;
  } catch (err) {
    console.error('Failure while formatting with Clang', err);
    throw err;
  }
}

async function feed(input, output, tmpDir) {
  let str = null;

  if (input) {
    str = await fs.readFile(input);
  } else {
    str = await getStdin();
  }

  str = str.toString();

  if (!str) {
    // Do not write to output since we sometimes use stdout.
    // console.warn(`Contents of ${input} is empty; skipping ...`);
    return '';
  }

  try {
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
  } catch (err) {
    console.error('Failed to feed to formatter and write output', err);
    throw err;
  }
}

async function main(input, output) {
  if (input) {
    argv.input = input;
  }

  if (output) {
    argv.output = output;
  }

  if (argv.input) {
    try {
      argv.input = await globby(argv.input, {
        deep: true,
        gitignore: true,
      });
    } catch (err) {
      console.error(`Failed to glob input using ${argv.input}`, err);
    }
  }

  if (argv.input && argv.input.length > 1) {
    argv.output = null;
  } else if (!argv.output && argv.input && argv.input.length === 1) {
    argv.output = argv.input;
  }

  const resultList = [];

  try {
    const tmpDir = await tmp.dir({ unsafeCleanup: true });

    try {
      await fs.copy(path.join(__dirname, '.clang-format'), path.join(tmpDir.path, '.clang-format'));

      if (argv.input) {
        await Promise.all(argv.input.map(async (file) => {
          try {
            const result = await feed(file, argv.output, tmpDir);
            resultList.push({ source: file, formatted: result });
          } catch (err) {
            console.error('Failed to feed input files', err);
          }
        }));
      } else {
        // Use stdin.
        try {
          const result = await feed(null, argv.output, tmpDir);
          resultList.push({ source: 'stdin', formatted: result });
        } catch (err) {
          console.error('Failed to feed stdin', err);
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
      throw err;
    }
  } catch (err) {
    console.error(err);
    throw err;
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
