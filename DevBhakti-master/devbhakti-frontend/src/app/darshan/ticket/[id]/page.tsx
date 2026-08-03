import { Metadata } from "next";
import DarshanTicketClient from "./DarshanTicketClient";

export const metadata: Metadata = {
  title: "Darshan Ticket - DevBhakti",
  description: "View and download your Darshan ticket.",
};

export default function DarshanTicketPage() {
  return <DarshanTicketClient />;
}
