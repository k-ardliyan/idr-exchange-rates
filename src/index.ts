import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { apiRoutes } from "./routes";

const port = process.env.PORT || 3000;

const app = new Elysia()
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "IDR Exchange Rates API",
          license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT",
          },
          contact: {
            name: "k-ardliyan",
            email: "k.ardliyan@gmail.com",
            url: "https://github.com/k-ardliyan",
          },
          version: "1.0.0",
          description:
            "API for fetching Indonesian Rupiah exchange rates from multiple banks",
        },
      },
    })
  )
  .get(
    "/",
    () => ({
      name: "IDR Exchange Rates API",
      version: "1.0.0",
      description:
        "API for fetching Indonesian Rupiah exchange rates from multiple banks",
      documentation: "/docs",
      author: "k-ardliyan",
      repository: "https://github.com/k-ardliyan/idr-exchange-rates",
    }),
    {
      detail: {
        hide: true,
      },
    }
  )
  .group("/api", (app) =>
    app
      .get(
        "/",
        () => ({
          message: "Welcome to IDR Exchange Rates API",
        }),
        {
          detail: {
            hide: true,
          },
        }
      )
      .use(apiRoutes)
  )
  .listen(port);

console.log(`🚀 Server running at ${app.server?.hostname}:${app.server?.port}`);
