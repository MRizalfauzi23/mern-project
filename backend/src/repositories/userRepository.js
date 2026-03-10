import { User } from "../models/User.js";

export const userRepository = {
  findByEmail(email) {
    return User.findOne({ email }).select("+password +refreshToken");
  },
  findById(id) {
    return User.findById(id);
  },
  findByIdWithRefreshToken(id) {
    return User.findById(id).select("+refreshToken");
  },
  create(payload) {
    return User.create(payload);
  },
  updateRefreshToken(id, refreshToken) {
    return User.findByIdAndUpdate(id, { refreshToken }, { new: true }).select("+refreshToken");
  }
};
