import { ZodError } from "zod";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "MODEL_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "DAILY_CAP_REACHED"
  | "INTERNAL";

const STATUS: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  MODEL_NOT_ALLOWED: 403,
  RATE_LIMITED: 429,
  DAILY_CAP_REACHED: 429,
  INTERNAL: 500,
};

/** The JSON body of every error response. The client parses this shape. */
export type ApiErrorBody = {
  error: { code: ApiErrorCode; message: string; resetAt?: string };
};

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly options: { resetAt?: Date; retryAfterSeconds?: number } = {},
  ) {
    super(message);
  }
}

export function errorResponse(err: unknown): Response {
  // ZodError: failed validation. SyntaxError: body wasn't valid JSON.
  if (err instanceof ZodError || err instanceof SyntaxError) {
    return json({ code: "INVALID_INPUT", message: "Invalid request." }, 400);
  }
  if (err instanceof ApiError) {
    const headers: HeadersInit = {};
    if (err.options.retryAfterSeconds !== undefined) {
      headers["Retry-After"] = String(err.options.retryAfterSeconds);
    }
    return json(
      {
        code: err.code,
        message: err.message,
        resetAt: err.options.resetAt?.toISOString(),
      },
      STATUS[err.code],
      headers,
    );
  }
  console.error(err);
  return json({ code: "INTERNAL", message: "Something went wrong." }, 500);
}

function json(error: ApiErrorBody["error"], status: number, headers?: HeadersInit) {
  return Response.json({ error } satisfies ApiErrorBody, { status, headers });
}

/** Wraps a route handler so any thrown error becomes a consistent JSON response. */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
