import { Elysia } from "elysia";
import {
  ApiErrorResponseSchema,
  ErrorBodySchema,
  apiSuccessResponseSchema,
} from "../models/api-response";
import { DataSchema as BcaRatesData } from "../features/bca/schema";
import { DataSchema as BiRatesData } from "../features/bi/schema";
import { DataSchema as BniRatesData } from "../features/bni/schema";
import { DataSchema as BriRatesData } from "../features/bri/schema";
import { DataSchema as MandiriRatesData } from "../features/mandiri/schema";

export const apiModels = new Elysia({ name: "api-models" }).model({
  "api.errorBody": ErrorBodySchema,
  "api.errorResponse": ApiErrorResponseSchema,
  "rates.bcaSuccess": apiSuccessResponseSchema(BcaRatesData),
  "rates.biSuccess": apiSuccessResponseSchema(BiRatesData),
  "rates.bniSuccess": apiSuccessResponseSchema(BniRatesData),
  "rates.briSuccess": apiSuccessResponseSchema(BriRatesData),
  "rates.mandiriSuccess": apiSuccessResponseSchema(MandiriRatesData),
});
