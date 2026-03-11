import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError.js";
import { userRepository } from "../repositories/userRepository.js";

export const userService = {
  async create({ name, email, password, role }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ApiError(409, "Email already used");
    return userRepository.create({ name, email, password, role });
  },

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, "User not found");
    return user;
  },

  async list({ page, limit, search, role }) {
    const normalizedPage = Math.max(Number(page) || 1, 1);
    const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const { items, total } = await userRepository.findMany({
      page: normalizedPage,
      limit: normalizedLimit,
      search,
      role
    });

    return {
      items,
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit)
      }
    };
  },

  async update(id, payload, actor) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, "User not found");

    if (actor?.id === id && payload?.role && payload.role !== "admin") {
      throw new ApiError(400, "Cannot change your own role");
    }

    if (payload?.email) {
      const existing = await userRepository.findByEmail(payload.email);
      if (existing && existing._id.toString() !== id) {
        throw new ApiError(409, "Email already used");
      }
    }

    const updatePayload = { ...payload };
    if (payload?.password) {
      updatePayload.password = await bcrypt.hash(payload.password, 10);
    }

    return userRepository.updateById(id, updatePayload);
  },

  async remove(id, actor) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, "User not found");
    if (actor?.id === id) {
      throw new ApiError(400, "Cannot delete your own account");
    }
    return userRepository.deleteById(id);
  }
};
