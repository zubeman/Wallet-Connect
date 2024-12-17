const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window for rate limiting
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after some time.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    // Custom handler for when rate limit is exceeded
    res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many requests, please try again later."
    });
  }
});
