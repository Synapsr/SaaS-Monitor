import { SOCIAL_IMAGE_SIZE, socialImage } from "@/components/site/social-image";
import { siteText } from "@/lib/site/i18n";

const text = siteText("en");

export const alt = text.meta.imageAlt;
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = "image/png";

/** The preview of the product's pages (sign-up, invitations), in English like them. */
export default function OpenGraphImage() {
  return socialImage(text, "en-US");
}
