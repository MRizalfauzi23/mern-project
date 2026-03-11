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
  async findMany({ page, limit, search, role }) {
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (role) query.role = role;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    return { items, total };
  },
  updateRefreshToken(id, refreshToken) {
    return User.findByIdAndUpdate(id, { refreshToken }, { new: true }).select("+refreshToken");
  },
  updateById(id, payload) {
    return User.findByIdAndUpdate(id, payload, { new: true });
  },
  deleteById(id) {
    return User.findByIdAndDelete(id);
  }
};
