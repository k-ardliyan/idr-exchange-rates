import { Elysia, status } from "elysia";
import { cors } from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { apiRoutes } from "./routes";
import { jsonApiError } from "./models/api-response";

const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";
/** Comma-separated origins, or omit / empty for permissive CORS (credentials off for `*` per browser rules) */
const corsOriginEnv = process.env.CORS_ORIGIN?.trim();
const corsOrigins =
  corsOriginEnv && corsOriginEnv.length > 0
    ? corsOriginEnv.split(",").map((o) => o.trim())
    : undefined;

const swaggerDocumentation = {
  info: {
    title: "IDR Exchange Rates API",
    contact: {
      name: "k-ardliyan",
      url: "https://github.com/k-ardliyan",
    },
    version: process.env.npm_package_version || "1.0.0",
    description: [
      "**Personal learning project** — this repository is for exploring technologies and practicing API development only; it is not a production service or commercial product.",
      "",
      "API that fetches Indonesian Rupiah (IDR) exchange rates from several Indonesian banking sources.",
      "",
      "Repository: https://github.com/k-ardliyan/idr-exchange-rates",
    ].join("\n"),
  },
} as const;

const app = new Elysia({ name: "idr-exchange-rates" })
  .derive(({ request }) => ({
    requestId:
      request.headers.get("x-request-id")?.trim() || crypto.randomUUID(),
  }))
  .use(
    cors({
      origin: corsOrigins ?? true,
      methods: ["GET", "HEAD", "OPTIONS"],
      credentials: corsOrigins !== undefined,
    }),
  )
  .onAfterResponse(({ set, requestId }) => {
    set.headers["x-request-id"] = requestId;
  })
  .use(apiRoutes)
  .get("/", ({ redirect }) => redirect("/docs"), {
    detail: { hide: true },
  })
  .use(
    swagger({
      path: "/docs",
      documentation: swaggerDocumentation,
    }),
  )
  .onStart(({ server }) => {
    if (!server) return;
    console.log("IDR Exchange Rates API\n");
    console.log(`Server running at ${server.url}`);
    console.log(`Documentation: ${server.url}docs`);
  })
  .onError(({ code, error, requestId, set }) => {
    set.headers["x-request-id"] = requestId;

    if (code === "NOT_FOUND") {
      return status(
        404,
        jsonApiError(
          "Endpoint not found, please check the documentation",
          "NOT_FOUND",
          "Endpoint not found",
          404,
        ),
      );
    }

    if (code === "VALIDATION") {
      return status(
        422,
        jsonApiError(
          "Validation failed",
          "VALIDATION",
          error instanceof Error ? error.message : String(error),
          422,
        ),
      );
    }

    return status(
      500,
      jsonApiError(
        "Internal server error",
        typeof code === "string" ? code : "UNKNOWN",
        !isProduction && error instanceof Error
          ? error.message
          : "An unexpected error occurred",
        500,
      ),
    );
  })
  .listen(port);

export type App = typeof app;
