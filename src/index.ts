import { Elysia } from "elysia";
import { apiRoutes } from "./routes";
import swagger from "@elysiajs/swagger";

const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
  .use(apiRoutes)
  .get(
    "/",
    ({ redirect }) => {
      return redirect("/docs");
    },
    {
      detail: {
        hide: true,
      },
    }
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
            url: "https://github.com/k-ardliyan",
          },
          version: process.env.npm_package_version || "1.0.0",
          description:
            "API for fetching Indonesian Rupiah exchange rates from multiple banks\nhttps://github.com/k-ardliyan/idr-exchange-rates",
        },
      },
    })
  )
  .onStart(({ server }) => {
    if (server) {
      console.log("IDR Exchange Rates API\n");
      console.log(`🚀 Server running at ${server.url}`);
      console.log(
        `✨ View documentation at "${server.url}docs" in your browser`
      );
    }
  })
  .onError(({ code }) => {
    if (code === "NOT_FOUND")
      return {
        success: false,
        message: "Endpoint not found, please check the documentation",
        error: {
          type: code,
          detail: "Endpoint not found",
          code: 404,
        },
      };
  })
  .listen(port);
