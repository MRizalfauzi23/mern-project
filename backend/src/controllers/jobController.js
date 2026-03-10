import { jobService } from "../services/jobService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { apiResponse } from "../utils/apiResponse.js";

export const jobController = {
  create: catchAsync(async (req, res) => {
    const { body } = req.validated;
    const job = await jobService.create({ ...body, createdBy: req.user.id });
    res.status(201).json(apiResponse({ message: "Job created", data: { job } }));
  }),

  list: catchAsync(async (req, res) => {
    const { query } = req.validated;
    const result = await jobService.list(query);
    res.json(apiResponse({ data: { jobs: result.items }, meta: result.meta }));
  }),

  getById: catchAsync(async (req, res) => {
    const { params } = req.validated;
    const job = await jobService.getById(params.id);
    res.json(apiResponse({ data: { job } }));
  }),

  update: catchAsync(async (req, res) => {
    const { body, params } = req.validated;
    const job = await jobService.update(params.id, body, req.user);
    res.json(apiResponse({ message: "Job updated", data: { job } }));
  }),

  remove: catchAsync(async (req, res) => {
    const { params } = req.validated;
    await jobService.remove(params.id, req.user);
    res.json(apiResponse({ message: "Job deleted" }));
  })
};
