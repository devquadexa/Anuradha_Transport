const IHasher = require('../../application/interfaces/IHasher');

/**
 * Plain-text hasher for development/testing only.
 * Stores passwords as-is without hashing.
 * DO NOT use in production!
 */
class PlainTextHasher extends IHasher {
  async hash(plainText) {
    return plainText;
  }

  async compare(plainText, hash) {
    return plainText === hash;
  }
}

module.exports = new PlainTextHasher();
