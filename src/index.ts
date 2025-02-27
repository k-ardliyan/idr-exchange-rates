import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { apiRoutes } from "./routes";

const port = process.env.PORT || 3000;

const app = new Elysia()
  .get("/", ({ redirect }) => {
    return redirect("/api");
  })
  .group("/api", (app) =>
    app
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
      .use(apiRoutes)
  )
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
  .listen(port);

console.log(`🚀 Server running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`View documentation at "${app.server!.url}docs" in your browser`);
