const ApiResponse = require('../../application/common/ApiResponse');
const { toLoginResponseDto } = require('../../application/dtos/AuthDto');
const { toUserResponseDto } = require('../../application/dtos/UserDto');

/**
 * Thin controller - delegates all logic to use cases injected via the
 * container. Controllers only translate HTTP <-> use case input/output.
 */
class AuthController {
  constructor({ loginUseCase, refreshTokenUseCase, logoutUseCase, getUserUseCase }) {
    this.loginUseCase = loginUseCase;
    this.refreshTokenUseCase = refreshTokenUseCase;
    this.logoutUseCase = logoutUseCase;
    this.getUserUseCase = getUserUseCase;
  }

  login = async (req, res) => {
    const { email, password } = req.body;
    const result = await this.loginUseCase.execute({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return ApiResponse.success(res, {
      message: 'Login successful',
      data: toLoginResponseDto(result),
    });
  };

  refresh = async (req, res) => {
    const { refreshToken } = req.body;
    const result = await this.refreshTokenUseCase.execute({
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return ApiResponse.success(res, {
      message: 'Token refreshed',
      data: toLoginResponseDto(result),
    });
  };

  logout = async (req, res) => {
    const { refreshToken } = req.body;
    await this.logoutUseCase.execute({ refreshToken });
    return ApiResponse.success(res, { message: 'Logged out successfully' });
  };

  me = async (req, res) => {
    const user = await this.getUserUseCase.execute(req.user.id);
    return ApiResponse.success(res, {
      message: 'Current user retrieved',
      data: { ...toUserResponseDto(user), role: req.user.role, permissions: req.user.permissions },
    });
  };
}

module.exports = AuthController;
