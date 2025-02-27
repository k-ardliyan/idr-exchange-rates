import { Elysia } from "elysia";
import { mandiriRoutes } from "./mandiri";
import { bcaRoutes } from "./bca";
import { biRoutes } from "./bi";

export const apiRoutes = new Elysia()
  .use(mandiriRoutes)
  .use(bcaRoutes)
  .use(biRoutes);
