// index.js
import express from 'express';
import connectDB from './db/db.js';  // Use .js extension with ES modules
import generateUserWallet from './generateUserWallet/generateUserWallet.js';  // Use .js extension with ES modules

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Sample route to generate wallet for the user when they first access the app
app.post('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  // Generate wallet and store user in MongoDB
  const user = await generateUserWallet(userId);

  res.status(201).send({
    message: `User with ID ${userId} generated a TON wallet.`,
    wallet_address: user.wallet_address,
  });
});

// Route to test if MongoDB connection is working
app.get('/', (req, res) => {
  res.send('MongoDB is connected!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});