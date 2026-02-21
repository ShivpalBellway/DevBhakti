export const clearAllTokens = () => {
    if (typeof window === "undefined") return;
    
    // Preserve cart items for the user
    const cart = localStorage.getItem("devbhakti_cart");
    
    // Clear all LocalStorage data (auth tokens, conflicting sessions, etc)
    localStorage.clear();
    
    // Restore cart
    if (cart) {
        localStorage.setItem("devbhakti_cart", cart);
    }
    
    // Clear admin auth cookie as well
    document.cookie = "admin_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
};
