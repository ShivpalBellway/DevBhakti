export const parseLocation = (location: string) => {
    if (!location) return { city: "Delhi", state: "Delhi" };
    const parts = location.split(',').map(p => p.trim());
    const city = parts[0] || "Delhi";
    const state = parts[1] || "Delhi";
    return { city, state };
};

export const extractPincode = (address: string) => {
    if (!address) return "110001";
    const match = address.match(/\d{6}/);
    return match ? match[0] : "110001";
};
