module.exports = function errorHandler(err, req, res, next) {
  console.error(`Error on ${req.method} ${req.path}:`, err.stack);

  let statusCode = 500;
  let errorDetails = {
    error: 'An error occurred',
    message: 'Something went wrong on our end'
  };

  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      errorDetails.error = 'Validation Error';
      errorDetails.message = 'Invalid data provided';
      errorDetails.details = Object.values(err.errors).map(e => e.message);
      break;

    case 'BadRequest':
      statusCode = 400;
      errorDetails.error = 'Bad Request';
      errorDetails.message = err.message || 'Invalid request';
      break;

    case 'UnauthorizedError':
      statusCode = 401;
      errorDetails.error = 'Unauthorized';
      errorDetails.message = 'Authentication failed';
      break;

    case 'Forbidden':
      statusCode = 403;
      errorDetails.error = 'Forbidden';
      errorDetails.message = 'You do not have permission to access this resource';
      break;

    case 'NotFoundError':
      statusCode = 404;
      errorDetails.error = 'Not Found';
      errorDetails.message = 'The resource you are looking for does not exist';
      break;

    case 'Conflict':
      statusCode = 409;
      errorDetails.error = 'Conflict';
      errorDetails.message = err.message || 'Conflict in request';
      break;

    case 'TooManyRequests':
      statusCode = 429;
      errorDetails.error = 'Too Many Requests';
      errorDetails.message = 'You have made too many requests, please try again later';
      break;

    case 'DatabaseError':
      statusCode = 503;
      errorDetails.error = 'Database Error';
      errorDetails.message = 'Database operation failed, please try again later';
      break;

    default:
      if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        errorDetails.message = 'Service temporarily unavailable';
      } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        errorDetails.error = 'JSON Parse Error';
        errorDetails.message = 'Invalid JSON in request body';
      }
  }

  if (err.status) {
    statusCode = err.status;
  }

  res.status(statusCode).json(errorDetails);
};
