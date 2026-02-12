/**
 * Parse date and time strings into a UTC Date object
 * Adjusts for timezone offset
 */
export function parseDateTime(date: string, time: string): Date {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);

    const dateTime = new Date(Date.UTC(year, month - 1, day, hour, minute));
    dateTime.setUTCHours(dateTime.getUTCHours() + 3); // Adjust for Brazil timezone

    return dateTime;
}

/**
 * Adjust timezone for a date
 */
export function adjustTimezone(date: Date, offsetHours: number = 3): Date {
    const adjusted = new Date(date);
    adjusted.setUTCHours(adjusted.getUTCHours() + offsetHours);
    return adjusted;
}

/**
 * Parse deadline string to Date or null
 */
export function parseDeadline(deadline?: string): Date | null {
    return deadline ? new Date(deadline) : null;
}
