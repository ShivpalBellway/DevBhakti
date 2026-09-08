/**
 * Safely parses a localized name/text that might be a JSON string.
 * Returns the translation for the given language or falls back to 'en'.
 * 
 * @param value - The value to parse (string or object)
 * @param lang - The language key to use (default: 'en')
 */
export const parseLocalizedValue = (value: any, lang: string = 'en'): string => {
    if (!value) return "N/A";
    
    // If it's already an object
    if (typeof value === "object") {
        const getValue = (val: any) => (val !== undefined && val !== null && val !== '') ? val : null;
        return getValue(value[lang]) || getValue(value.en) || getValue(value.hi) || getValue(value.mr) || "N/A";
    }
    
    // If it's a string, try to parse it as JSON
    try {
        const parsed = JSON.parse(value);
        if (typeof parsed === "object" && parsed !== null) {
            const getValue = (val: any) => (val !== undefined && val !== null && val !== '') ? val : null;
            return getValue(parsed[lang]) || getValue(parsed.en) || getValue(parsed.hi) || getValue(parsed.mr) || "N/A";
        }
    } catch (e) {
        // Not a JSON string, return as is
    }
    
    return value;
};

/**
 * Removes all HTML tags from a string and returns plain text.
 * Useful for card previews.
 */
export const stripHtml = (html: string): string => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
};

/**
 * Deduplicates a list of poojas by their localized name,
 * preferring Master poojas when duplicates are found.
 */
export const getDeduplicatedPoojas = (poojas: any[], lang: string = 'en'): any[] => {
    if (!Array.isArray(poojas)) return [];
    
    const uniqueMap = new Map();
    
    poojas.forEach(p => {
        // We use 'en' as a stable key for deduplication if possible, 
        // to avoid name changes causing issues when switching languages.
        const dedupeKey = parseLocalizedValue(p.name, 'en').toLowerCase().trim();
        if (!dedupeKey || dedupeKey === "n/a") return;
        
        const existing = uniqueMap.get(dedupeKey);
        // Preference: 
        // 1. Master poojas
        // 2. Original poojas (no masterPoojaId)
        // 3. Any available
        
        const isBetter = !existing || 
                        (p.isMaster && !existing.isMaster) || 
                        (!p.masterPoojaId && existing.masterPoojaId && !p.isMaster);
                        
        if (isBetter) {
            uniqueMap.set(dedupeKey, p);
        }
    });
    
    return Array.from(uniqueMap.values());
};

/**
 * Detects long sequential or repetitive digit patterns in a numeric string.
 * Returns true for strings like '012345', '987654', '111111', or long repeated digits.
 */
export const isSequentialOrRepetitive = (num: string) => {
    if (!num) return false;
    if (/^(\d)\1+$/.test(num)) return true;

    let maxRun = 1;
    let inc = 1;
    let dec = 1;
    let rep = 1;
    for (let i = 1; i < num.length; i++) {
        const prev = Number(num[i - 1]);
        const cur = Number(num[i]);
        if (cur === (prev + 1) % 10) inc++; else inc = 1;
        if (cur === (prev + 9) % 10) dec++; else dec = 1;
        if (cur === prev) rep++; else rep = 1;
        maxRun = Math.max(maxRun, inc, dec, rep);
    }
    return maxRun >= 6;
};

/**
 * Formats a 24-hour time string like "00:00", "08:30", "12:00", "17:00", or a range like "10:00 - 15:00"
 * into a user-friendly 12-hour string like "10:00 AM - 03:00 PM".
 */
export const formatSlotTime = (timeStr: string): string => {
    if (!timeStr) return "";

    // If string has a dash or range, format each part
    if (timeStr.includes("-")) {
        const parts = timeStr.split("-").map(p => p.trim());
        return parts.map(p => formatSlotTime(p)).join(" - ");
    }

    if (timeStr.includes("AM") || timeStr.includes("PM") || timeStr.includes("am") || timeStr.includes("pm")) {
        return timeStr;
    }

    const [hStr, mStr] = timeStr.split(":");
    let hours = parseInt(hStr, 10);
    const minutes = mStr || "00";

    if (isNaN(hours)) return timeStr;

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;

    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${formattedHours}:${minutes} ${ampm}`;
};
