class RefreshToken {
  constructor({ id, userId, tokenHash, expiresAt, revokedAt, replacedByTokenHash, userAgent, ipAddress, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.tokenHash = tokenHash;
    this.expiresAt = expiresAt;
    this.revokedAt = revokedAt;
    this.replacedByTokenHash = replacedByTokenHash;
    this.userAgent = userAgent;
    this.ipAddress = ipAddress;
    this.createdAt = createdAt;
  }

  isExpired() {
    return new Date(this.expiresAt).getTime() < Date.now();
  }

  isRevoked() {
    return !!this.revokedAt;
  }

  isActive() {
    return !this.isExpired() && !this.isRevoked();
  }
}

module.exports = RefreshToken;
