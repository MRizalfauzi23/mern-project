import { Job } from "../models/Job.js";

export const jobRepository = {
  create(payload: any) {
    return Job.create(payload);
  },
  findById(id: string) {
    return Job.findById(id);
  },
  findIdsByCreator(createdBy: string) {
    return Job.find({ createdBy }).select("_id");
  },
  async findMany({ page, limit, search, status, createdBy }: any) {
    const query: Record<string, any> = {};
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
  updateById(id: string, payload: any) {
    return Job.findByIdAndUpdate(id, payload, { new: true });
  },
  deleteById(id: string) {
    return Job.findByIdAndDelete(id);
  }
};
