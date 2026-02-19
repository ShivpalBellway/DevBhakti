import { Metadata } from "next";
import DonationClient from "./DonationClient";

export const metadata: Metadata = {
    title: "Donate to Temples - DevBhakti",
    description: "Support your favorite temples with a heartfelt donation. Every contribution helps maintain sacred spaces and continue divine services.",
    keywords: "temple donation, donate online, sacred temples, spiritual giving, Hindu temple support",
};

export default function DonationPage() {
    return <DonationClient />;
}
