const getDateKey = date => date.toISOString().slice(0, 10);

exports.getDateKey = getDateKey;

exports.getRecentDateRange = (days, now = new Date()) => {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);

  return {
    startDate: getDateKey(start),
    endDate: getDateKey(end),
  };
};
