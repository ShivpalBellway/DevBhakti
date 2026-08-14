import { Metadata } from "next";
import { use } from "react";
import MandalBookingClient from "./MandalBookingClient";

export const metadata: Metadata = {
  title: "Book Pooja - DevBhakti Mandals",
  description: "Book pooja services directly from the mandal. Easy step-by-step booking with instant Razorpay payment.",
};

export default function MandalBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <MandalBookingClient slug={slug} />;
}
