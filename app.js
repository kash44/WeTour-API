const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global Middlewares - for all ROUTES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers - Must be at top of middleware stack
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
// Limiter needs to be adjusted for use-case. Some applications may need more requests by nature.
const limiter = rateLimit({
  max: 100, // request amount
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!',
});

// Affect all the routes that start with /api
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // body gets added to data

// Data sanitization against NoSQL query Injection
// Will look at req.body, .queryString and .params and filter out all $ and . which mongodb operators use.
app.use(mongoSanitize());

// Data sanitization against XSS attacks
// Clean any user input from malicious HTML
app.use(xss());

// Prevent parameter polution - should be used at the end as it clears the query string.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ], // list of allowed duplicates
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// Mounting the router - ROUTES

app.get('/overview', (req, res) => {
  res.status(200).render('overview', {
    title: 'All tours',
  });
});

app.get('/tour', (req, res) => {
  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour',
  });
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// If we reach this middleware, this means the routes above didnt match so then we handle it here
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

// 4) Start Server
module.exports = app;
