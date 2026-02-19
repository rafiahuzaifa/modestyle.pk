export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-16'

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''

/** Whether Sanity is properly configured (not a placeholder) */
export const isSanityConfigured =
  !!projectId && !projectId.startsWith('your_') && /^[a-z0-9-]+$/.test(projectId)
