class ITokenService {
  signAccessToken(_payload) {
    throw new Error('ITokenService.signAccessToken not implemented');
  }

  signRefreshToken(_payload) {
    throw new Error('ITokenService.signRefreshToken not implemented');
  }

  verifyAccessToken(_token) {
    throw new Error('ITokenService.verifyAccessToken not implemented');
  }

  verifyRefreshToken(_token) {
    throw new Error('ITokenService.verifyRefreshToken not implemented');
  }

  hashToken(_token) {
    throw new Error('ITokenService.hashToken not implemented');
  }
}

module.exports = ITokenService;
