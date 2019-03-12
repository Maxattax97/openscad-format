/* eslint-env mocha */
const { expect } = require('chai');
const format = require('../index.js');

describe('Main', () => {
  describe('stdin & stdout', () => {
    it('should read from stdin and write to stdout', (done) => {
      expect(true).to.equal(true);
      done();
    });
  });
  describe('glob input', () => {
    it('should select multiple files from a glob string', async (done) => {
      try {
        const result = await format('./test/dirty/source.scad', './test/comparing/source.scad');
        console.log(result);
        expect(result).to.equal(null);
      } catch (err) {
        done(err);
      }
    });
  });
});
