import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import MatrixRain from './components/MatrixRain';
import FrogDealer from './components/FrogDealer';
import LotteryCountdown from './components/LotteryCountdown';
import PotDisplay from './components/PotDisplay';
import LoyaltyCard from './components/LoyaltyCard';
import Decimal from 'decimal.js'; // Import Decimal.js

// Lazy load games - only loaded when user selects them
const SlotsGame = lazy(() => import('./games/SlotsGame'));
const RouletteGame = lazy(() => import('./games/RouletteGame'));
const CrashGame = lazy(() => import('./games/CrashGame'));

// API base URL for the live backend
const API_BASE = 'https://casino-backend-1-j04v.onrender.com';

// Loading skeleton for games
function GameLoading() {
  return (
    <div className="game-card p-8 text-center animate-pulse">
      <div className="text-4xl mb-4">🎲</div>
      <p className="font-casino text-matrix-green">LOADING GAME...</p>
    </div>
  );
}

// Buy Chips Modal Component
function BuyChipsModal({ onClose, paymentAddress }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="game-card max-w-sm w-full p-6">
        <h2 className="font-casino text-2xl text-center neon-text mb-4">
          💰 BUY CHIPS
        </h2>
        <div className="space-y-3 mb-6">
          <p className="font-casino text-lg">Send your payment to the following address:</p>
          <div style={{ wordWrap: 'break-word', maxWidth: '100%' }}>
            <p className="font-mono text-center text-xl" style={{ maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {paymentAddress}
            </p>
          </div>
          <p className="font-casino text-center mt-4">Please send the amount of TON you want to purchase.</p>
        </div>
        <button onClick={onClose} className="w-full mt-3 text-matrix-green/70 hover:text-matrix-green">
          Close
        </button>
      </div>
    </div>
  );
}

function App() {
  const { connect, disconnect, connected } = useTonConnectUI();
  const wallet = useTonWallet();
  const [activeGame, setActiveGame] = useState(null);
  const [balance, setBalance] = useState(0);
  const [potSize, setPotSize] = useState(50); // Initially set to 50 (from backend)
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showBuyChips, setShowBuyChips] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default bet amount (2 TON)
  const defaultBetAmount = 2;

  // Fetch current pot size from the backend (real pot size)
  const fetchPotSize = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/pot-size`);
      const data = await response.json();
      if (data.success) {
        setPotSize(data.potSize);  // Update pot size from backend
      }
    } catch (error) {
      console.error("Error fetching pot size:", error);
      alert('Failed to load pot size. Please try again later.');
    }
  }, []);

  useEffect(() => {
    fetchPotSize(); // Fetch the pot size when the app loads
  }, [fetchPotSize]);

  // Get Telegram user ID on mount
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setBackgroundColor('#0d0d0d');
      tg.setHeaderColor('#0d0d0d');
      
      const user = tg.initDataUnsafe?.user;
      if (user?.id) {
        setUserId(user.id);
      }
    }
    
    if (!userId && wallet?.account?.address) {
      const hash = wallet.account.address.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      setUserId(Math.abs(hash) % 1000000000);
    }
    
    if (!userId) {
      const guestId = localStorage.getItem('casino_guest_id') || 
        Math.floor(Math.random() * 1000000000);
      localStorage.setItem('casino_guest_id', guestId);
      setUserId(parseInt(guestId));
    }
  }, [wallet, userId]);

  // Handle bet placement
  const handleBet = async (betAmount = defaultBetAmount, gameType, result, payout = 0) => {
    if (!userId) {
      alert('Please connect wallet or open in Telegram');
      return false;
    }

    // Prevent bet if amount is less than 2 TON
    if (betAmount < 2) {
      alert('Minimum bet is 2 TON');
      return false;
    }

    if (balance < betAmount) {
      setShowBuyChips(true);
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/place-bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          betAmount: betAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Bet placed successfully');
        // Update the pot size based on the backend logic
        setPotSize(data.potSize); // Get updated pot size from the backend response
        return true;
      } else {
        alert('Error: ' + data.error);
        return false;
      }
    } catch (e) {
      alert('Error placing bet: ' + e.message);
      return false;
    }
  };

  const games = [
    { id: 'slots', name: 'POLITICIAN SLOTS', icon: '🎰', component: SlotsGame },
    { id: 'roulette', name: 'ELECTION ROULETTE', icon: '🎯', component: RouletteGame },
    { id: 'crash', name: 'FROG ROCKET', icon: '🚀', component: CrashGame },
  ];

  const ActiveGameComponent = activeGame ? games.find(g => g.id === activeGame)?.component : null;

  return (
    <div className="min-h-screen bg-matrix-dark relative overflow-hidden">
      <MatrixRain />
      {showBuyChips && <BuyChipsModal onClose={() => setShowBuyChips(false)} paymentAddress={wallet?.account?.address} />}
      <div className="relative z-10 p-4 max-w-lg mx-auto">
        <header className="text-center mb-6">
          <h1 className="font-casino text-3xl font-black neon-text tracking-wider">Froog</h1>
          <p className="text-lg neon-pink font-casino">CASINO</p>
          <FrogDealer />
        </header>

        <div className="mb-6 space-y-4">
          <PotDisplay potSize={potSize} />
          <LotteryCountdown />
        </div>

        <div className="mb-6 flex gap-2 justify-center">
          {connected ? (
            <div className="game-card text-center px-4 py-2">
              <span className="text-xs text-matrix-green/70">CONNECTED</span>
              <p className="font-mono text-sm truncate max-w-[150px]">{wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}</p>
              <button onClick={disconnect} className="btn-casino btn-ton mt-2">DISCONNECT TON WALLET</button>
            </div>
          ) : (
            <button onClick={connect} className="btn-casino btn-ton">CONNECT TON WALLET</button>
          )}
          <button onClick={() => setShowLoyalty(!showLoyalty)} className="btn-casino btn-stars">LOYALTY CARD</button>
        </div>

        <div className="text-center mb-6">
          <div className="inline-block game-card px-6 py-3">
            {loading ? <span className="text-matrix-green/50 font-casino">LOADING...</span> : (
              <>
                <span className="text-casino-gold font-casino text-2xl">{balance ? balance : '0'} CHIPS</span>
                {balance < 10 && <p className="text-xs text-red-400 mt-1">Low balance! Buy more chips</p>}
              </>
            )}
          </div>
        </div>

        {!activeGame ? (
          <div className="space-y-4">
            <h2 className="text-center font-casino text-xl neon-cyan mb-4">SELECT YOUR GAME</h2>
            {games.map(game => (
              <button key={game.id} onClick={() => setActiveGame(game.id)} className="w-full game-card flex items-center justify-between p-4 hover:scale-102 transition-transform">
                <span className="text-4xl">{game.icon}</span>
                <span className="font-casino text-lg">{game.name}</span>
                <span className="text-2xl">{'>'}</span>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <button onClick={() => setActiveGame(null)} className="mb-4 text-matrix-green hover:text-white transition-colors">{'<'} BACK TO LOBBY</button>
            <Suspense fallback={<GameLoading />}>
              <ActiveGameComponent balance={balance} setBalance={setBalance} onBet={handleBet} wallet={wallet} userId={userId} />
            </Suspense>
          </div>
        )}

        <div className="mt-8 text-center">
          <button className="btn-casino btn-stars text-black text-lg py-3 px-8" onClick={() => setShowBuyChips(true)}>
            💰 BUY CHIPS
          </button>
          <p className="text-xs text-matrix-green/50 mt-2">20% of all bets feed the lottery pot 🐸</p>
        </div>

        <footer className="mt-8 text-center text-xs text-matrix-green/30">
          <p>POWERED BY Froog x TON</p>
          <p>gamble responsibly you degen</p>
        </footer>
      </div>
    </div>
  );
}

export default App;