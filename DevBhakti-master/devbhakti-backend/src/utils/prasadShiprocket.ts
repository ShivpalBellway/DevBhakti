import { prisma } from '../lib/prisma';
import { createShiprocketOrder } from '../services/shiprocketService';
import { notifyUser } from '../services/firebaseService';
import { getEnglish } from './localization';

export const triggerPrasadShiprocketOrder = async (bookingId: string) => {
    try {
        const booking = await prisma.poojaBooking.findUnique({
            where: { id: bookingId },
            include: {
                pooja: true,
                temple: true,
                user: true
            }
        });

        if (!booking) {
            console.error(`[Prasad Shiprocket] Booking ${bookingId} not found`);
            return;
        }

        if (!booking.isPrasadRequested) {
            console.log(`[Prasad Shiprocket] Prasad not requested for booking ${bookingId}`);
            return;
        }

        if (booking.shiprocketOrderId) {
            console.log(`[Prasad Shiprocket] Shiprocket order already exists for booking ${bookingId}`);
            return;
        }

        // Validate structured address
        if (!booking.prasadStreet || !booking.prasadCity || !booking.prasadState || !booking.prasadPincode) {
            console.warn(`[Prasad Shiprocket] Booking ${bookingId} does not have structured address. Skipping.`);
            return;
        }

        // Get temple pickup location (nickname registered with Shiprocket)
        const pickupLocation = (booking.temple && booking.temple.pickupLocation) 
            ? getEnglish(booking.temple.pickupLocation) 
            : "Primary";

        // Prepare payload
        const shiprocketOrderData = {
            order_id: `PRASD-${booking.id.slice(-8).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: pickupLocation,
            billing_customer_name: booking.devoteeName || "Customer",
            billing_last_name: "Devotee",
            billing_address: booking.prasadStreet,
            billing_city: booking.prasadCity,
            billing_pincode: booking.prasadPincode,
            billing_state: booking.prasadState,
            billing_country: "India",
            billing_email: booking.devoteeEmail || booking.user?.email || "customer@example.com",
            billing_phone: booking.devoteePhone || booking.user?.phone || "0000000000",
            shipping_is_billing: true,
            order_items: [
                {
                    name: `${getEnglish(booking.pooja.name)} Prasad`,
                    sku: `PRASD-${booking.poojaId.slice(-6).toUpperCase()}`,
                    units: 1,
                    selling_price: 1,
                    discount: 0,
                    tax: 0,
                    hsn: 0
                }
            ],
            payment_method: "Prepaid",
            sub_total: 1,
            length: 10,
            breadth: 10,
            height: 5,
            weight: 0.2 // 200 grams default for prasad
        };

        console.log(`[Prasad Shiprocket] Creating order for booking ${bookingId}...`);
        const srResponse = await createShiprocketOrder(shiprocketOrderData);

        if (srResponse && srResponse.order_id) {
            await prisma.poojaBooking.update({
                where: { id: bookingId },
                data: {
                    shiprocketOrderId: srResponse.order_id.toString(),
                    prasadStatus: 'PREPARING'
                }
            });
            console.log(`[Prasad Shiprocket] Order created successfully: ${srResponse.order_id}`);

            // Send notification to user
            const userId = booking.userId ?? undefined;
            if (userId) {
                await notifyUser(userId, 'devotee', {
                    title: 'Prasad Preparing 🥣',
                    body: `Your Prasad for ${getEnglish(booking.pooja.name)} is now being prepared!`,
                    data: { link: '/profile/bookings', bookingId: booking.id }
                });
            }
        } else {
            console.error(`[Prasad Shiprocket] Failed to create order:`, srResponse);
        }
    } catch (error: any) {
        console.error(`[Prasad Shiprocket] Error triggering Shiprocket order:`, error.message);
    }
};
