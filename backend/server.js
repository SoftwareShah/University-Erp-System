require('dotenv').config();
const validateEnv = require('./config/env');
const mongoose = require('mongoose');

let shuttingDown = false;

const shutdown = async (server, signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; shutting down.`);

  const forcedShutdown = setTimeout(() => {
    console.error('Graceful shutdown timed out; closing active HTTP connections.');
    server.closeAllConnections();
  }, 10000);
  forcedShutdown.unref();

  try {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
    await mongoose.disconnect();
  } catch (error) {
    console.error(`Graceful shutdown failed (${error.name || 'Error'}).`);
    process.exitCode = 1;
  } finally {
    clearTimeout(forcedShutdown);
  }
};

const start = async () => {
  const config = validateEnv();
  if (config.TRUST_PROXY) {
    process.env.TRUST_PROXY = String(config.TRUST_PROXY);
  }

  const app = require('./app');
  const connectDB = require('./config/db');
  await connectDB();

  const server = app.listen(config.PORT, () => {
    console.log(`Server listening on port ${config.PORT} (${config.NODE_ENV}).`);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => shutdown(server, signal));
  }
};

start().catch(async error => {
  console.error('Server startup failed:', error);

  await mongoose.disconnect().catch(disconnectError => {
    console.error('Database cleanup failed:', disconnectError);
  });

  process.exitCode = 1;
});

