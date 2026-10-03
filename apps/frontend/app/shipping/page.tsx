import { ContentPage, contentPageMetadata } from "@/app/components/content/ContentPage";

// Content is edited in Admin → Pages.
export const generateMetadata = () => contentPageMetadata("shipping");

export default function Page() {
  return <ContentPage slug="shipping" />;
}
