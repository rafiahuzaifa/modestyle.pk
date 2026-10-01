import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, projectId, isSanityConfigured } from "../env";

const nullClient = {
  fetch: async () => null,
  create: async () => {
    throw new Error("Sanity is not configured");
  },
  patch: () => {
    throw new Error("Sanity is not configured");
  },
  delete: async () => {
    throw new Error("Sanity is not configured");
  },
} as unknown as SanityClient;

/** Server-only client with write access. Never import this from client components. */
export const writeClient: SanityClient =
  isSanityConfigured && process.env.SANITY_TOKEN
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        token: process.env.SANITY_TOKEN,
        useCdn: false,
      })
    : nullClient;
