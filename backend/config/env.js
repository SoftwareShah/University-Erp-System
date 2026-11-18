const { z } = require('zod');
const ApiError = require('../utils/ApiError');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGO_URI: z.string().trim().regex(/^mongodb(?:\+srv)?:\/\/\S+$/, 'MONGO_URI must be a valid MongoDB connection URI.'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters.')
    .refine(value => !/replace_this|change_me|your_secret|example/i.test(value), 'JWT_SECRET must not use a placeholder value.'),
  JWT_EXPIRES_IN: z.string().trim().regex(/^\d+(s|m|h|d|w|y)$/i, 'JWT_EXPIRES_IN must be a duration such as 15m or 7d.').default('7d'),
  CLIENT_URL: z.string().trim().default('http://localhost:5173')
    .transform(value => value.split(',').map(origin => origin.trim()).filter(Boolean))
    .refine(origins => origins.length > 0 && origins.every(origin => {
      try {
        const url = new URL(origin);
        return url.origin === origin && ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    }), 'CLIENT_URL must contain one or more valid origins separated by commas.'),
  TRUST_PROXY: z.coerce.number().int().min(1).optional(),
  ALLOW_TEACHER_SIGNUP: z.enum(['true', 'false']).default('false')
    .transform(value => value === 'true'),
}).superRefine((config, ctx) => {
  if (config.NODE_ENV !== 'production') return;
  const mongoOptions = config.MONGO_URI.split('?')[1] || '';
  if (!config.MONGO_URI.startsWith('mongodb+srv://') && !/[?&](tls|ssl)=true(?:&|$)/i.test(mongoOptions)) {
    ctx.addIssue({
      code: 'custom',
      path: ['MONGO_URI'],
      message: 'Production MongoDB connections must use TLS.',
    });
  }
  if (config.CLIENT_URL.some(origin => !origin.startsWith('https://'))) {
    ctx.addIssue({
      code: 'custom',
      path: ['CLIENT_URL'],
      message: 'Production client origins must use HTTPS.',
    });
  }
  if (config.CLIENT_URL.some(origin => {
    try {
      return /localhost|127\.0\.0\.1/.test(new URL(origin).hostname);
    } catch {
      return false;
    }
  })) {
    ctx.addIssue({
      code: 'custom',
      path: ['CLIENT_URL'],
      message: 'Production client origins cannot point to localhost.',
    });
  }
  if (config.CLIENT_URL.some(origin => {
    try {
      return /(^|\.)example\.(com|org|net)$/i.test(new URL(origin).hostname);
    } catch {
      return false;
    }
  })) {
    ctx.addIssue({
      code: 'custom',
      path: ['CLIENT_URL'],
      message: 'Replace placeholder example domains with your production frontend origin.',
    });
  }
});

const validateEnv = (env = process.env) => {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const messages = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new ApiError(500, `Invalid server configuration: ${messages}`);
  }
  return parsed.data;
};

module.exports = validateEnv;
