"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const prisma_1 = require("../../lib/prisma");
// Get User's Cart
const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        let cart = await prisma_1.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                templeId: true
                            }
                        },
                        variant: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                stock: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!cart) {
            cart = await prisma_1.prisma.cart.create({
                data: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                    templeId: true
                                }
                            },
                            variant: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    stock: true
                                }
                            }
                        }
                    }
                }
            });
        }
        // Transform data to match frontend structure
        const formattedItems = cart.items?.map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.product.name,
            variantName: item.variant.name,
            price: item.variant.price,
            image: item.product.image,
            quantity: item.quantity,
            templeId: item.product.templeId,
            stock: item.variant.stock
        })) || [];
        res.json({
            success: true,
            data: formattedItems
        });
    }
    catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getCart = getCart;
// Add to Cart
const addToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId, variantId, quantity } = req.body;
        if (!productId || !variantId || !quantity) {
            return res.status(400).json({ success: false, message: 'Invalid cart data' });
        }
        // Ensure cart exists
        let cart = await prisma_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma_1.prisma.cart.create({ data: { userId } });
        }
        // Check if item exists in cart
        const existingItem = await prisma_1.prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                variantId: variantId
            }
        });
        if (existingItem) {
            // Update quantity
            await prisma_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        }
        else {
            // Add new item
            await prisma_1.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    variantId,
                    quantity
                }
            });
        }
        res.json({ success: true, message: 'Item added to cart' });
    }
    catch (error) {
        console.error('Add to Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.addToCart = addToCart;
// Update Cart Item Quantity
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { variantId, quantity } = req.body;
        const cart = await prisma_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart)
            return res.status(404).json({ success: false, message: 'Cart not found' });
        if (quantity <= 0) {
            // Remove item
            await prisma_1.prisma.cartItem.deleteMany({
                where: { cartId: cart.id, variantId }
            });
        }
        else {
            // Update quantity
            await prisma_1.prisma.cartItem.updateMany({
                where: { cartId: cart.id, variantId },
                data: { quantity }
            });
        }
        res.json({ success: true, message: 'Cart updated' });
    }
    catch (error) {
        console.error('Update Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.updateCartItem = updateCartItem;
// Remove from Cart
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { variantId } = req.params;
        const cart = await prisma_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart)
            return res.status(404).json({ success: false, message: 'Cart not found' });
        await prisma_1.prisma.cartItem.deleteMany({
            where: { cartId: cart.id, variantId: variantId }
        });
        res.json({ success: true, message: 'Item removed from cart' });
    }
    catch (error) {
        console.error('Remove from Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.removeFromCart = removeFromCart;
// Clear Cart
const clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cart = await prisma_1.prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await prisma_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
        res.json({ success: true, message: 'Cart cleared' });
    }
    catch (error) {
        console.error('Clear Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.clearCart = clearCart;
