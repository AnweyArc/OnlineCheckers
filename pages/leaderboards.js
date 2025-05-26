import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import BackgroundLottie from '../components/BackgroundLottie';
import { Grid } from 'ldrs/react'
import 'ldrs/react/Grid.css'

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
        let winnerId = null;
        let loserId = null;

        if (winner === 'r') {
          winnerId = player_red;
          loserId = player_black;
        } else if (winner === 'b') {
          winnerId = player_black;
          loserId = player_red;
        }

        if (isUUID(winnerId)) {
          stats[winnerId] = stats[winnerId] || { wins: 0, losses: 0, forfeits: 0 };
          stats[winnerId].wins += 1;
        }

        if (isUUID(loserId)) {
          stats[loserId] = stats[loserId] || { wins: 0, losses: 0, forfeits: 0 };
          stats[loserId].losses += 1;
        }

        if (forfeited_by === 'r') {
          const redId = player_red;
          if (isUUID(redId)) {
            stats[redId] = stats[redId] || { wins: 0, losses: 0, forfeits: 0 };
            stats[redId].forfeits += 1;
          }
        } else if (forfeited_by === 'b') {
          const blackId = player_black;
          if (isUUID(blackId)) {
            stats[blackId] = stats[blackId] || { wins: 0, losses: 0, forfeits: 0 };
            stats[blackId].forfeits += 1;
          }
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
    <>
    {loading && (
      <div className="fixed inset-0 z-50 bg-white/70 flex items-center justify-center">
        <Grid size="60" speed="1.5" color="black" />
      </div>
    )}
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <BackgroundLottie />
      </div>

      {/* Enhanced Card Container */}
      <div className="relative z-10 rounded-xl shadow-2xl bg-gradient-to-br from-sky-400 via-purple-400 to-pink-400 p-[2px] w-full max-w-2xl animate-gradient">
        {/* Inner Content */}
        <div className="bg-white rounded-xl p-6 w-full h-full">
          <h2 className="text-3xl font-semibold text-sky-800 mb-6 text-center">
            Leaderboard
            <div className="mt-2 h-1 w-16 bg-sky-100 rounded-full mx-auto" />
          </h2>

          {loading ? (
            <p className="text-center text-sky-400 italic">Fetching rankings...</p>
          ) : (
            <ol className="space-y-3">
              {leaders.map(({ rank, name, wins, losses, forfeits }) => {
                const renderRankIcon = () => {
                  switch (rank) {
                    case 1:
                      return <span className="text-amber-500 text-lg">🥇</span>;
                    case 2:
                      return <span className="text-gray-400 text-lg">🥈</span>;
                    case 3:
                      return <span className="text-yellow-700 text-lg">🥉</span>;
                    default:
                      return <span className="text-sky-400 font-medium w-6">#{rank}</span>;
                  }
                };

                return (
                  <li
                    key={rank}
                    className="group flex justify-between items-center px-4 py-3 rounded-lg transition-all hover:bg-sky-50"
                  >
                    <div className="flex items-center space-x-4">
                      {renderRankIcon()}
                      <span className="text-sky-900 font-medium">{name}</span>
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-1 text-green-500">
                        <span className="text-sm bg-green-100 p-1 rounded-full">🏆</span>
                        <span className="text-sm text-green-700">{wins}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-rose-500">
                        <span className="text-sm bg-rose-100 p-1 rounded-full">❌</span>
                        <span className="text-sm text-rose-700">{losses}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-amber-500">
                        <span className="text-sm bg-amber-100 p-1 rounded-full">🚫</span>
                        <span className="text-sm text-amber-700">{forfeits}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-8 border-t border-sky-100 pt-6">
            <button
              className="w-full px-6 py-2.5 text-sm font-medium text-sky-700 bg-sky-100 rounded-lg transition-all hover:bg-sky-200 hover:text-sky-900"
              onClick={() => router.push('/Player_Stats')}
            >
              Return to Stats
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}