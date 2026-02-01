/**
 * Utility function to detect and linkify URLs in text
 * Supports http, https, and www links similar to WhatsApp
 */

// URL detection regex - matches http://, https://, and www.
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

/**
 * Check if a user is premium (has active subscription or trial)
 * @param user - User object with subscription field
 * @returns boolean indicating if user is premium
 */
export const isPremiumUser = (user: any): boolean => {
    return user?.subscription?.status === 'active' || user?.subscription?.status === 'trial';
};

/**
 * Converts plain text URLs into clickable links
 * @param text - The text containing potential URLs
 * @returns JSX with linkified URLs
 */
export const linkifyText = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    // Reset regex index
    URL_REGEX.lastIndex = 0;

    while ((match = URL_REGEX.exec(text)) !== null) {
        const url = match[0];
        const index = match.index;

        // Add text before the URL
        if (index > lastIndex) {
            parts.push(text.substring(lastIndex, index));
        }

        // Create proper URL (add https:// for www. links)
        const href = url.startsWith('www.') ? `https://${url}` : url;

        // Add the link
        parts.push(
            <a
                key={`link-${index}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
                onClick={(e) => e.stopPropagation()}
            >
                {url}
            </a>
        );

        lastIndex = index + url.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
};

/**
 * Check if text contains any URLs
 * @param text - The text to check
 * @returns boolean indicating if URLs are present
 */
export const containsURL = (text: string): boolean => {
    URL_REGEX.lastIndex = 0;
    return URL_REGEX.test(text);
};
