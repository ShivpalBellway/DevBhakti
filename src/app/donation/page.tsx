import { Metadata } from "next";
import DonationClient from "./DonationClient";

export const metadata: Metadata = {
  title: "Make a Donation - DevBhakti",
  description: "Support temples across India with your donations. Contribute to annadaan, temple renovation, education and more.",
};

export default function DonationPage() {
  return <DonationClient />;
}
