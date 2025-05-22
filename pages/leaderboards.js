import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Leaderboards() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const isUUID = (str) =>
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('winner, player_red, player_black, forfeited_by')
        .not('winner', 'is', null);

      if (gamesError) {
        console.error('Error fetching games:', gamesError);
        return;
      }

      const stats = {};

      games.forEach(({ winner, player_red, player_black, forfeited_by }) => {
        const loser = winner === player_red ? player_black : player_red;

        // Wins
        if (isUUID(winner)) {
          stats[winner] = stats[winner] || { wins: 0, losses: 0, forfeits: 0 };
          stats[winner].wins += 1;
        }

        // Losses
        if (isUUID(loser)) {
          stats[loser] = stats[loser] || { wins: 0, losses: 0, forfeits: 0 };
          stats[loser].losses += 1;
        }

        // Forfeits
        if (isUUID(forfeited_by)) {
          stats[forfeited_by] = stats[forfeited_by] || { wins: 0, losses: 0, forfeits: 0 };
          stats[forfeited_by].forfeits += 1;
        }
      });

      const sortedPlayers = Object.entries(stats)
        .sort(([, a], [, b]) => b.wins - a.wins)
        .slice(0, 10);

      const playerIds = sortedPlayers.map(([id]) => id);

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', playerIds);

      if (profileError) {
        console.error('Error fetching display names:', profileError);
        return;
      }

      const idToName = {};
      profiles.forEach(({ id, display_name }) => {
        idToName[id] = display_name || 'Unknown';
      });

      const leaderboard = sortedPlayers.map(([id, stat], i) => ({
        rank: i + 1,
        name: idToName[id] || id.slice(0, 8),
        wins: stat.wins,
        losses: stat.losses,
        forfeits: stat.forfeits,
      }));

      setLeaders(leaderboard);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">🏆 Leaderboards</h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading leaderboards...</p>
        ) : (
          <ol className="space-y-2">
            {leaders.map(({ rank, name, wins, losses, forfeits }) => (
              <li
                key={rank}
                className="flex justify-between items-center border-b pb-2 last:border-none"
              >
                <span className="font-semibold text-lg">
                  #{rank}. {name}
                </span>
                <span className="text-gray-600 text-sm">
                  🏆 {wins} | ❌ {losses} | 🚫 {forfeits}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-6">
          <button
            className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => router.push('/Player_Stats')}
          >
            Back to Stats
          </button>
        </div>
      </div>
    </div>
  );
}
