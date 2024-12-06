/**
 * Format a number as currency (SLN)
 * @param amount The amount to format
 * @returns Formatted string with SLN currency
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()} SLN`;
}

/**
 * Format a date to a readable string
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp to a readable string
 * @param date The date to format
 * @returns Formatted timestamp string
 */
export function formatTimestamp(date: string | Date): string {
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate a string with ellipsis
 * @param str The string to truncate
 * @param length The maximum length
 * @returns Truncated string
 */
export function truncate(str: string, length: number = 20): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

/**
 * Format a wallet address
 * @param address The wallet address
 * @returns Formatted address (e.g., "0x1234...5678")
 */
export function formatWalletAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
} 