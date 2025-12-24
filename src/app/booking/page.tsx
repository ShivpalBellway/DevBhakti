import { Metadata } from "next";
import BookingClient from "./BookingClient";

export const metadata: Metadata = {
  title: "Book Pooja - DevBhakti",
  description: "Book pooja services and darshan at temples across India. Easy online booking for spiritual services.",
};

export default function BookingPage() {
  return <BookingClient />;
}
