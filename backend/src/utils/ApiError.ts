export class ApiError extends Error {
  statusCode: number;
  details: unknown;
  isOperational: boolean;

  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

