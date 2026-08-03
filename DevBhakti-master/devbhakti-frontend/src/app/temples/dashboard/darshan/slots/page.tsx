import { Metadata } from "next";
import DarshanSlotsClient from "./DarshanSlotsClient";

export const metadata: Metadata = {
  title: "Manage Darshan Slots - Temple Admin",
  description: "Create and manage Darshan slots.",
};

export default function DarshanSlotsPage() {
  return <DarshanSlotsClient />;
}
