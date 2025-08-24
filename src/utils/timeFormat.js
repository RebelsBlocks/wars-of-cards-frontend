// Simple cache to store previous time lookups
const timeCache = new Map();

export const fetchTimeByBlockHeight = async (blockHeight) => {
  if (!blockHeight) return "";
  
  // Check if we already have this blockHeight in the cache
  if (timeCache.has(blockHeight)) {
    return timeCache.get(blockHeight);
  }
  
  try {
    const res = await fetch(`https://api.near.social/time?blockHeight=${blockHeight}`);
    if (!res.ok) return "";
    const timeMs = parseFloat(await res.text());
    const date = new Date(timeMs);
    
    // Format the date to include month, day, year, hour and minute
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Store in cache
    timeCache.set(blockHeight, formattedDate);
    
    return formattedDate;
  } catch (error) {
    console.error("Error fetching time:", error);
    return "";
  }
};