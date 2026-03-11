import { authService } from "../services/authService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { apiResponse } from "../utils/apiResponse.js";

export const authController = {
  register: catchAsync(async (req, res) => {
    const { body } = req.validated;
    const user = await authService.register(body);

    res.status(201).json(
      apiResponse({
        message: "Register success",
        data: {
          user: { id: user._id, name: user.name, email: user.email, role: user.role }
        }
      })
    );
  }),

  login: catchAsync(async (req, res) => {
    const { body } = req.validated;
    const { accessToken, refreshToken, user } = await authService.login(body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json(
      apiResponse({
        message: "Login success",
        data: {
          accessToken,
          user: { id: user._id, name: user.name, email: user.email, role: user.role }
        }
      })
    );
  }),

  refresh: catchAsync(async (req, res) => {
    const cookieToken = req.cookies.refreshToken;
    const bodyToken = req.body.refreshToken;
    const token = cookieToken || bodyToken;
    const { accessToken } = await authService.refresh(token);

    res.json(apiResponse({ message: "Token refreshed", data: { accessToken } }));
  }),

  logout: catchAsync(async (req, res) => {
    await authService.logout(req.user.id);
    res.clearCookie("refreshToken");
    res.json(apiResponse({ message: "Logout success" }));
  }),

  me: catchAsync(async (req, res) => {
    res.json(apiResponse({ data: { user: req.user } }));
  })
};
