import "server-only";
import { createClient } from "next-sanity";
import { revalidatePath, revalidateTag } from "next/cache";
import { apiVersion, dataset, projectId, isSanityConfigured } from "@/sanity/env";
import { writeClient } from "@/sanity/lib/write-client";
import { DEFAULT_PAGES, sanitizePage, type PageContent, type PageSlug } from "@/lib/content-pages";

const docId = (slug: PageSlug) => `contentPage-${slug}`;
const tag = (slug: PageSlug) => `page:${slug}`;

const readClient = isSanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: "published" })
  : null;

/** The page's saved content, or the built-in default if it was never edited. */
export async function getPage(slug: PageSlug): Promise<{ page: PageContent; customised: boolean }> {
  if (readClient) {
    try {
      const doc = await readClient.fetch<{ data?: string } | null>(
        `*[_id == $id][0]{ data }`,
        { id: docId(slug) },
        { next: { revalidate: 3600, tags: [tag(slug)] } }
      );
      if (doc?.data) return { page: sanitizePage(JSON.parse(doc.data)), customised: true };
    } catch (err) {
      console.error(`Failed to load page "${slug}", using default:`, err);
    }
  }
  return { page: DEFAULT_PAGES[slug], customised: false };
}

function refresh(slug: PageSlug) {
  revalidateTag(tag(slug));
  revalidatePath(`/${slug}`);
}

/** Saves admin edits (caller must check admin access). Returns the cleaned content. */
export async function savePage(slug: PageSlug, input: unknown) {
  const page = sanitizePage(input);
  if (!page.title) throw new Error("Page title is required.");
  await writeClient.createOrReplace({ _id: docId(slug), _type: "contentPage", slug, data: JSON.stringify(page) });
  refresh(slug);
  return page;
}

/** Deletes the saved version so the page falls back to the built-in default text. */
export async function resetPage(slug: PageSlug) {
  await writeClient.delete(docId(slug));
  refresh(slug);
  return DEFAULT_PAGES[slug];
}
