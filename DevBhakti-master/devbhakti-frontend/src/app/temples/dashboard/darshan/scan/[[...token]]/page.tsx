import { Metadata } from "next";
import DarshanScanClient from "./DarshanScanClient";

export const metadata: Metadata = {
  title: "Scan Darshan Ticket - Temple Admin",
  description: "Scan and verify Darshan tickets at the gate.",
};

export default function DarshanScanPage() {
  return <DarshanScanClient />;
}
