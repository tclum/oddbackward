import { siteConfig } from "@/config/site";

/*
  One quiet contact line under the work index. Server component on purpose:
  the line must be in the exported HTML with no JS, so a visitor who never
  plays the orbit reveal still sees how to get in touch.
*/
export function ContactLine() {
  return (
    <p className="contact-line">
      Making, fixing, or simplifying something? Send the rough version to{" "}
      <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
    </p>
  );
}
