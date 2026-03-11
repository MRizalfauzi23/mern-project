import { ApiError } from "../utils/ApiError.js";
import { jobRepository } from "../repositories/jobRepository.js";

const SCREENING_TOTAL_KEYS = [
  "passThreshold",
  "reviewThreshold",
  "resumeWeight",
  "coverLetterWeight",
  "phoneWeight",
  "emailWeight",
  "keywordWeight"
];

function getScreeningTotal(config = {}) {
  return SCREENING_TOTAL_KEYS.reduce((sum, key) => sum + Number(config[key] || 0), 0);
}

export const jobService = {
  create(payload) {
    const screeningConfig = payload?.screeningConfig;
    if (screeningConfig) {
      const total = getScreeningTotal(screeningConfig);
      if (total > 100) {
        throw new ApiError(400, "Total nilai screening tidak boleh lebih dari 100.");
      }
    }
    return jobRepository.create(payload);
  },

  async getById(id) {
    const job = await jobRepository.findById(id);
    if (!job) throw new ApiError(404, "Job not found");
    return job;
  },

  async list({ page, limit, search, status, createdBy }) {
    const normalizedPage = Math.max(Number(page) || 1, 1);
    const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const { items, total } = await jobRepository.findMany({
      page: normalizedPage,
      limit: normalizedLimit,
      search,
      status,
      createdBy
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

  async update(id, payload, user) {
    const job = await jobRepository.findById(id);
    if (!job) throw new ApiError(404, "Job not found");
    if (user.role !== "admin" && job.createdBy.toString() !== user.id) {
      throw new ApiError(403, "Forbidden");
    }

    if (payload?.screeningConfig) {
      const jobAny = job as any;
      const currentConfig =
        typeof jobAny.screeningConfig?.toObject === "function"
          ? jobAny.screeningConfig.toObject()
          : jobAny.screeningConfig || {};
      const nextConfig = { ...currentConfig, ...payload.screeningConfig };
      const total = getScreeningTotal(nextConfig);
      if (total > 100) {
        throw new ApiError(400, "Total nilai screening tidak boleh lebih dari 100.");
      }
    }

    return jobRepository.updateById(id, payload);
  },

  async remove(id, user) {
    const job = await jobRepository.findById(id);
    if (!job) throw new ApiError(404, "Job not found");
    if (user.role !== "admin" && job.createdBy.toString() !== user.id) {
      throw new ApiError(403, "Forbidden");
    }
    return jobRepository.deleteById(id);
  }
};
