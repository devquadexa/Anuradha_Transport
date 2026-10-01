class IHasher {
  async hash(_plainText) {
    throw new Error('IHasher.hash not implemented');
  }

  async compare(_plainText, _hash) {
    throw new Error('IHasher.compare not implemented');
  }
}

module.exports = IHasher;
