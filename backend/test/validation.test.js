const test = require('node:test');
const assert = require('node:assert/strict');
const validateEnv = require('../config/env');
const { isValidDateOnly } = require('../utils/validation');

test('production environment rejects weak required configuration', () => {
  assert.throws(() => validateEnv({
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb+srv://localhost/test',
    JWT_SECRET: 'too-short',
    CLIENT_URL: 'https://portal.university.edu',
  }), /Invalid server configuration/);
});

test('environment accepts configured production values and defaults signup off', () => {
  const config = validateEnv({
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb+srv://cluster.example.net/db',
    JWT_SECRET: 'a'.repeat(40),
    CLIENT_URL: 'https://portal.university.edu',
  });

  assert.equal(config.ALLOW_TEACHER_SIGNUP, false);
  assert.equal(config.PORT, 3000);
});

test('production environment accepts exact HTTPS origins and rejects unsafe origins', () => {
  const config = validateEnv({
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb+srv://user:pass@example.mongodb.net/db',
    JWT_SECRET: 'b'.repeat(48),
    CLIENT_URL: 'https://portal.university.edu,https://admin.university.edu',
    JWT_EXPIRES_IN: '15m',
  });
  assert.deepEqual(config.CLIENT_URL, ['https://portal.university.edu', 'https://admin.university.edu']);

  for (const CLIENT_URL of ['http://portal.university.edu', 'https://localhost:5173', 'https://portal.example.com', 'not-a-url']) {
    assert.throws(() => validateEnv({
      NODE_ENV: 'production',
      MONGO_URI: 'mongodb+srv://user:pass@example.mongodb.net/db',
      JWT_SECRET: 'b'.repeat(48),
      CLIENT_URL,
    }), /Invalid server configuration/);
  }

  assert.throws(() => validateEnv({
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb://mongo.example.net/db',
    JWT_SECRET: 'b'.repeat(48),
    CLIENT_URL: 'https://portal.university.edu',
  }), /Invalid server configuration/);
});

test('date-only validation accepts real calendar dates only', () => {
  assert.equal(isValidDateOnly('2024-02-29'), true);
  assert.equal(isValidDateOnly('2023-02-29'), false);
  assert.equal(isValidDateOnly('2024-13-01'), false);
  assert.equal(isValidDateOnly('2024-1-01'), false);
});
