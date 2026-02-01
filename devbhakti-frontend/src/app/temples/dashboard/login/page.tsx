import { Metadata } from "next";
import TempleAuthForm from "@/components/temples/dashboard/TempleAuthForm";

export const metadata: Metadata = {
    title: "Temple Admin Login - DevBhakti",
    description: "Secure login for temples and spiritual establishments on DevBhakti.",
};

export default function TempleLoginPage() {
    return <TempleAuthForm />;
}
