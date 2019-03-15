/* eslint-env mocha */
const { expect } = require('chai');
const fs = require('fs-extra');
const format = require('../index.js');

describe('Main', () => {
  describe('integration', () => {
    it('should pass a basic integration test', async () => {
      const result = await format({ dry: true, input: './test/dirty/integration-basic.scad' });
      let correct = await fs.readFile('./test/clean/integration-basic.scad');
      correct = correct.toString();
      expect(result).to.be.a('array');
      expect(result[0]).to.be.a(typeof {});
      expect(result[0].source).to.be.a(typeof '');
      expect(result[0].formatted).to.be.a(typeof '');
      expect(result[0].source).to.equal('./test/dirty/integration-basic.scad');
      expect(result[0].formatted).to.equal(correct);
    });
  });
  describe('custom configurations', () => {
    it('should follow the Google style', async () => {
      const result = await format({ dry: true, input: './test/dirty/integration-basic.scad', config: './test/configs/google-style' });
      let correct = await fs.readFile('./test/clean/style-google-integration-basic.scad');
      correct = correct.toString();
      expect(result[0].formatted).to.equal(correct);
    });

    it('should follow the LLVM style', async () => {
      const result = await format({ dry: true, input: './test/dirty/integration-basic.scad', config: './test/configs/llvm-style' });
      let correct = await fs.readFile('./test/clean/style-llvm-integration-basic.scad');
      correct = correct.toString();
      expect(result[0].formatted).to.equal(correct);
    });

    it('should follow the tabs style', async () => {
      const result = await format({ dry: true, input: './test/dirty/integration-basic.scad', config: './test/configs/tab-style' });
      let correct = await fs.readFile('./test/clean/style-tab-integration-basic.scad');
      correct = correct.toString();
      expect(result[0].formatted).to.equal(correct);
    });
  });
  describe.skip('stdin & stdout', () => {
    it('should read from stdin and write to stdout', (done) => {
      expect(true).to.equal(true);
      done();
    });
  });
  describe.skip('glob input', () => {
    it('should select multiple files from a glob string', async () => {
      const result = await format({ input: './test/dirty/source.scad', output: './test/comparing/source.scad' });
      expect(result[0].source).to.equal('./test/dirty/source.scad');
      expect(result[0].formatted).to.equal('include');
    });
  });
});
