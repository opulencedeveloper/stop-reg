// Shared seat management utilities

const SEAT_LIMITS = {
  "Launch": 1,
  "Scale": 2,
  "Boost": 4,
  "Power": 6,
  "Elite": 8,
  "Enterprise": 999
};

function getSeatLimit(planName) {
  return SEAT_LIMITS[planName];
}

function hasReachedSeatLimit(planName, usedSeats) {
  const limit = getSeatLimit(planName);
  return limit && usedSeats >= limit;
}

function getSeatLimitMessage(planName, limit) {
  return `You have reached the seat limit for your ${planName} plan (${limit} seat${limit > 1 ? 's' : ''}). Please upgrade to invite more team members.`;
}
