import { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
    title: "DevBhakti Admin Login",
    description: "Login to DevBhakti Admin Portal",
};

export default function AdminLoginPage() {
    return <AdminLoginForm />;
}
