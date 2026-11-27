require('dotenv').config();

const express        = require('express');
const morgan         = require('morgan');
const helmet         = require('helmet');
const cors           = require('cors');
const cookieParser   = require('cookie-parser');
const mongoSanitize  = require('express-mongo-sanitize');

const rateLimit      = require('express-rate-limit');
const hpp            = require('hpp');

const { authenticate, authorize } = require('./middlewares/auth');
const errorHandler   = require('./utils/errorHandler');
const uploadDirectory = require('./config/uploadDirectory');

const authRoutes    = require('./routes/auth');
const adminRoutes   = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// ── CORS — allow configured frontend origins only
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY));
}

// ── Request logging (dev only) ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Body parser — limit 10kb to prevent large payload attacks ─────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') mongoSanitize.sanitize(req.body);
  next();
});

// ── Cookie parser ─────────────────────────────────────────────────────────────
app.use(cookieParser());



// ── Prevent HTTP parameter pollution ─────────────────────────────────────────
app.use(hpp());

// ── Rate limiting on auth routes — 20 requests per 15 min ────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── General API rate limit — 100 requests per 15 min ─────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Serve uploaded files as static ──────────────────────────────────────────
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadDirectory, { maxAge: '1y', immutable: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'DBUU ERP API is running.' });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ success: true, status: 'live' });
});

app.get('/health/ready', (req, res) => {
  const ready = require('mongoose').connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ success: ready, status: ready ? 'ready' : 'not ready' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/admin',   apiLimiter, authenticate, authorize('admin'),   adminRoutes);
app.use('/api/teacher', apiLimiter, authenticate, authorize('teacher'), teacherRoutes);
app.use('/api/student', apiLimiter, authenticate, authorize('student'), studentRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
