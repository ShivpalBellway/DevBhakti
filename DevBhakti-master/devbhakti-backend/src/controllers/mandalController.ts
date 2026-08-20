import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { buildLangJson } from '../utils/localization';

// Create a new Mandal Registration
export const registerMandal = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            // English fields (primary)
            name, name_en, name_hi, name_mr,
            mandalType,
            establishedYear,
            description, description_en, description_hi, description_mr,
            presiding_deity,
            festivals,
            address,
            city,
            state,
            pinCode,
            mapUrl,
            contactNumber,
            email,
            presidentName,
            registrationNumber,
            verificationDocUrl,
            presidentIdDocUrl
        } = req.body;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        let imageUrl = undefined;
        let bannerImageUrls: string[] = [];

        if (files) {
            if (files['image'] && files['image'][0]) {
                imageUrl = `/uploads/mandals/${files['image'][0].filename}`;
            }
            if (files['heroImages']) {
                bannerImageUrls = files['heroImages'].map(f => `/uploads/mandals/${f.filename}`);
            }
        }

        const nameEn = name_en || name;

        if (!nameEn || !contactNumber) {
            res.status(400).json({ success: false, message: 'Name and contact number are required' });
            return;
        }

        // Check if registration is enabled globally
        const settingsKey = 'mandal_registration_enabled';
        const setting = await prisma.globalSetting.findUnique({
            where: { key: settingsKey }
        });

        const isEnabled = setting ? (setting.value as any)?.enabled : false;

        if (!isEnabled) {
            res.status(403).json({ success: false, message: 'Mandal registration is currently disabled by admin.' });
            return;
        }

        let cleanedContact = contactNumber.replace(/\D/g, '');
        if (cleanedContact.length > 10 && cleanedContact.startsWith('91')) {
            cleanedContact = cleanedContact.substring(2);
        }

        const existingMandal = await prisma.mandal.findFirst({
            where: { contactNumber: cleanedContact }
        });

        if (existingMandal) {
            res.status(400).json({ success: false, message: 'This number is already with us in mandal register form' });
            return;
        }

        const mandal = await prisma.mandal.create({
            data: {
                name: JSON.stringify(buildLangJson(nameEn, name_hi, name_mr)),
                description: description_en || description || description_hi || description_mr
                    ? JSON.stringify(buildLangJson(description_en || description, description_hi, description_mr))
                    : undefined,
                mandalType,
                establishedYear,
                presiding_deity,
                festivals,
                address,
                city,
                state,
                pinCode,
                mapUrl,
                contactNumber: cleanedContact,
                email,
                presidentName,
                registrationNumber,
                verificationDocUrl,
                presidentIdDocUrl,
                image: imageUrl,
                bannerImages: bannerImageUrls,
                status: 'PENDING',
                isActive: false,
            }
        });

        res.status(201).json({
            success: true,
            message: 'Mandal registration submitted successfully and is pending approval.',
            mandal
        });
    } catch (error: any) {
        console.error('Error registering mandal:', error);
        res.status(500).json({ success: false, message: 'Server error while submitting mandal registration', error: error.message });
    }
};
