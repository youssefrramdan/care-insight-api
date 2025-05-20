import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import globalError from './middlewares/errorMiddleware.js';
import ApiError from './utils/apiError.js';
import authRouter from './routes/auth.routes.js';
import specialtyRouter from './routes/specialty.routes.js';
import userRouter from './routes/user.routes.js';
import diagnosisRouter from './routes/diagnosis.routes.js';
import appointmentRouter from './routes/appointment.routes.js';
import reviewRouter from './routes/review.routes.js';

dotenv.config({ path: './config/config.env' });

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(compression());

// middlewares
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode : ${process.env.NODE_ENV}`);
}

//mount Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/specialties', specialtyRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/diagnosis', diagnosisRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/reviews', reviewRouter);
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 400));
});

// Global error
app.use(globalError);

export default app;
