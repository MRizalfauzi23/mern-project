import { userService } from "../services/userService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { apiResponse } from "../utils/apiResponse.js";

export const userController = {
  create: catchAsync(async (req, res) => {
    const { body } = req.validated;
    const user = await userService.create(body);
    res.status(201).json(
      apiResponse({
        message: "User created",
        data: { user }
      })
    );
  }),

  list: catchAsync(async (req, res) => {
    const { query } = req.validated;
    const result = await userService.list(query);
    res.json(apiResponse({ data: { users: result.items }, meta: result.meta }));
  }),

  getById: catchAsync(async (req, res) => {
    const { params } = req.validated;
    const user = await userService.getById(params.id);
    res.json(apiResponse({ data: { user } }));
  }),

  update: catchAsync(async (req, res) => {
    const { body, params } = req.validated;
    const user = await userService.update(params.id, body, req.user);
    res.json(apiResponse({ message: "User updated", data: { user } }));
  }),

  remove: catchAsync(async (req, res) => {
    const { params } = req.validated;
    await userService.remove(params.id, req.user);
    res.json(apiResponse({ message: "User deleted" }));
  })
};
