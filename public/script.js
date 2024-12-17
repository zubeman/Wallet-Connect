document.addEventListener('DOMContentLoaded', () => {
  // Function to fetch and display QR code
  const fetchQRCode = () => {
    fetch('/connect')
      .then(response => response.json())
      .then(data => {
        document.getElementById('qr-code').innerHTML = `<img src="${data.qrCodeBase64}" alt="QR Code">`;
      })
      .catch(error => console.error('Error fetching QR code:', error));
  };

  // Function to initiate transfer
  const initiateTransfer = () => {
    fetch('/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Transfer initiated! Transaction hash: ' + data.txHash);
      } else {
        alert('Error initiating transfer: ' + data.error);
      }
    })
    .catch(error => console.error('Error during transfer:', error));
  };

  fetchQRCode();
  document.getElementById('initiate-transfer').addEventListener('click', initiateTransfer);
});
