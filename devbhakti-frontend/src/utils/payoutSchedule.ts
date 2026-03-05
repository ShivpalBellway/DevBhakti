/**
 * Returns true only on the 15th or 28th of the month.
 */
export const isPayoutAllowed = (date: Date = new Date()): boolean => {
    const day = date.getDate();
    return day === 15 || day === 28;
};

/**
 * Returns the next allowed payout date (used for UI messages).
 */
export const nextPayoutDate = (from: Date = new Date()): Date => {
    const day = from.getDate();
    const month = from.getMonth(); // 0-based
    const year = from.getFullYear();

    if (day < 15) {
        return new Date(year, month, 15);
    }
    if (day < 28) {
        return new Date(year, month, 28);
    }
    // after the 28th -> next month's 15th
    return new Date(year, month + 1, 15);
};
