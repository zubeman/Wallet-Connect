const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const walletService = require('../services/walletService'); 
const Transaction = require('../models/Transaction'); 

exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create(username, hashedPassword);
    
    req.session.userId = userId;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'User registered', token });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully', token });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
};

// Wallet Connection and Transfer Methods
exports.connect = async (req, res, next) => {
  try {
    await walletService.initWalletConnect();
    const walletSession = await walletService.connectWallet(req, res);
    res.json({ message: 'Wallet connected', session: walletSession });
  } catch (error) {
    next(error);
  }
};

exports.transfer = async (req, res, next) => {
  try {
    const result = await walletService.initiateTransfer(req, res);
    if (result.success) {
      await Transaction.log(req.session.userId, result.txHash, result.amount);
      res.json({ message: 'Transfer initiated', txHash: result.txHash });
    } else {
      res.status(500).json({ error: 'Transfer failed', details: result.error });
    }
  } catch (error) {
    next(error);
  }
};
