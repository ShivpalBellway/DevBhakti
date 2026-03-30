/**
 * Generates the appropriate URL for a temple based on its configuration.
 * Handles both path-based (slug) and subdomain-based URLs.
 */
export const getTempleUrl = (temple: any): string => {
    if (!temple) return '/temples';

    if (temple.urlType === 'subdomain' && temple.subdomain) {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : '';
            
            // Check if we are in a local environment
            const isLocal = hostname === 'localhost' || 
                            hostname === '127.0.0.1' || 
                            hostname.endsWith('.lvh.me') || 
                            hostname.endsWith('.localhost');
            
            if (isLocal) {
                // Use lvh.me for local subdomains (always points to 127.0.0.1)
                // This avoids having to edit the hosts file for Every new temple
                return `http://${temple.subdomain}.lvh.me${port}`;
            } else {
                // Production: use the actual domain
                return `https://${temple.subdomain}.devbhakti.in`;
            }
        }
        return `https://${temple.subdomain}.devbhakti.in`;
    }

    // Default: Path-based URL
    return `/temples/${temple.slug || temple.id}`;
};

/**
 * Generates the clean URL for a temple's live darshan.
 */
export const getLiveDarshanUrl = (temple?: any): string => {
    if (!temple) return '/live-darshan';
    return `/live-darshan/${temple.slug || temple.id || temple._id}`;
};


/**
 * Returns the main domain URL with the given path.
 * Useful for linking back to global pages from a subdomain.
 */
export const getMainDomainUrl = (path: string = ''): string => {
    if (typeof window === 'undefined') return path;
    
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    // Check if hostname is an IP address
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || 
                        /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i.test(hostname);
    
    // If not on a subdomain or is IP address, just return path
    if (hostname === 'localhost' || hostname === 'lvh.me' || hostname === 'devbhakti.in' || isIpAddress) {
        return path;
    }
    
    // If on a subdomain, redirect to the parent domain
    const hostParts = hostname.split('.');
    if (hostParts.length >= 2) {
        const mainHost = hostParts.slice(1).join('.');
        const protocol = window.location.protocol;
        return `${protocol}//${mainHost}${path}`;
    }
    
    return path;
};
