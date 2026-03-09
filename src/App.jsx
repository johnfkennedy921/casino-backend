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

// API base URL
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
function BuyChipsModal({ onClose }) {
  const paymentAddress = 'UQD47vLueaRaz5PrUE7U8Y6PxaGdnP_NF0GmebUK8stehXna'; // Hardcoded address
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
  const [potSize, setPotSize] = useState(1337);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showBuyChips, setShowBuyChips] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default bet amount (2 TON)
  const defaultBetAmount = 2;

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

  // Fetch user's chip balance
  const fetchBalance = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/v1/casino/balance/${userId}`);
      const data = await res.json();
      if (data.success) {
        // Use Decimal.js for precise rounding
        const fixedBalance = new Decimal(data.chips).toFixed(2);  // Round to 2 decimal places
        setBalance(fixedBalance);
      }
    } catch (e) {
      console.log('Using local balance');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchBalance(); // Fetch balance when userId is set
    }
  }, [userId, fetchBalance]);

  // Handle bet placement
  const handleBet = async (betAmount = defaultBetAmount, gameType, result, payout = 0) => {
    if (!userId) {
      alert('Please connect wallet or open in Telegram');
      return false;
    }

    if (balance < betAmount) {
      setShowBuyChips(true);
      return false;
    }

    try {
      console.log("Betting Amount: ", betAmount);
      const res = await fetch(`${API_BASE}/api/v1/casino/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          bet_amount: Math.floor(betAmount),
          game: gameType,
          result: result,
          payout: Math.floor(payout),
        }),
      });

      const data = await res.json();
      console.log('API Response:', data);

      if (data.success) {
        // Use Decimal.js for precise rounding
        const newBalance = new Decimal(data.chips).toFixed(1);  // Round to 2 decimal places
        setBalance(newBalance);
        setPotSize(prev => prev + Math.floor(betAmount * 0.2)); // Update pot size
        return true;
      } else {
        console.error('Bet failed:', data.error);
        alert('Bet failed, try again');
        return false;
      }
    } catch (e) {
      console.error('Bet error:', e);
      alert('Error while placing bet. Please try again.');
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
      {showBuyChips && <BuyChipsModal onClose={() => setShowBuyChips(false)} />}
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

        {showLoyalty && <LoyaltyCard onClose={() => setShowLoyalty(false)} onCredit={(amount) => setBalance(prev => prev + amount)} />}

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