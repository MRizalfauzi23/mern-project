import { Application } from "../models/Application.js";

export const applicationRepository = {
  create(payload) {
    return Application.create(payload);
  },
  findById(id) {
    return Application.findById(id).populate(
      "job",
      "title company location description status screeningConfig createdBy"
    );
  },
  findOneByJobAndEmail(job, candidateEmail) {
    return Application.findOne({ job, candidateEmail });
  },
  async findMany({ page, limit, search, status, jobId, jobIds }) {
    const query = {};
    if (status) query.status = status;
    if (jobId && jobIds) {
      query.job = jobIds.some((id) => id.toString() === jobId) ? jobId : null;
    } else if (jobId) {
      query.job = jobId;
    } else if (jobIds) {
      query.job = { $in: jobIds };
    }
    if (search) {
      query.$or = [
        { candidateName: { $regex: search, $options: "i" } },
        { candidateEmail: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Application.find(query)
        .populate("job", "title company location description status screeningConfig createdBy")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(query)
    ]);

    return { items, total };
  },
  findForExport({ search, status, jobId, jobIds }) {
    const query = {};
    if (status) query.status = status;
    if (jobId && jobIds) {
      query.job = jobIds.some((id) => id.toString() === jobId) ? jobId : null;
    } else if (jobId) {
      query.job = jobId;
    } else if (jobIds) {
      query.job = { $in: jobIds };
    }
    if (search) {
      query.$or = [
        { candidateName: { $regex: search, $options: "i" } },
        { candidateEmail: { $regex: search, $options: "i" } }
      ];
    }

    return Application.find(query)
      .populate("job", "title company location status screeningConfig createdBy")
      .sort({ createdAt: -1 });
  },
  updateById(id, payload) {
    return Application.findByIdAndUpdate(id, payload, { new: true }).populate(
      "job",
      "title company location status createdBy"
    );
  }
};
