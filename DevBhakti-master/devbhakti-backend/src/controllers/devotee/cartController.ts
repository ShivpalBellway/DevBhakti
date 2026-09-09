import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { getLang, localize } from '../../utils/localization';

// Get User's Cart
export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                templeId: true,
                                sellerId: true
                            }
                        },
                        variant: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                stock: true,
                                isActive: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!cart) {
            cart = await (prisma.cart.create({
                data: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                    templeId: true,
                                    sellerId: true
                                }
                            },
                            variant: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    stock: true,
                                    isActive: true
                                }
                            }
                        }
                    }
                }
            }) as any);
        }

        const lang = getLang(req);
        // Transform data to match frontend structure and localize
        const formattedItems = (cart as any).items
            ?.filter((item: any) => item && item.product && item.variant)
            .map((item: any) => {
            const localizedProduct = item.product ? localize(item.product, lang) : { name: '' };
            const localizedVariant = item.variant ? localize(item.variant, lang) : { name: '' };
            
            return {
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                name: localizedProduct?.name || 'Product',
                variantName: localizedVariant?.name || 'Variant',
                price: item.variant?.price || 0,
                image: item.product?.image || '',
                quantity: item.quantity,
                templeId: item.product?.templeId,
                sellerId: item.product?.sellerId,
                stock: item.variant?.stock || 0,
                isActive: item.variant?.isActive ?? true
            };
        }) || [];

        res.json({
            success: true,
            data: formattedItems
        });
    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Add to Cart
export const addToCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { productId, variantId, quantity } = req.body;

        if (!productId || !variantId || !quantity) {
            return res.status(400).json({ success: false, message: 'Invalid cart data' });
        }

        // Ensure cart exists
        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { userId } });
        }

        // Check if item exists in cart
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                variantId: variantId
            }
        });

        if (existingItem) {
            // Update quantity
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        } else {
            // Add new item
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    variantId,
                    quantity
                }
            });
        }

        res.json({ success: true, message: 'Item added to cart' });
    } catch (error) {
        console.error('Add to Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update Cart Item Quantity
export const updateCartItem = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { variantId, quantity } = req.body;

        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        if (quantity <= 0) {
            // Remove item
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id, variantId }
            });
        } else {
            // Update quantity
            await prisma.cartItem.updateMany({
                where: { cartId: cart.id, variantId },
                data: { quantity }
            });
        }

        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        console.error('Update Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Remove from Cart
export const removeFromCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { variantId } = req.params;

        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id, variantId: variantId as string }
        });

        res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        console.error('Remove from Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Clear Cart
export const clearCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const cart = await prisma.cart.findUnique({ where: { userId } });

        if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }

        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear Cart Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
