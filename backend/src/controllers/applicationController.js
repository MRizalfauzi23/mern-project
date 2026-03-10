import { applicationService } from "../services/applicationService.js";
import { apiResponse } from "../utils/apiResponse.js";
import { catchAsync } from "../utils/catchAsync.js";

export const applicationController = {
  create: catchAsync(async (req, res) => {
    const { body } = req.validated;
    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : body.resumeUrl;
    const application = await applicationService.create({ ...body, resumeUrl }, req.user);
    res.status(201).json(apiResponse({ message: "Application created", data: { application } }));
  }),
  publicCreate: catchAsync(async (req, res) => {
    const { body } = req.validated;
    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : body.resumeUrl;
    const { status, ...rest } = body;
    const application = await applicationService.create({ ...rest, resumeUrl }, null);
    res.status(201).json(apiResponse({ message: "Application created", data: { application } }));
  }),

  list: catchAsync(async (req, res) => {
    const { query } = req.validated;
    const result = await applicationService.list(query, req.user);
    res.json(apiResponse({ data: { applications: result.items }, meta: result.meta }));
  }),

  getById: catchAsync(async (req, res) => {
    const { params } = req.validated;
    const application = await applicationService.getById(params.id, req.user);
    res.json(apiResponse({ data: { application } }));
  }),

  updateStatus: catchAsync(async (req, res) => {
    const { params, body } = req.validated;
    const application = await applicationService.updateStatus(params.id, body.status, req.user);
    res.json(apiResponse({ message: "Application status updated", data: { application } }));
  }),

  addNote: catchAsync(async (req, res) => {
    const { params, body } = req.validated;
    const application = await applicationService.addNote(params.id, body.note, req.user);
    res.json(apiResponse({ message: "Application note added", data: { application } }));
  }),

  rerunScreening: catchAsync(async (req, res) => {
    const { params } = req.validated;
    const application = await applicationService.rerunScreening(params.id, req.user);
    res.json(apiResponse({ message: "Application screening updated", data: { application } }));
  }),

  exportExcel: catchAsync(async (req, res) => {
    const { query } = req.validated;
    const excelBuffer = await applicationService.exportExcel(query, req.user);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="applications-report-${timestamp}.xlsx"`
    );
    res.status(200).send(Buffer.from(excelBuffer));
  })
};
