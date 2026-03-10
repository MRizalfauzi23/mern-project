import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";
import { userRepository } from "../repositories/userRepository.js";

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized");
    }

    const token = header.replace("Bearer ", "");
    const decoded = verifyAccessToken(token);
    const user = await userRepository.findById(decoded.sub);
    if (!user) throw new ApiError(401, "Unauthorized");

    req.user = { id: user._id.toString(), role: user.role, email: user.email };
    next();
  } catch (error) {
    next(new ApiError(401, "Unauthorized"));
  }
}

export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden"));
    }
    return next();
  };
}

