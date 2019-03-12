const fs = require('fs');
const getStdin = require('get-stdin');
const { promisify } = require('util');
const { argv } = require('yargs')
  .usage('Usage: $0 [options]')
  .example('$0 -i input.scad -o output.scad', 'Formats input.scad and saves it as output.scad')
  .example('$0 < input.scad > output.scad', 'Formats input.scad and saves it as output.scad')
  .example('$0 < input.scad', 'Formats input.scad and writes to stdout')
  .example('cat input.scad | $0 | less', 'Formats input.scad and displays in less')
  .alias('i', 'input')
  .nargs('i', 1)
  .describe('i', 'Input file to read')
  .alias('o', 'output')
  .nargs('o', 1)
  .describe('o', 'Output file to write')
  .help('h')
  .alias('h', 'help')
  .epilog('This utility requires clang and openscad to be installed.');

function format(str) {
  console.log(str);
}

async function main(input, output) {
  if (input) {
    argv.input = input;
  }

  if (output) {
    argv.output = output;
  }

  const readFile = promisify(fs.readFile);
  if (argv.input) {
    try {
      const str = await readFile(argv.input);
      format(str.toString());
    } catch (err) {
      console.error(err);
    }
  } else {
    try {
      const str = await getStdin();
      format(str.toString());
    } catch (err) {
      console.error(err);
    }
  }
}

if (require.main === module) {
  // Called via CLI.
  if (!argv.help) {
    main();
  }
} else {
  // Called via require.
  module.exports = main;
}
