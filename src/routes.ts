import { Elysia } from "elysia";
import { mandiriRoutes } from "./features/mandiri";
import { bcaRoutes } from "./features/bca";
import { biRoutes } from "./features/bi";
import { bniRoutes } from "./features/bni";

export const apiRoutes = new Elysia({ prefix: "/api" })
  .get(
    "/",
    ({ server }) => {
      return {
        name: "IDR Exchange Rates API",
        version: process.env.npm_package_version,
        author: "k-ardliyan",
        documentation: `${server?.url}docs`,
        repository: "https://github.com/k-ardliyan/idr-exchange-rates",
      };
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
