const express = require('express');
const TonWeb = require('tonweb');
const bodyParser = require('body-parser');

// Set up TonWeb
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));

// Create a basic Express app
const app = express();
app.use(bodyParser.json());

// Define the wallet address (replace with your actual wallet address)
const walletAddress = 'UQD47vLueaRaz5PrUE7U8Y6PxaGdnP_NF0GmebUK8stehXna';

// Create a function to check for incoming payments
const trackIncomingPayments = async () => {
  try {
    const transactions = await tonweb.provider.getTransactions(walletAddress); // Get transactions to your wallet

    transactions.forEach(async (tx) => {
      if (tx.destination === walletAddress) {
        const amountInTon = tx.value;  // Amount of TON sent

        // Check if the transaction is valid
        if (amountInTon > 0) {
          // Here, you would find the user based on their wallet address
          const userId = await getUserIdFromWallet(tx.sender);  // You need to implement this
          
          // Update the user’s balance
          if (userId) {
            addChipsToUser(userId, amountInTon);  // Add chips to user balance
          }
        }
      }
    });
  } catch (e) {
    console.error('Error tracking transactions:', e);
  }
};

// Simulated function to get a user ID from the wallet address
const getUserIdFromWallet = async (walletAddress) => {
  // You can look this up from a database where you store user wallet mappings
  return 123;  // Example user ID (replace with your logic)
};

// Function to add chips to a user's balance
const addChipsToUser = (userId, amount) => {
  // Here, you would update the user's chip balance in your database
  console.log(`Adding ${amount} chips to user with ID: ${userId}`);
  // Update the database with the new chip balance for the user
  // Example: User.update({ id: userId }, { $inc: { chips: amount } });
};

// Poll for incoming payments every 30 seconds
setInterval(trackIncomingPayments, 30000);  // Polling interval

// Example endpoint to manually trigger payment check (for testing)
app.post('/add-chips', (req, res) => {
  const { userId, amount } = req.body;
  addChipsToUser(userId, amount);
  res.send({ success: true, message: 'Chips added successfully' });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});