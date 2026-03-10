import { ApiError } from "../utils/ApiError.js";
import { applicationRepository } from "../repositories/applicationRepository.js";
import { jobRepository } from "../repositories/jobRepository.js";
import { evaluateApplication } from "../utils/screening.js";
import ExcelJS from "exceljs";

export const applicationService = {
  async create(payload, user) {
    const job = await jobRepository.findById(payload.jobId);
    if (!job) throw new ApiError(404, "Job not found");

    const existing = await applicationRepository.findOneByJobAndEmail(
      payload.jobId,
      payload.candidateEmail
    );
    if (existing) throw new ApiError(409, "Application already exists for this candidate and job");

    const screening = evaluateApplication({
      job,
      candidateEmail: payload.candidateEmail,
      phone: payload.phone,
      coverLetter: payload.coverLetter,
      resumeUrl: payload.resumeUrl
    });
    const initialStatus = payload.status || screening.screeningRecommendedStatus;

    const createdBy = user?.id || job.createdBy;

    return applicationRepository.create({
      job: payload.jobId,
      candidateName: payload.candidateName,
      candidateEmail: payload.candidateEmail,
      phone: payload.phone || "",
      resumeUrl: payload.resumeUrl || "",
      coverLetter: payload.coverLetter || "",
      status: initialStatus,
      screeningScore: screening.screeningScore,
      screeningResult: screening.screeningResult,
      screeningRecommendedStatus: screening.screeningRecommendedStatus,
      screeningBreakdown: screening.screeningBreakdown,
      screeningReasons: screening.screeningReasons,
      screeningConfigUsed: screening.screeningConfigUsed,
      screenedAt: screening.screenedAt,
      statusHistory: [{ status: initialStatus }],
      recruiterNotes: [],
      createdBy
    });
  },

  async list({ page, limit, search, status, jobId }, user) {
    const normalizedPage = Math.max(Number(page) || 1, 1);
    const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    let jobIds;
    if (user.role === "recruiter") {
      const ownedJobs = await jobRepository.findIdsByCreator(user.id);
      jobIds = ownedJobs.map((job) => job._id);
    }
    const { items, total } = await applicationRepository.findMany({
      page: normalizedPage,
      limit: normalizedLimit,
      search,
      status,
      jobId,
      jobIds
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

  async getById(id, user) {
    const application = await applicationRepository.findById(id);
    if (!application) throw new ApiError(404, "Application not found");
    if (user.role === "recruiter" && application.job?.createdBy?.toString() !== user.id) {
      throw new ApiError(403, "Forbidden");
    }
    return application;
  },

  async updateStatus(id, status, user) {
    const application = await applicationRepository.findById(id);
    if (!application) throw new ApiError(404, "Application not found");
    if (user.role === "recruiter" && application.job?.createdBy?.toString() !== user.id) {
      throw new ApiError(403, "Forbidden");
    }
    return applicationRepository.updateById(id, {
      $set: { status },
      $push: { statusHistory: { status } }
    });
  },

  async addNote(id, note, user) {
    const application = await applicationRepository.findById(id);
    if (!application) throw new ApiError(404, "Application not found");
    if (user.role === "recruiter" && application.job?.createdBy?.toString() !== user.id) {
      throw new ApiError(403, "Forbidden");
    }

    return applicationRepository.updateById(id, {
      $push: {
        recruiterNotes: {
          note,
          authorEmail: user.email
        }
      }
    });
  },

  async rerunScreening(id, user) {
    const application = await applicationRepository.findById(id);
    if (!application) throw new ApiError(404, "Application not found");
    if (user.role === "recruiter" && application.job?.createdBy?.toString() !== user.id) {
      throw new ApiError(403, "Forbidden");
    }

    const screening = evaluateApplication({
      job: application.job,
      candidateEmail: application.candidateEmail,
      phone: application.phone,
      coverLetter: application.coverLetter,
      resumeUrl: application.resumeUrl
    });

    return applicationRepository.updateById(id, {
      $set: {
        screeningScore: screening.screeningScore,
        screeningResult: screening.screeningResult,
        screeningRecommendedStatus: screening.screeningRecommendedStatus,
        screeningBreakdown: screening.screeningBreakdown,
        screeningReasons: screening.screeningReasons,
        screeningConfigUsed: screening.screeningConfigUsed,
        screenedAt: screening.screenedAt
      }
    });
  },

  async exportExcel({ search, status, jobId }, user) {
    let jobIds;
    if (user.role === "recruiter") {
      const ownedJobs = await jobRepository.findIdsByCreator(user.id);
      jobIds = ownedJobs.map((job) => job._id);
    }
    const items = await applicationRepository.findForExport({ search, status, jobId, jobIds });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Applications");
    worksheet.columns = [
      { header: "Application ID", key: "id", width: 24 },
      { header: "Candidate Name", key: "candidateName", width: 22 },
      { header: "Candidate Email", key: "candidateEmail", width: 26 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Job Title", key: "jobTitle", width: 22 },
      { header: "Company", key: "company", width: 18 },
      { header: "Location", key: "location", width: 18 },
      { header: "Application Status", key: "status", width: 14 },
      { header: "Screening Score", key: "screeningScore", width: 16 },
      { header: "Screening Result", key: "screeningResult", width: 18 },
      { header: "Recommended Status", key: "recommendedStatus", width: 18 },
      { header: "Screened At", key: "screenedAt", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Screening Reasons", key: "screeningReasons", width: 30 }
    ];

    items.forEach((item) => {
      worksheet.addRow({
        id: item._id?.toString?.() || String(item._id),
        candidateName: item.candidateName,
        candidateEmail: item.candidateEmail,
        phone: item.phone || "",
        jobTitle: item.job?.title || "",
        company: item.job?.company || "",
        location: item.job?.location || "",
        status: item.status,
        screeningScore: item.screeningScore ?? 0,
        screeningResult: item.screeningResult || "",
        recommendedStatus: item.screeningRecommendedStatus || "",
        screenedAt: item.screenedAt ? new Date(item.screenedAt) : "",
        createdAt: item.createdAt ? new Date(item.createdAt) : "",
        screeningReasons: (item.screeningReasons || []).join(" | ")
      });
    });

    worksheet.getRow(1).font = { bold: true };
    return workbook.xlsx.writeBuffer();
  }
};
