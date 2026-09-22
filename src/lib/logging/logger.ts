const isDev = process.env.NODE_ENV === 'development';

function safeStringify(val: unknown): string {
  if (val instanceof Error) return val.message;
  if (typeof val === 'string') return val;
  try { return JSON.stringify(val); } catch { return String(val); }
}

export const logger = {
  error(message: string, err?: unknown) {
    // Never log raw env secrets or tokens — only message + safe stringified error
    console.error(`[ERROR] ${message}`, err ? safeStringify(err) : '');
  },
  warn(message: string, detail?: unknown) {
    console.warn(`[WARN] ${message}`, detail ? safeStringify(detail) : '');
  },
  info(message: string) {
    if (isDev) console.log(`[INFO] ${message}`);
  },
};
