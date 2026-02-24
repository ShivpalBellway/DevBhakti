
export const parseLocation = (location: string) => {
    if (!location) return { city: "Delhi", state: "Delhi" };
    const parts = location.split(',').map(p => p.trim());
    if (parts.length >= 2) {
        return {
            city: parts[parts.length - 2],
            state: parts[parts.length - 1]
        };
    }
    return { city: location, state: location };
};

export const extractPincode = (address: string) => {
    if (!address) return "110001";
    const match = address.match(/\b\d{6}\b/);
    return match ? match[0] : "110001";
};
