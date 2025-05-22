import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

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

      // Get games where user is red or black
      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .or(`player_red.eq.${user.id},player_black.eq.${user.id}`);

      if (error) {
        console.error('Failed to fetch games:', error);
        setLoading(false);
        return;
      }

      // Count wins, losses, forfeits
      let wins = 0, losses = 0, forfeits = 0;
      games.forEach(game => {
        if (game.winner === user.id) wins++;
        else if (game.winner && game.winner !== user.id) losses++;
        if (game.forfeited_by === user.id) forfeits++;
      });

      setStats({ total: games.length, wins, losses, forfeits });
      setLoading(false);
    };

    fetchStats();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Player Stats</h2>
        <p className="mb-6 text-gray-600">Hello, <span className="font-medium text-blue-600">{displayName}</span>!</p>

        {loading ? (
          <p className="text-gray-500">Loading stats...</p>
        ) : (
          <ul className="space-y-2 text-gray-700">
            <li><strong>Total Games:</strong> {stats.total}</li>
            <li><strong>Wins:</strong> {stats.wins}</li>
            <li><strong>Losses:</strong> {stats.losses}</li>
            <li><strong>Games Forfeited:</strong> {stats.forfeits}</li>
          </ul>
        )}

        <button
        className="mb-4 px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => router.push('/leaderboards')}
        >
        View Leaderboards
        </button>

        <button
        className="mt-0 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => router.push('/homescreen')}
        >
        Back to Home
        </button>
      </div>
    </div>
  );
}
