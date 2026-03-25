/**
 * Generates a custom human-readable Donation ID.
 * Format: DN + MMM (Month) + YY (Year) + 6 random alphanumeric chars
 * Example: DNMAR26X7Y9Z1
 */
export const generateDonationDisplayId = (): string => {
    const now = new Date();
    
    // Get 3-letter month (e.g., MAR)
    const month = now.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
    
    // Get 2-digit year (e.g., 26)
    const year = now.getFullYear().toString().slice(-2);
    
    // Generate 6 random alphanumeric characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let random = '';
    for (let i = 0; i < 6; i++) {
        random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `DN${month}${year}${random}`;
};
