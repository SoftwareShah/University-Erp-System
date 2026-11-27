const { z } = require('zod');

const isValidDateOnly = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const dateOnlySchema = z.string().refine(isValidDateOnly, 'Date must be a valid YYYY-MM-DD date.');
const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID.');

module.exports = { dateOnlySchema, isValidDateOnly, objectIdSchema };
