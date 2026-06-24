const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { publicLimiter } = require('./middleware/rateLimiter');
const leadRoutes = require('./routes/leadRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Cron Jobs
const { initCronJobs } = require('./utils/cronJobs');
initCronJobs();

// Initialize WhatsApp service (if used)
const { initWhatsApp } = require('./services/whatsappService');
initWhatsApp();

const app = express();

// ═══════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════

// Helmet — sets secure HTTP headers (CSP, HSTS, X-Frame, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Body parser with size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// NoSQL injection prevention — strips $ and . from req.body/query/params
app.use(mongoSanitize());

// HTTP parameter pollution prevention
app.use(hpp());

// Global rate limiter (20 req/min/IP) — applied to all routes
app.use(publicLimiter);

// ⭐ CORS Configuration — environment-aware
const allowedOrigins = [
  'https://admin.trimaxconnect.in',
  'https://admin.trimaxconnect.com',
  process.env.FRONTEND_URL,
];

// Only allow localhost in development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
}

app.use(cors({
  origin: allowedOrigins.filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ═══════════════════════════════════════════════
// MOUNT ROUTES
// ═══════════════════════════════════════════════
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/leads', leadRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running!',
    timestamp: new Date()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;