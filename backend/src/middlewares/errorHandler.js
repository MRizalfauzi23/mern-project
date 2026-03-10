export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== "production";

  return res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    details: err.details || null,
    stack: isDev ? err.stack : undefined
  });
}

