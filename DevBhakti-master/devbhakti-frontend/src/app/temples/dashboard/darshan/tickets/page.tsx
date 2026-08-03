import { Metadata } from "next";
import DarshanTicketsClient from "./DarshanTicketsClient";

export const metadata: Metadata = {
  title: "Darshan Tickets - Temple Admin",
  description: "View and manage Darshan tickets.",
};

export default function DarshanTicketsPage() {
  return <DarshanTicketsClient />;
}
