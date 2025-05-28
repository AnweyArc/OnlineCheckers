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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm">
          <Grid size="60" speed="1.5" color="white" />
        </div>
      )}
      <div className="relative min-h-screen flex items-center justify-center bg-slate-900 p-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <BackgroundLottie />
        </div>
  
        {/* Glowing Border Aura */}
        <div className="absolute -inset-2 bg-gradient-to-tr from-purple-500 via-pink-400 to-sky-400 rounded-3xl blur-2xl opacity-40 animate-pulse z-10 pointer-events-none" />
  
        {/* Foreground Gradient Card */}
        <div className="relative z-20 rounded-2xl shadow-2xl bg-gradient-to-br from-purple-100 via-sky-100 to-pink-50 p-[2px] w-full max-w-2xl">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl px-8 py-10 w-full h-full">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Leaderboard
              <div className="mt-2 h-1 w-16 bg-white/20 rounded-full mx-auto" />
            </h2>
  
            {loading ? (
              <p className="text-center text-sky-300 italic">Fetching rankings...</p>
            ) : (
              <ol className="space-y-3">
                {leaders.map(({ rank, name, wins, losses, forfeits }) => {
                  const renderRankIcon = () => {
                    switch (rank) {
                      case 1:
                        return <span className="text-amber-400 text-lg">🥇</span>;
                      case 2:
                        return <span className="text-gray-300 text-lg">🥈</span>;
                      case 3:
                        return <span className="text-yellow-600 text-lg">🥉</span>;
                      default:
                        return <span className="text-pink-300 font-medium w-6">#{rank}</span>;
                    }
                  };
  
                  return (
                    <li
                      key={rank}
                      className="group flex justify-between items-center px-4 py-3 rounded-lg transition-all hover:bg-white/5"
                    >
                      <div className="flex items-center space-x-4">
                        {renderRankIcon()}
                        <span className="text-white font-medium">{name}</span>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <div className="flex items-center space-x-1 text-green-300">
                          <span className="bg-green-200/20 p-1 rounded-full">🏆</span>
                          <span>{wins}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-rose-300">
                          <span className="bg-rose-200/20 p-1 rounded-full">❌</span>
                          <span>{losses}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-amber-300">
                          <span className="bg-amber-200/20 p-1 rounded-full">🚫</span>
                          <span>{forfeits}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
  
            <div className="mt-10 border-t border-white/10 pt-6">
              <button
                className="w-full px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-purple-600 rounded-lg hover:from-sky-600 hover:to-purple-700 transition-all transform hover:scale-[1.02]"
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