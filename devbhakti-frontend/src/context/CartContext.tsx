"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getMyCart, addItemToCart, updateCartItemQuantity, removeCartItem, clearMyCart } from "@/api/cartController";

export interface CartItem {
    productId: string;
    variantId: string;
    name: string;
    variantName: string;
    price: number;
    image: string;
    quantity: number;
    templeId: string | null;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (variantId: string) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    clearCart: () => void;
    totalAmount: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem("token");

    // Fetch Cart from Server or LocalStorage
    const fetchCart = async () => {
        if (isLoggedIn) {
            try {
                const response = await getMyCart();
                if (response.success) {
                    setCartItems(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch cart from server", error);
            }
        } else {
            const savedCart = localStorage.getItem("devbhakti_cart");
            if (savedCart) {
                try {
                    setCartItems(JSON.parse(savedCart));
                } catch (e) {
                    console.error("Failed to parse cart from localStorage", e);
                }
            }
        }
        setIsInitialized(true);
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // Sync to LocalStorage for Guest Users ONLY
    useEffect(() => {
        if (isInitialized && !isLoggedIn) {
            localStorage.setItem("devbhakti_cart", JSON.stringify(cartItems));
        }
    }, [cartItems, isInitialized, isLoggedIn]);

    const addToCart = async (newItem: CartItem) => {
        if (isLoggedIn) {
            try {
                await addItemToCart(newItem.productId, newItem.variantId, newItem.quantity);
                await fetchCart(); // Refresh cart from server
            } catch (error) {
                console.error("Failed to add item to server cart", error);
                alert("Failed to add item to cart. Please try again.");
            }
        } else {
            setCartItems((prev) => {
                const existing = prev.find((item) => item.variantId === newItem.variantId);
                if (existing) {
                    return prev.map((item) =>
                        item.variantId === newItem.variantId
                            ? { ...item, quantity: item.quantity + newItem.quantity }
                            : item
                    );
                }
                return [...prev, newItem];
            });
        }
    };

    const removeFromCart = async (variantId: string) => {
        if (isLoggedIn) {
            try {
                await removeCartItem(variantId);
                await fetchCart();
            } catch (error) {
                console.error("Failed to remove item from server cart", error);
            }
        } else {
            setCartItems((prev) => prev.filter((item) => item.variantId !== variantId));
        }
    };

    const updateQuantity = async (variantId: string, quantity: number) => {
        if (quantity <= 0) {
            return removeFromCart(variantId);
        }

        if (isLoggedIn) {
            try {
                await updateCartItemQuantity(variantId, quantity);
                await fetchCart();
            } catch (error) {
                console.error("Failed to update item quantity on server", error);
            }
        } else {
            setCartItems((prev) =>
                prev.map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
            );
        }
    };

    const clearCart = async () => {
        if (isLoggedIn) {
            try {
                await clearMyCart();
                setCartItems([]);
            } catch (error) {
                console.error("Failed to clear server cart", error);
            }
        } else {
            setCartItems([]);
        }
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalAmount,
                itemCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
