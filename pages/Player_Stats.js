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
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 p-4 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
        <BackgroundLottie />
      </div>
  
      {/* Glowing Border Effect */}
      <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur-xl opacity-40 animate-pulse z-10 pointer-events-none" />
  
      {/* Foreground Card */}
      <div className="relative z-20 w-full max-w-lg rounded-2xl shadow-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 p-[2px] overflow-hidden">
        <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl px-8 py-10 w-full h-full">
          <h2 className="text-3xl font-bold text-amber-100 mb-4">
            Player Stats
            <div className="mt-2 h-1 w-16 bg-amber-400 rounded-full" />
          </h2>
  
          <p className="mb-6 text-amber-200 text-lg">
            Hello, <span className="font-medium text-amber-400">{displayName}</span>!
          </p>
  
          {loading ? (
            <p className="text-center text-amber-300 italic">Loading statistics...</p>
          ) : (
            <ul className="space-y-4">
              <li className="flex justify-between items-center bg-amber-100/10 px-4 py-3 rounded-lg border border-amber-400/20">
                <span className="text-amber-300 font-medium">Total Games</span>
                <span className="text-amber-100 font-semibold">{stats.total}</span>
              </li>
              <li className="flex justify-between items-center bg-green-100/10 px-4 py-3 rounded-lg border border-green-400/20">
                <div className="flex items-center space-x-2">
                  <span className="bg-green-200/20 p-1 rounded-full">🏆</span>
                  <span className="text-green-300 font-medium">Wins</span>
                </div>
                <span className="text-green-100 font-semibold">{stats.wins}</span>
              </li>
              <li className="flex justify-between items-center bg-rose-100/10 px-4 py-3 rounded-lg border border-rose-400/20">
                <div className="flex items-center space-x-2">
                  <span className="bg-rose-200/20 p-1 rounded-full">❌</span>
                  <span className="text-rose-300 font-medium">Losses</span>
                </div>
                <span className="text-rose-100 font-semibold">{stats.losses}</span>
              </li>
              <li className="flex justify-between items-center bg-amber-100/10 px-4 py-3 rounded-lg border border-amber-400/20">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-200/20 p-1 rounded-full">🚫</span>
                  <span className="text-amber-300 font-medium">Forfeits</span>
                </div>
                <span className="text-amber-100 font-semibold">{stats.forfeits}</span>
              </li>
            </ul>
          )}
  
          <div className="mt-10 space-y-3">
            <button
              className="w-full px-6 py-2.5 text-sm font-medium text-amber-50 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all transform hover:scale-[1.02]"
              onClick={() => router.push('/leaderboards')}
            >
              View Leaderboards
            </button>
            <button
              className="w-full px-6 py-2.5 text-sm font-medium text-gray-200 bg-slate-800/50 border border-slate-600 hover:bg-slate-700 hover:text-white rounded-lg transition-all"
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