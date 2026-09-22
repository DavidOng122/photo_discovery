import { NextResponse } from 'next/server';
import { AppError } from './AppError';
import { logger } from '@/lib/logging/logger';

export function handleApiError(err: unknown, context?: string): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.statusCode }
    );
  }

  logger.error(`Unhandled error${context ? ` in ${context}` : ''}`, err);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: '予期しないエラーが発生しました。' } },
    { status: 500 }
  );
}
