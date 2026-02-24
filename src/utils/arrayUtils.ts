// Array and data manipulation utilities

/**
 * Sort array by a specific property
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Group array by a specific property
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Filter active items (items where isActive === true)
 */
export function filterActive<T extends { isActive: boolean }>(array: T[]): T[] {
  return array.filter((item) => item.isActive);
}

/**
 * Filter inactive items (items where isActive === false)
 */
export function filterInactive<T extends { isActive: boolean }>(array: T[]): T[] {
  return array.filter((item) => !item.isActive);
}

/**
 * Get unique values from array
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Get unique objects by a specific key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Paginate array
 */
export function paginate<T>(array: T[], page: number, limit: number): T[] {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return array.slice(startIndex, endIndex);
}

/**
 * Search array by multiple properties
 */
export function searchBy<T>(
  array: T[],
  searchTerm: string,
  keys: (keyof T)[]
): T[] {
  const lowerSearch = searchTerm.toLowerCase();
  
  return array.filter((item) =>
    keys.some((key) => {
      const value = String(item[key]).toLowerCase();
      return value.includes(lowerSearch);
    })
  );
}

/**
 * Get items within a date range
 */
export function filterByDateRange<T extends { createdAt: string } | { date: string }>(
  array: T[],
  startDate: string,
  endDate: string
): T[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return array.filter((item) => {
    const dateField = 'createdAt' in item ? item.createdAt : 'date' in item ? item.date : '';
    const itemDate = new Date(dateField).getTime();
    return itemDate >= start && itemDate <= end;
  });
}

/**
 * Sum values from array by property
 */
export function sumBy<T>(array: T[], key: keyof T): number {
  return array.reduce((sum, item) => {
    const value = item[key];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Get average value from array by property
 */
export function averageBy<T>(array: T[], key: keyof T): number {
  if (array.length === 0) return 0;
  return sumBy(array, key) / array.length;
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}