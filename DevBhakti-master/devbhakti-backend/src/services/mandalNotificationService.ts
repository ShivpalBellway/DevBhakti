import { prisma } from '../lib/prisma';
import { notifyAdmins } from './firebaseService';
import { sendWhatsAppMessage } from './whatsappService';

/**
 * Sends in-app DB notification & WhatsApp notification to DevBhakti Admin(s)
 * whenever a new Mandal completes registration.
 */
export const sendMandalRegistrationAlerts = async (mandal: any): Promise<void> => {
    try {
        let mandalName = 'Mandal';
        try {
            const parsedName = typeof mandal.name === 'string' ? JSON.parse(mandal.name) : mandal.name;
            mandalName = parsedName?.en || parsedName?.hi || parsedName?.mr || mandal.name || 'Mandal';
        } catch {
            mandalName = mandal.name || 'Mandal';
        }

        const city = mandal.city || 'Not specified';
        const contactNumber = mandal.contactNumber || 'Not specified';
        const presidentName = mandal.presidentName || 'Not specified';

        // 1. In-App & FCM Push Notification to all DevBhakti System Admins
        try {
            await notifyAdmins({
                title: '🚩 New Mandal Registration',
                body: `${mandalName} (${city}) registered by ${presidentName}. Please review & activate.`,
                data: {
                    type: 'MANDAL_REGISTRATION',
                    mandalId: mandal.id,
                    link: '/admin/mandals'
                }
            });
            console.log(`[Mandal Alert] Admin in-app & FCM notification sent for Mandal: ${mandalName}`);
        } catch (adminNotifErr: any) {
            console.error('[Mandal Alert] Error sending admin in-app notification:', adminNotifErr.message);
        }

        // 2. WhatsApp Notification to Admin Number
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || process.env.ADMIN_PHONE;
        const campaignName = process.env.AISENSY_MANDAL_REGISTRATION_CAMPAIGN || 'mandal_registration_admin_alert';

        if (adminPhone) {
            // Template Parameters for AiSensy:
            // {{1}} = Mandal Name
            // {{2}} = Contact Number
            // {{3}} = City
            // {{4}} = President Name
            const params = [
                mandalName,
                contactNumber,
                city,
                presidentName
            ];

            try {
                await sendWhatsAppMessage(
                    adminPhone,
                    'DevBhakti Admin',
                    campaignName,
                    params
                );
                console.log(`[Mandal Alert] WhatsApp message sent to ${adminPhone} for campaign "${campaignName}".`);
            } catch (waErr: any) {
                console.warn(`[Mandal Alert] Failed to send WhatsApp message to admin:`, waErr.message || waErr);
            }
        } else {
            console.log('[Mandal Alert] ADMIN_WHATSAPP_NUMBER is not set in environment variables. Skipping WhatsApp alert.');
        }

    } catch (error: any) {
        console.error('Error in sendMandalRegistrationAlerts:', error.message || error);
    }
};
