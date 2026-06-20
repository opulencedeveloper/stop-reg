// Shared seat management utilities

const SEAT_LIMITS = {
  "Launch": 1,
  "Scale": 2,
  "Boost": 4,
  "Power": 6,
  "Elite": 8,
  "Enterprise": 999
};

// Handles both standard plan names and custom plan numeric limits
// planNameOrLimit: either a plan name string ("Launch") or numeric seat limit (50, 100, etc)
function getSeatLimit(planNameOrLimit) {
  // If it's a number, it's a custom plan's seatLimit - return directly
  if (typeof planNameOrLimit === 'number') {
    return planNameOrLimit;
  }
  // Otherwise it's a standard plan name - look it up in the mapping
  return SEAT_LIMITS[planNameOrLimit];
}

function hasReachedSeatLimit(planNameOrLimit, usedSeats) {
  const limit = getSeatLimit(planNameOrLimit);
  return limit && usedSeats >= limit;
}

function getSeatLimitMessage(planNameOrLimit, limit) {
  const planName = typeof planNameOrLimit === 'number' ? 'custom' : planNameOrLimit;
  return `You have reached the seat limit for your ${planName} plan (${limit} seat${limit > 1 ? 's' : ''}). Please upgrade to invite more team members.`;
}
