import { prisma } from './src/lib/prisma';
import { createShiprocketOrder } from './src/services/shiprocketService';

async function test() {
    try {
        const subOrder = await prisma.subOrder.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                items: true,
                order: { include: { user: true } },
                seller: true,
                temple: true
            }
        });

        if (!subOrder) {
            console.log('No suborder found');
            return;
        }

        const orderWithUser = subOrder.order as any;
        const shippingAddr: any = orderWithUser.shippingAddress || {};
        const pickupLocation = subOrder.seller?.pickupLocation || subOrder.temple?.pickupLocation || 'Primary';

        const payload = {
            order_id: subOrder.id,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: pickupLocation,
            billing_customer_name: shippingAddr.fullName || orderWithUser?.user?.name || 'Customer',
            billing_last_name: 'Customer',
            billing_address: shippingAddr.street || 'N/A',
            billing_address_2: '',
            billing_city: shippingAddr.city || 'N/A',
            billing_pincode: shippingAddr.pincode || '452010',
            billing_state: shippingAddr.state || 'N/A',
            billing_country: 'India',
            billing_email: orderWithUser?.user?.email || 'customer@example.com',
            billing_phone: shippingAddr.phone || orderWithUser?.user?.phone || '9999999999',
            shipping_is_billing: true,
            order_items: subOrder.items.map((item: any) => ({
                name: item.variantName || 'Product',
                sku: item.variantId || 'sku',
                units: item.quantity,
                selling_price: item.price,
                discount: 0,
                tax: 0,
                hsn: 0
            })),
            payment_method: 'Prepaid',
            sub_total: subOrder.totalAmount,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5
        };

        console.log('Testing Shiprocket Order Creation...');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const res = await createShiprocketOrder(payload);
        console.log('\n--- Shiprocket Final Response ---');
        console.log(JSON.stringify(res, null, 2));
    } catch (error: any) {
        console.error('\n--- Error ---');
        console.error(error.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
