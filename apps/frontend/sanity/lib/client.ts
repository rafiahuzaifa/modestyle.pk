import { createClient, type SanityClient } from 'next-sanity'

import { apiVersion, dataset, projectId, isSanityConfigured } from '../env'

/** A no-op client that always returns empty results when Sanity isn't configured */
const nullClient = {
  fetch: async () => null,
  config: () => ({}),
} as unknown as SanityClient

export const client: SanityClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    })
  : nullClient
