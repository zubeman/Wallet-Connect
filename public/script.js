document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('form');
  const qrCodeDiv = document.getElementById('qr-code');
  const transferButton = document.getElementById('initiate-transfer');
  const statusMessage = document.getElementById('status-message') || document.createElement('div');

  // Ensure status message is in the DOM
  if (!document.getElementById('status-message')) {
    statusMessage.id = 'status-message';
    document.body.appendChild(statusMessage);
  }

  // Login Form Handling
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(result => {
      if (result.message === 'Logged in successfully') {
        localStorage.setItem('token', result.token);
        alert('Login successful! Redirecting to dashboard.');
        window.location.href = '/dashboard';
      } else {
        throw new Error('Login failed');
      }
    })
    .catch(error => {
      console.error('Login Error:', error);
      statusMessage.textContent = 'Login failed: ' + error.message;
    });
  }

  // Fetch QR code for wallet connection
  function fetchQRCode() {
    const token = localStorage.getItem('token');
    if (!token) {
      statusMessage.textContent = 'Please log in to connect your wallet.';
      return;
    }

    fetch('/wallet/connect', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      qrCodeDiv.innerHTML = `<img src="${data.qrCodeBase64}" alt="QR Code">`;
      statusMessage.textContent = 'Scan this QR code with your wallet to connect.';
      // Now start checking wallet status in real-time
      startPollingWalletStatus();
    })
    .catch(error => {
      console.error('QR Code Error:', error);
      statusMessage.textContent = 'Error: ' + error.message;
    });
  }

  // Start polling wallet status
  function startPollingWalletStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;

    function pollStatus() {
      fetch('/wallet/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.connected) {
          statusMessage.textContent = 'Wallet connected!';
          if (transferButton) {
            transferButton.disabled = false;
            transferButton.textContent = 'Send Airdrop'; // Button text update
          }
        } else {
          statusMessage.textContent = 'Wallet not connected. Please scan the QR code.';
          if (transferButton) {
            transferButton.disabled = true;
            transferButton.textContent = 'Send Airdrop'; // Keep the text consistent
          }
        }
        // Schedule next polling
        setTimeout(pollStatus, 5000); // 5 seconds interval
      })
      .catch(error => {
        console.error('Wallet Status Check Error:', error);
        statusMessage.textContent = 'Error checking wallet status: ' + error.message;
        // Schedule next attempt after error
        setTimeout(pollStatus, 5000);
      });
    }

    // Start polling immediately
    pollStatus();
  }

  // Function to handle both wallet connection and transfer
  function handleAirdrop() {
    const token = localStorage.getItem('token');
    if (!token) {
      statusMessage.textContent = 'Please log in to initiate an airdrop.';
      return;
    }

    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    if (!csrfToken) {
      console.error('CSRF token not found');
      statusMessage.textContent = 'Security error: CSRF token missing';
      return;
    }

    // Check if wallet is connected first
    fetch('/wallet/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(statusData => {
      if (!statusData.connected) {
        // If not connected, attempt connection
        return fetchQRCode().then(() => {
          statusMessage.textContent = 'Connecting wallet, please scan the QR code...';
          // Wait a bit for user to connect wallet
          return new Promise(resolve => setTimeout(resolve, 10000));
        });
      }
      return Promise.resolve();
    })
    .then(() => {
      // Now attempt the transfer
      return fetch('/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken
        }
      });
    })
    .then(response => response.json())
    .then(data => {
      statusMessage.textContent = 'Airdrop sent! Transaction hash: ' + data.txHash;
    })
    .catch(error => {
      console.error('Airdrop Error:', error);
      statusMessage.textContent = 'Airdrop failed: ' + error.message;
    });
  }

  // Event listener for transfer button now handles both connection and transfer
  if (transferButton) {
    transferButton.addEventListener('click', handleAirdrop);
    // Fetch QR code when dashboard loads, but don't disable button if wallet isn't connected
    fetchQRCode();
  }
});
