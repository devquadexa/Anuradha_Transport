const { toUserResponseDto } = require('./UserDto');

function toLoginResponseDto({ user, accessToken, refreshToken, role }) {
  return {
    user: {
      ...toUserResponseDto(user),
      role: role ? role.name : null,
      permissions: role ? role.permissions : [],
    },
    accessToken,
    refreshToken,
  };
}

module.exports = { toLoginResponseDto };
