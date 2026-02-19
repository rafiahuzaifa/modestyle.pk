import { type SchemaTypeDefinition } from "sanity";
import { product } from "./schemas/product";
import { category } from "./schemas/category";
import { banner } from "./schemas/banner";
import { siteSettings } from "./schemas/siteSettings";
import { review } from "./schemas/review";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, category, banner, siteSettings, review],
};
