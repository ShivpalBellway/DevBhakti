import { Metadata } from "next";
import DarshanOverviewClient from "./DarshanOverviewClient";

export const metadata: Metadata = {
  title: "Darshan Settings - Temple Admin",
  description: "Manage Darshan availability and pricing.",
};

export default function DarshanOverviewPage() {
  return <DarshanOverviewClient />;
}
