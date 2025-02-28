import { Elysia } from "elysia";
import { mandiriRoutes } from "./mandiri";
import { bcaRoutes } from "./bca";
import { biRoutes } from "./bi";
import { bniRoutes } from "./bni";

export const apiRoutes = new Elysia({ prefix: "/api" })
  .get(
    "/",
    {
      name: "IDR Exchange Rates API",
      version: "1.0.0",
      description:
        "API for fetching Indonesian Rupiah exchange rates from multiple banks",
      documentation: "/docs",
      author: "k-ardliyan",
      repository: "https://github.com/k-ardliyan/idr-exchange-rates",
    },
    {
      detail: {
        hide: true,
      },
    }
  )
  .use(bcaRoutes)
  .use(biRoutes)
  .use(bniRoutes)
  .use(mandiriRoutes);
