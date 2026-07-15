export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}

export function createError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  if (details) error.details = details;
  return error;
}
