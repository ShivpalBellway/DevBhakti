import { Metadata } from "next";
import DarshanBookingClient from "./DarshanBookingClient";

export const metadata: Metadata = {
  title: "Book Darshan - DevBhakti",
  description: "Book your darshan slot easily on DevBhakti.",
};

export default function DarshanBookingPage() {
  return <DarshanBookingClient />;
}
