import { User } from "../models/User.js";

export const userRepository = {
  findByEmail(email: string) {
    return User.findOne({ email }).select("+password +refreshToken");
  },
  findById(id: string) {
    return User.findById(id);
  },
  findByIdWithRefreshToken(id: string) {
    return User.findById(id).select("+refreshToken");
  },
  create(payload: any) {
    return User.create(payload);
  },
  async findMany({ page, limit, search, role }: any) {
    const query: Record<string, any> = {};
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
  updateRefreshToken(id: string, refreshToken: string | null) {
    return User.findByIdAndUpdate(id, { refreshToken }, { new: true }).select("+refreshToken");
  },
  updateById(id: string, payload: any) {
    return User.findByIdAndUpdate(id, payload, { new: true });
  },
  deleteById(id: string) {
    return User.findByIdAndDelete(id);
  }
};
