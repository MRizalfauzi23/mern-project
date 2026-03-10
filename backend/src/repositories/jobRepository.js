import { Job } from "../models/Job.js";

export const jobRepository = {
  create(payload) {
    return Job.create(payload);
  },
  findById(id) {
    return Job.findById(id);
  },
  findIdsByCreator(createdBy) {
    return Job.find({ createdBy }).select("_id");
  },
  async findMany({ page, limit, search, status, createdBy }) {
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }
    if (status) query.status = status;
    if (createdBy) query.createdBy = createdBy;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(query)
    ]);

    return { items, total };
  },
  updateById(id, payload) {
    return Job.findByIdAndUpdate(id, payload, { new: true });
  },
  deleteById(id) {
    return Job.findByIdAndDelete(id);
  }
};
