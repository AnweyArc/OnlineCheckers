import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import BackgroundLottie from '../components/BackgroundLottie';

export default function PlayerStats() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.push('/');
        return;
      }

      setDisplayName(user.user_metadata?.display_name || 'Player');

      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .or(`player_red.eq.${user.id},player_black.eq.${user.id}`);

      if (error) {
        console.error('Failed to fetch games:', error);
        setLoading(false);
        return;
      }

      let wins = 0, losses = 0, forfeits = 0;

      games.forEach((game) => {
        const isRed = `${game.player_red}` === `${user.id}`;
        const isBlack = `${game.player_black}` === `${user.id}`;

        if ((isRed && game.forfeited_by === 'r') || (isBlack && game.forfeited_by === 'b')) {
          forfeits++;
        }

        if (!game.winner) return;

        if ((game.winner === 'r' && isRed) || (game.winner === 'b' && isBlack)) {
          wins++;
        }

        if ((game.winner === 'r' && isBlack) || (game.winner === 'b' && isRed)) {
          losses++;
        }
      });

      setStats({ total: games.length, wins, losses, forfeits });
      setLoading(false);
    };

    fetchStats();
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Lottie */}
      <div className="absolute inset-0 z-0">
        <BackgroundLottie />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 rounded-xl shadow-2xl bg-gradient-to-br from-sky-400 via-purple-400 to-pink-400 p-[2px] w-full max-w-lg animate-gradient">
        {/* Inner Content Card */}
        <div className="bg-white rounded-xl p-6 w-full h-full">
          <h2 className="text-3xl font-semibold text-sky-800 mb-4">
            Player Stats
            <div className="mt-2 h-1 w-16 bg-sky-100 rounded-full" />
          </h2>

          <p className="mb-6 text-sky-600 text-lg">
            Hello, <span className="font-medium text-sky-700">{displayName}</span>!
          </p>

          {loading ? (
            <p className="text-center text-sky-400 italic">Loading statistics...</p>
          ) : (
            <ul className="space-y-4">
              <li className="flex justify-between items-center bg-sky-50 px-4 py-3 rounded-lg">
                <span className="text-sky-700 font-medium">Total Games</span>
                <span className="text-sky-900 font-semibold">{stats.total}</span>
              </li>
              <li className="flex justify-between items-center bg-green-50 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 p-1 rounded-full">🏆</span>
                  <span className="text-green-700 font-medium">Wins</span>
                </div>
                <span className="text-green-900 font-semibold">{stats.wins}</span>
              </li>
              <li className="flex justify-between items-center bg-rose-50 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="bg-rose-100 p-1 rounded-full">❌</span>
                  <span className="text-rose-700 font-medium">Losses</span>
                </div>
                <span className="text-rose-900 font-semibold">{stats.losses}</span>
              </li>
              <li className="flex justify-between items-center bg-amber-50 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-100 p-1 rounded-full">🚫</span>
                  <span className="text-amber-700 font-medium">Forfeits</span>
                </div>
                <span className="text-amber-900 font-semibold">{stats.forfeits}</span>
              </li>
            </ul>
          )}

          <div className="mt-8 space-y-3">
            <button
              className="w-full px-6 py-2.5 text-sm font-medium text-sky-700 bg-sky-100 rounded-lg transition-all hover:bg-sky-200 hover:text-sky-900"
              onClick={() => router.push('/leaderboards')}
            >
              View Leaderboards
            </button>
            <button
              className="w-full px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg transition-all hover:bg-gray-200 hover:text-gray-900"
              onClick={() => router.push('/homescreen')}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}