import { ErrorCode } from './errorCodes';

export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
