// Calculate in integer cents. Earnings and payouts on the same calendar date
// are available together because manual entries have date precision.
export function payoutCapacity(earnings, payments, date) {
  const changes = new Map();
  function event(day) {
    if (!changes.has(day)) changes.set(day, { earned: 0, paid: 0 });
    return changes.get(day);
  }
  for (const entry of earnings) event(entry.date).earned += entry.amount;
  for (const entry of payments) event(entry.date).paid += entry.amount;
  event(date);
  let balance = 0;
  let available = Infinity;
  for (const day of [...changes.keys()].sort()) {
    const { earned, paid } = changes.get(day);
    balance += earned - paid;
    if (day === date || (day > date && paid > 0)) {
      available = Math.min(available, balance);
    }
  }
  return Math.max(0, available);
}

export function followingMonth(month) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 10);
}

export function scheduledPayoutDate(earningMonth, day) {
  const [year, month] = earningMonth.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay))).toISOString().slice(0, 10);
}
