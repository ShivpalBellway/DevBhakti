import { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";
import ContactClient from "./ContactClient";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Contact DevBhakti | Get in Touch with Us",
    description: "Have questions or need support? Contact the DevBhakti team for help with temple bookings, darshan, or partnerships.",
    keywords: "contact devbhakti, temple support, divinity labs, temple partnerships",
  };

  return getPageMetadata("contact", fallback);
}

export default function ContactPage() {
  return <ContactClient />;
}
