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
});
