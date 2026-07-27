export const resolvePhotoTicketReference = (body: any): string | undefined => {
    const value = body?.ticketId ?? body?.displayId ?? body?.bookingId ?? body?.id;
    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }
    return undefined;
};
