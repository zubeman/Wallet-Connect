const csurf = require('csurf');

module.exports = csurf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
});
