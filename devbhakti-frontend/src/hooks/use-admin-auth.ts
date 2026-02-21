import { useState, useEffect } from "react";

export interface AdminUser {
  name: string;
  email: string;
  role?: string;
  isStaff?: boolean;
  permissions?: string[];
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const adminUserStr = localStorage.getItem("admin_user");
      const staffUserStr = localStorage.getItem("staff_user");
      const generalUserStr = localStorage.getItem("user");

      if (staffUserStr) {
        const parsed = JSON.parse(staffUserStr);
        setUser({ ...parsed, isStaff: true });
      } else if (adminUserStr) {
        const parsed = JSON.parse(adminUserStr);
        setUser({ ...parsed, isStaff: false, role: parsed.role || 'ADMIN' });
      } else if (generalUserStr) {
        const parsed = JSON.parse(generalUserStr);
        // If it's a Temple Owner or Seller Owner, they are not "staff" (they are superusers for their domain)
        if (parsed.role === 'INSTITUTION' || parsed.role === 'SELLER') {
          setUser({ ...parsed, isStaff: false });
        } else if (parsed.isStaff) {
          setUser({ ...parsed, isStaff: true });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const hasPermission = (permissionKey: string) => {
    if (!user) return false;
    
    // Explicitly allow owners (Super-users for their domain)
    if (user.role === 'ADMIN' || user.role === 'INSTITUTION' || user.role === 'SELLER') {
      return true;
    }
    
    if (user.isStaff === false) return true; // Platform Admin fallback
    
    return user.permissions?.includes(permissionKey) || false;
  };

  return { user, loading, hasPermission };
}
