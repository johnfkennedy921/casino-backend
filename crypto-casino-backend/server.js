const express = require('express');
const TonWeb = require('tonweb');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');  // To enable Cross-Origin requests

// Initialize Firestore
admin.initializeApp();
const db = admin.firestore();

// Set up TonWeb
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));

// Create a basic Express app
const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Define the wallet address (replace with your actual wallet address)
const walletAddress = 'UQD47vLueaRaz5PrUE7U8Y6PxaGdnP_NF0GmebUK8stehXna';

// Initial pot size (set to 50 TON)
let potSize = 50; 

// Create a function to check for incoming payments
const trackIncomingPayments = async () => {
  try {
    const transactions = await tonweb.provider.getTransactions(walletAddress); // Get transactions to your wallet

    transactions.forEach(async (tx) => {
      if (tx.destination === walletAddress) {
        const amountInTon = tx.value;  // Amount of TON sent

        // Check if the transaction is valid
        if (amountInTon > 0) {
          // Find the user based on their wallet address
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

// Function to get a user ID from the wallet address (using Firestore)
const getUserIdFromWallet = async (walletAddress) => {
  try {
    const userRef = db.collection('users').where('walletAddress', '==', walletAddress);
    const userSnapshot = await userRef.get();

    if (userSnapshot.empty) {
      console.log('No user found for wallet address:', walletAddress);
      return null;
    }

    const userDoc = userSnapshot.docs[0]; // Assuming wallet address is unique
    return userDoc.data().userId;  // Return user ID from the Firestore document
  } catch (error) {
    console.error('Error fetching user ID from wallet address:', error);
    return null;
  }
};

// Function to add chips to a user's balance
const addChipsToUser = async (userId, amount) => {
  try {
    const userRef = db.collection('users').doc(userId.toString());  // Assuming userId is the document ID
    await userRef.update({
      balance: admin.firestore.FieldValue.increment(amount),  // Increment the user's balance by the given amount
    });
    console.log(`Added ${amount} chips to user with ID: ${userId}`);
  } catch (error) {
    console.error('Error adding chips to user:', error);
  }
};

// Function to handle betting and ensure the minimum bet of 2 TON
const handleBet = async (userId, betAmount) => {
  const minBetAmount = 2; // Define minimum bet as 2 TON

  // Ensure the bet is not less than 2 TON
  if (betAmount < minBetAmount) {
    throw new Error('Bet amount cannot be less than 2 TON');
  }

  // If bet is valid, subtract chips and process the game logic (implement your own game logic)
  try {
    const userRef = db.collection('users').doc(userId.toString());
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userBalance = userDoc.data().balance;

    // Ensure the user has enough balance
    if (userBalance < betAmount) {
      throw new Error('Insufficient balance');
    }

    // Proceed with the game logic (subtract chips for the bet, etc.)
    await userRef.update({
      balance: admin.firestore.FieldValue.increment(-betAmount),  // Subtract bet amount
    });

    console.log(`Bet of ${betAmount} TON placed for user with ID: ${userId}`);

    // Update the pot size by adding 20% of the bet amount to the pot
    const potContribution = betAmount * 0.2;
    potSize += potContribution;

    // Return success and the updated pot size
    return { success: true, message: 'Bet placed successfully', potSize };
  } catch (error) {
    console.error('Error handling bet:', error);
    return { success: false, error: error.message };
  }
};

// Example endpoint to place a bet (with validation for minimum bet)
app.post('/place-bet', async (req, res) => {
  const { userId, betAmount } = req.body;

  // Handle the bet and ensure the minimum bet amount is met
  try {
    const result = await handleBet(userId, betAmount);
    res.send(result);
  } catch (error) {
    res.status(400).send({ success: false, error: error.message });
  }
});

// Example endpoint to manually trigger payment check (for testing)
app.post('/add-chips', (req, res) => {
  const { userId, amount } = req.body;
  addChipsToUser(userId, amount);
  res.send({ success: true, message: 'Chips added successfully' });
});

// Poll for incoming payments every 30 seconds
setInterval(trackIncomingPayments, 30000);  // Polling interval

// Endpoint to get the current pot size
app.get('/pot-size', (req, res) => {
  res.json({ success: true, potSize: potSize });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});