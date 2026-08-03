import { Metadata } from "next";
import DarshanAdminClient from "./DarshanAdminClient";

export const metadata: Metadata = {
  title: "Darshan Management - Super Admin",
  description: "View and manage all Darshan tickets across temples.",
};

export default function SuperAdminDarshanPage() {
  return <DarshanAdminClient />;
}
