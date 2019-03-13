# openscad-format
A source code formatter for the OpenSCAD language.

Currently it's opinionated, but there may be improvements in the future which
allow you to alter the code style it enforces.

## Install
The utility is available on [npm](https://www.npmjs.com/package/openscad-format), you can install it like so:
```
$ npm install -g openscad-format
```
It packages `clang-format` with it for most platforms, so you don't need to
worry about installing it.

## Use
`openscad-format` is designed to be simple and flexible to use:
```
$ openscad-format --help
Usage: openscad-format [options]

Options:
  --version     Show version number                                    [boolean]
  -i, --input   Input file to read, file globs allowed (quotes recommended)
  -o, --output  Output file to write
  -h, --help    Show help                                              [boolean]

Examples:
  openscad-format -i input.scad -o output.scad  Formats input.scad and saves it as
                                                output.scad
  openscad-format < input.scad > output.scad    Formats input.scad and saves it as
                                                output.scad
  openscad-format < input.scad                  Formats input.scad and writes to stdout
  cat input.scad | openscad-format | less       Formats input.scad and displays in less
  openscad-format -i './**/*.scad'              Formats all *.scad files recursively
                                                and writes them to their respective
                                                files

This utility requires clang-format, but this is automatically installed for most
platforms.
```

## Contribute
Make sure your PR's pass the unit tests and are free of ESLint errors. To check,
run `npm run all` and it will guide you through what needs to be done.
