#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs-extra');
const getStdin = require('get-stdin');
const assert = require('assert');
const globby = require('globby');
const clangFormat = require('clang-format');
const tmp = require('tmp-promise');
const path = require('path');
const find = require('find-file-recursively-up');

let { argv } = require('yargs')
  .usage('Usage: $0 [options]')
  .example('$0 -i input.scad -o output.scad', 'Formats input.scad and saves it as output.scad')
  .example('$0 < input.scad > output.scad', 'Formats input.scad and saves it as output.scad')
  .example('$0 < input.scad', 'Formats input.scad and writes to stdout')
  .example('cat input.scad | $0 | less', 'Formats input.scad and displays in less')
  .example('$0 -i \'./**/*.scad\'', 'Formats all *.scad files recursively and writes them to their respective files')
  .alias('i', 'input')
  .nargs('i', 1)
  .describe('i', 'Input file to read, file globs allowed (quotes recommended)')
  .string('i') // We parse this path ourselves (might have wildcards).
  .alias('o', 'output')
  .nargs('o', 1)
  .describe('o', 'Output file to write')
  .normalize('o') // Normalizes to a path.
  .alias('c', 'config')
  .nargs('c', 1)
  .describe('c', 'Use the specified path to a config using the .openscad-format style file')
  .normalize('c') // Normalizes to a path.
  .alias('j', 'javadoc')
  .boolean('j')
  .describe('j', 'Automatically add {Java,JS}doc-style comment templates to functions and modules where missing')
  .alias('f', 'force')
  .boolean('f')
  .describe('f', 'Forcibly overwrite (or "fix") the source file')
  .alias('d', 'dry')
  .boolean('d')
  .describe('d', 'Perform a dry run, without writing')
  .help('h')
  .alias('h', 'help')
  .epilog('This utility requires clang-format, but this is automatically installed for most platforms.');
  // .default(argsDefault)

tmp.setGracefulCleanup();

async function convertIncludesToClang(str) {
  // eslint-disable-next-line no-useless-escape
  const regex = /^\s*(include|use)\s*<([_\-\.\w\/]*)>;{0,1}\s*$/gm;

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

  return { result: updated, backup };
}

async function addDocumentation(str) {
  return str;
}

async function convertIncludesToScad(str, backup) {
  // eslint-disable-next-line no-useless-escape
  const regex = /^\s*#include\s*<([_\-\.\w\/]*)>;{0,1}\s*$/gmi;
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
      clangFormat(file, 'utf-8', 'file', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.join());
        }
      })
        .on('data', buffer => result.push(buffer.toString()))
        .on('err', err => reject(err));
    });
  }

  try {
    assert(str, 'Did not receive string to format');

    // eslint-disable-next-line prefer-const
    let { result, backup } = await convertIncludesToClang(str);
    assert(result, 'Failed to convert OpenSCAD includes to Clang includes');

    if (argv.javadoc) {
      result = await addDocumentation(result);
      assert(result, 'Javadoc failed to format source');
    }

    const { path: tmpFilePath, cleanup: cleanupTmpFile } = await tmp.file({ dir: tmpDir.path, postfix: '.scad' });

    const virtualFile = {
      path: tmpFilePath,
    };
    await fs.writeFile(virtualFile.path, result);

    result = await getClangFormattedString(virtualFile);
    assert(result, 'Clang failed to format source');

    result = await convertIncludesToScad(result, backup);
    assert(result, 'Failed to convert Clang includes to OpenSCAD includes');

    try {
      await fs.remove(virtualFile.path);
    } catch (err) {
      console.error('Failed to remove temporary input file', err);
    }

    cleanupTmpFile();

    return result;
  } catch (err) {
    if (err.message.indexOf('clang-format exited with exit code 1.') >= 0) {
      throw new Error('Syntax error in .openscad-format (Clang failed to parse it)');
    } else {
      console.error('Failure while formatting with Clang', err);
      throw err;
    }
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
      if (!argv.dry && output && argv.input && argv.input.length > 1) {
        await fs.outputFile(path.join(argv.output, path.basename(input)), result);
      } else if (!argv.dry && output) {
        await fs.writeFile(output, result);
      } else if (!argv.dry && argv.force && input) {
        // Write it back to the source location.
        await fs.writeFile(input, result);
      } else if (argv.dry && argv.isCLI) {
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

async function findFormatFile() {
  return new Promise((resolve, reject) => {
    find('.openscad-format', (err, foundPath) => {
      if (err) {
        reject(err);
        return;
      }

      if (foundPath) {
        resolve(foundPath);
      } else {
        reject(new Error('unable to find .openscad-format'));
      }
    });
  });
}

async function main(params) {
  if (params) {
    argv = params;
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

  try {
    if (argv.output && argv.input && argv.input.length > 1) {
      await fs.ensureDir(argv.output);
    } else if (argv.output && argv.input && argv.input.length === 1) {
      await fs.ensureFile(argv.output);
    }
  } catch (err) {
    console.error('Failure while ensuring proper output pathing', err);
  }

  const resultList = [];

  try {
    const tmpDir = await tmp.dir({ unsafeCleanup: true });

    try {
      if (argv.config) {
        await fs.copy(argv.config, path.join(tmpDir.path, '.clang-format'));
      } else {
        let foundConfig;
        try {
          foundConfig = await findFormatFile();
        } catch (e) {
          foundConfig = undefined;
        }

        if (foundConfig) {
          await fs.copy(foundConfig, path.join(tmpDir.path, '.clang-format'));
        } else {
          await fs.copy(path.join(__dirname, '.openscad-format'), path.join(tmpDir.path, '.clang-format'));
        }
      }

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
