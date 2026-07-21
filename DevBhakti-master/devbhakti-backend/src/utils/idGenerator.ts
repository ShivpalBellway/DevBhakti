import { prisma } from '../lib/prisma';

/**
 * Generates a custom human-readable ID.
 * Format: [PREFIX] + MM (Month) + [YEAR_CODE] + [4-digit Sequence]
 * Example: BKID04A1286
 */
export const generateCustomId = async (prefix: string): Promise<string> => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    
    // 2026 = A, 2027 = B, etc.
    // ASCII 'A' is 65
    const yearCode = String.fromCharCode(65 + (year - 2026));
    
    // Use upsert to manage sequence in a transaction-safe way
    // We start from 1001 to ensure 4 digits as per user example
    const sequence = await prisma.idSequence.upsert({
        where: { 
            prefix_yearCode: { 
                prefix, 
                yearCode 
            } 
        },
        update: { lastValue: { increment: 1 } },
        create: { 
            prefix, 
            yearCode, 
            lastValue: 1001 
        }
    });
    
    const suffix = sequence.lastValue.toString().padStart(4, '0');
    
    return `${prefix}${month}${yearCode}${suffix}`;
};

/**
 * Generates a custom human-readable Donation ID.
 * Kept for backward compatibility but updated to new format.
 */
export const generateDonationDisplayId = async (): Promise<string> => {
    return generateCustomId('DNID');
};

/**
 * Generates a custom human-readable Booking ID.
 * Format: BKID + MM + YearCode + Sequence
 */
export const generateBookingDisplayId = async (): Promise<string> => {
    return generateCustomId('BKID');
};
