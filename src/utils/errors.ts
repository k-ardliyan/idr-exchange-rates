export class TimeoutError extends Error {
  constructor(message: string = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export const withTimeout = async <T>(
  promise: Promise<T>,
  milliseconds: number = 10000
): Promise<T> => {
  return await Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new TimeoutError(`Operation timed out after ${milliseconds}ms`)),
        milliseconds
      )
    ),
  ]);
};

type MappedHttpError = {
  status: number;
  type: string;
  detail: string;
};

export const mapErrorToHttp = (error: unknown): MappedHttpError => {
  const err = error as any;
  const name: string = err?.name ?? err?.constructor?.name ?? "UnknownError";
  const message: string = err?.message ?? "Unknown error occurred";
  const code: string | undefined = err?.code;
  const lowerMessage = String(message).toLowerCase();

  // If upstream already provided explicit HTTP status, respect it
  const explicitStatus: unknown = err?.status;
  if (typeof explicitStatus === "number" && explicitStatus >= 100 && explicitStatus <= 599) {
    return {
      status: explicitStatus,
      type: name || "UpstreamHttpError",
      detail: message,
    };
  }

  // Timeout / aborted
  if (
    name === "TimeoutError" ||
    name === "AbortError" ||
    lowerMessage.includes("timeout") ||
    code === "ETIMEDOUT"
  ) {
    return {
      status: 504,
      type: name || code || "TimeoutError",
      detail: message,
    };
  }

  // Network layer / DNS / connection issues -> Bad Gateway
  const networkCodes = new Set([
    "ENOTFOUND",
    "ECONNREFUSED",
    "ECONNRESET",
    "EAI_AGAIN",
    "EHOSTUNREACH",
    "ENETUNREACH",
  ]);
  if (code && networkCodes.has(code)) {
    return { status: 502, type: code, detail: message };
  }

  // Parsing/format issues from upstream HTML/JSON changes -> Bad Gateway
  if (
    name === "SyntaxError" ||
    lowerMessage.includes("parse") ||
    lowerMessage.includes("invalid")
  ) {
    return { status: 502, type: name, detail: message };
  }

  // Fallback: try to extract status from common error message pattern
  const match = /request failed with status\s+(\d{3})/i.exec(message);
  if (match) {
    const inferred = Number(match[1]);
    if (!Number.isNaN(inferred) && inferred >= 100 && inferred <= 599) {
      return { status: inferred, type: name || "UpstreamHttpError", detail: message };
    }
  }

  // Default -> Internal Server Error
  return { status: 500, type: name, detail: message };
};


