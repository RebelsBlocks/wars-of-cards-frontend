import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param content - The content to sanitize
 * @param allowLinks - Whether to allow links (default: false)
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (content: string, allowLinks: boolean = false): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  const config: DOMPurify.Config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
  };

  // Allow links if specified
  if (allowLinks) {
    config.ALLOWED_TAGS!.push('a');
    config.ALLOWED_ATTR!.push('href', 'target', 'rel');
  }

  return DOMPurify.sanitize(content, config);
};

/**
 * Sanitizes plain text content (removes all HTML)
 * @param content - The content to sanitize
 * @returns Sanitized plain text
 */
export const sanitizeText = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * Validates and sanitizes message content for chat
 * @param message - The message to validate and sanitize
 * @returns Object with sanitized content and validation result
 */
export const validateAndSanitizeMessage = (message: string): {
  isValid: boolean;
  sanitizedContent: string;
  error?: string;
} => {
  if (!message || typeof message !== 'string') {
    return {
      isValid: false,
      sanitizedContent: '',
      error: 'Message cannot be empty'
    };
  }

  // Check length
  if (message.length > 1000) {
    return {
      isValid: false,
      sanitizedContent: '',
      error: 'Message too long (max 1000 characters)'
    };
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(message)) {
      return {
        isValid: false,
        sanitizedContent: '',
        error: 'Message contains potentially dangerous content'
      };
    }
  }

  // Sanitize the content
  const sanitizedContent = sanitizeText(message);

  return {
    isValid: true,
    sanitizedContent
  };
};
