// ES6 CLASS INHERITANCE
class AppError extends Error {
  // constructor method called each time we create a new object out of this class
  constructor(message, statusCode) {
    // parent class is Error, whatever we pass into it will be the message property
    // by doing this, we already set the message property to our incoming message
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // All the errors we create ourselves, only want to send to client in production
    this.isOperational = true;

    // When new objects are created and the constructor function is called
    // It wont appear in the stack trace, polluting it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
