import { ApiError } from "../utils/ApiError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { userRepository } from "../repositories/userRepository.js";

export const authService = {
  async register({ name, email, password, role }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ApiError(409, "Email already used");

    const user = await userRepository.create({ name, email, password, role });
    return user;
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new ApiError(401, "Invalid email or password");

    const validPassword = await user.comparePassword(password);
    if (!validPassword) throw new ApiError(401, "Invalid email or password");

    const payload = { sub: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await userRepository.updateRefreshToken(user._id, refreshToken);

    return { accessToken, refreshToken, user };
  },

  async refresh(refreshToken) {
    if (!refreshToken) throw new ApiError(401, "Refresh token required");

    const decoded = verifyRefreshToken(refreshToken);
    const user = await userRepository.findByIdWithRefreshToken(decoded.sub);
    if (!user) throw new ApiError(401, "Invalid refresh token");
    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const payload = { sub: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);

    return { accessToken };
  },

  async logout(userId) {
    await userRepository.updateRefreshToken(userId, null);
  }
};
