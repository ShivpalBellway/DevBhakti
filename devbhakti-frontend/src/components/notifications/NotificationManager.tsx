'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationManager() {
    const [userData, setUserData] = useState<{ id: string; type: 'admin' | 'temple_admin' | 'seller' | 'devotee' } | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            // 1. Try Admin (Uses special keys)
            const adminToken = localStorage.getItem('admin_token');
            const adminUser = localStorage.getItem('admin_user');
            if (adminToken && adminUser) {
                try {
                    const user = JSON.parse(adminUser);
                    setUserData({ id: user.id || user.email, type: 'admin' });
                    return;
                } catch (e) { }
            }

            // 2. Try Generic (Temple, Seller, Devotee use 'token' and 'user')
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    let type: 'devotee' | 'temple_admin' | 'seller' = 'devotee';

                    // Check role to determine type
                    if (user.role === 'INSTITUTION' || user.isStaff) {
                        type = 'temple_admin';
                    } else if (user.role === 'SELLER') {
                        type = 'seller';
                    }

                    setUserData({ id: user.id, type });
                    return;
                } catch (e) { }
            }

            // 3. Fallbacks for specific keys if they exist
            const templeToken = localStorage.getItem('temple_token');
            const templeUser = localStorage.getItem('temple_user');
            if (templeToken && templeUser) {
                try {
                    const user = JSON.parse(templeUser);
                    setUserData({ id: user.ownerId || user.id, type: 'temple_admin' });
                    return;
                } catch (e) { }
            }

            const sellerToken = localStorage.getItem('seller_token');
            const sellerUser = localStorage.getItem('seller_user');
            if (sellerToken && sellerUser) {
                try {
                    const user = JSON.parse(sellerUser);
                    setUserData({ id: user.id, type: 'seller' });
                    return;
                } catch (e) { }
            }

            setUserData(null);
        };

        checkAuth();
        // Re-check on storage changes (like login/logout)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    // Use the hook if we have user data
    useNotifications({
        userId: userData?.id || '',
        userType: userData?.type || 'devotee',
        enabled: !!userData,
    });

    return null; // This component doesn't render anything
}
