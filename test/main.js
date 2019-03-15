/* eslint-env mocha */
const { expect } = require('chai');
const fs = require('fs-extra');
const format = require('../index.js');

describe('Main', () => {
  describe('integration', () => {
    it('should pass a basic integration test', async (done) => {
      try {
        const result = await format({ input: './test/dirty/integration-basic.scad', output: './test/comparing/integration-basic.scad' });
        const correct = await fs.readFile('./test/clean/integration-basic.scad').toString();
        expect(result).to.be.a(typeof []);
        expect(result[0]).to.be.a(typeof {});
        expect(result[0].source).to.be.a(typeof '');
        expect(result[0].formatted).to.be.a(typeof '');
        expect(result[0].source).to.equal('./test/dirty/integration-basic.scad');
        expect(result[0].formatted).to.equal(correct);
      } catch (err) {
        done(err);
      }
    });
  });
  describe.skip('custom configurations', () => {
    it('should follow the default style', async (done) => {
      try {
        const result = await format({ input: './test/dirty/source.scad', output: './test/comparing/source.scad' });
        const correct = await fs.readFile('./test/clean/style-default.scad').toString();
        expect(result).to.equal(correct);
      } catch (err) {
        done(err);
      }
    });
  });
  describe.skip('stdin & stdout', () => {
    it('should read from stdin and write to stdout', (done) => {
      expect(true).to.equal(true);
      done();
    });
  });
  describe.skip('glob input', () => {
    it('should select multiple files from a glob string', async (done) => {
      try {
        const result = await format({ input: './test/dirty/source.scad', output: './test/comparing/source.scad' });
        expect(result[0].source).to.equal('./test/dirty/source.scad');
        expect(result[0].formatted).to.equal('include');
      } catch (err) {
        done(err);
      }
    });
  });
});
