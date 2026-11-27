const test = require('node:test');
const assert = require('node:assert/strict');
const { getDateKey, getRecentDateRange } = require('../utils/dateRange');

test('date range returns inclusive UTC day keys across month and year boundaries', () => {
  const now = new Date('2026-01-02T04:30:00.000Z');
  assert.equal(getDateKey(now), '2026-01-02');
  assert.deepEqual(getRecentDateRange(7, now), {
    startDate: '2025-12-27',
    endDate: '2026-01-02',
  });
});
