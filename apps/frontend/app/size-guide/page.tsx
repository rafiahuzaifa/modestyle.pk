import { ContentPage, contentPageMetadata } from "@/app/components/content/ContentPage";

// Content is edited in Admin → Pages.
export const generateMetadata = () => contentPageMetadata("size-guide");

export default function Page() {
  return <ContentPage slug="size-guide" />;
}
