import { t, type TSchema } from "elysia";

export const ErrorBodySchema = t.Object({
  type: t.String({
    description: "Type of error that occurred",
    example: "TimeoutError",
  }),
  detail: t.String({
    description: "Detailed error information",
    example: "Request took too long to respond",
  }),
  code: t.Number({
    description: "HTTP status code",
    example: 500,
  }),
});

export const ApiErrorResponseSchema = t.Object({
  success: t.Boolean({
    description: "Indicates if the request was successful",
    example: false,
  }),
  message: t.String({
    description: "Error message description",
  }),
  error: ErrorBodySchema,
});

/** JSON body for global `onError` / consistent API errors (matches {@link ApiErrorResponseSchema}). */
export const jsonApiError = (
  message: string,
  type: string,
  detail: string,
  httpCode: number,
) =>
  ({
    success: false as const,
    message,
    error: { type, detail, code: httpCode },
  }) satisfies typeof ApiErrorResponseSchema.static;

export const apiSuccessResponseSchema = (dataSchema: TSchema) =>
  t.Object({
    success: t.Boolean({
      description: "Indicates if the request was successful",
      example: true,
    }),
    message: t.String({
      description: "Response message",
      example: "Exchange rates retrieved successfully",
    }),
    data: dataSchema,
  });
