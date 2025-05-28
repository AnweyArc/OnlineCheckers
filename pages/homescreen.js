import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import BackgroundLottie from '../components/BackgroundLottie';

import { Grid } from 'ldrs/react'
import 'ldrs/react/Grid.css'


const boardSize = 8;

const createInitialBoard = () => {
  const board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < boardSize; col++) {
      if ((row + col) % 2 !== 0) board[row][col] = 'b';
    }
  }
  for (let row = 5; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if ((row + col) % 2 !== 0) board[row][col] = 'r';
    }
  }
  return board;
};

export default function Homescreen() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinGameId, setJoinGameId] = useState('');
  const [createGameId, setCreateGameId] = useState('');

  const upsertProfile = async (user) => {
    const { id, user_metadata } = user;
    const displayName = user_metadata?.display_name || 'Player';

    const { error } = await supabase
      .from('profiles')
      .upsert({ id, display_name: displayName }, { onConflict: 'id' });

    if (error) {
      console.error('Failed to upsert profile:', error.message);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        setDisplayName(data.user.user_metadata?.display_name || 'Player');
        await upsertProfile(data.user);
      } else {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCreateGame = async () => {
    if (!createGameId.trim()) {
      alert('Please enter a game ID to create.');
      return;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(createGameId)) {
      alert('Game ID can only contain letters, numbers, dashes (-), and underscores (_).');
      return;
    }

    setLoading(true);

    const { data: existingGame } = await supabase
      .from('games')
      .select('id')
      .eq('id', createGameId.trim())
      .single();

    if (existingGame) {
      alert('This Game ID is already taken. Please choose another.');
      setLoading(false);
      return;
    }

    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        id: createGameId.trim(),
        player_red: userId,
        board_state: createInitialBoard(),
        turn: 'r',
      })
      .select()
      .single();

    if (gameError || !gameData) {
      alert('Error creating game');
      setLoading(false);
      return;
    }

    const { error: activeGameError } = await supabase
      .from('active_games')
      .insert({ game_id: createGameId.trim() });

    if (activeGameError) {
      alert('Error activating game');
      setLoading(false);
      return;
    }

    router.push(`/game/${createGameId.trim()}`);
    setLoading(false);
  };

  const handleJoinGame = async () => {
    if (!joinGameId.trim()) {
      alert('Please enter a game ID to join.');
      return;
    }
    setLoading(true);

    const { data: activeGameData, error: activeGameError } = await supabase
      .from('active_games')
      .select('*')
      .eq('game_id', joinGameId.trim())
      .single();

    if (activeGameError || !activeGameData) {
      alert('Game ID does not exist or has ended.');
      setLoading(false);
      return;
    }

    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', joinGameId.trim())
      .single();

    if (gameError || !gameData) {
      alert('Game not found.');
      setLoading(false);
      return;
    }

    if (gameData.player_black && gameData.player_black !== userId) {
      alert('This game already has two players.');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('games')
      .update({ player_black: userId })
      .eq('id', joinGameId.trim());

    if (updateError) {
      alert('Failed to join the game.');
      setLoading(false);
      return;
    }

    router.push(`/game/${joinGameId.trim()}`);
    setLoading(false);
  };

  const renderBoardPreview = () => (
    <div className="relative p-2 sm:p-4 bg-amber-800 rounded-xl shadow-2xl w-full max-w-full overflow-hidden">
      <div className="absolute inset-0 rounded-xl shadow-inner" />
      <div
        className="relative border-4 border-amber-900 rounded-lg overflow-hidden mx-auto grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          width: "100%",
          maxWidth: "min(90vw, 90vh)",
          aspectRatio: "1 / 1"
        }}
      >
        {Array(boardSize).fill(null).flatMap((_, row) =>
          Array(boardSize).fill(null).map((_, col) => {
            const isEven = (row + col) % 2 === 0;
            const board = createInitialBoard();
            const piece = board[row][col];
  
            return (
              <div
                key={`${row}-${col}`}
                className={`relative w-full h-full flex items-center justify-center 
                  ${isEven
                    ? 'bg-gradient-to-br from-amber-100 to-amber-300'
                    : 'bg-gradient-to-br from-amber-800 to-amber-900'}
                  transition-all duration-200 hover:brightness-110`}
              >
                <div className={`absolute inset-0 opacity-20 ${isEven ? 'bg-white' : 'bg-black'}`} />
                {piece && (
                  <div className={`relative z-10 rounded-full shadow-xl w-[70%] h-[70%]
                    ${piece === 'r'
                      ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 ring-3 ring-red-100/50 shadow-inner'
                      : 'bg-gradient-to-br from-gray-900 via-gray-800 to-black ring-3 ring-gray-400/30 shadow-inner'}`}
                  >
                    {/* Add subtle inner highlight */}
                    <div className={`absolute inset-0 rounded-full mix-blend-screen 
                      ${piece === 'r' 
                        ? 'bg-gradient-to-tr from-red-200/30 to-transparent' 
                        : 'bg-gradient-to-tr from-gray-400/20 to-transparent'}`} 
                    />
                    {/* Add center reflection */}
                    <div className="absolute inset-0 rounded-full mix-blend-overlay bg-gradient-to-br from-white/10 to-transparent" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 bg-white/70 flex items-center justify-center">
          <Grid size="60" speed="1.5" color="black" />
        </div>
      )}
      <div className="relative w-full min-h-screen flex items-center justify-center bg-slate-900 p-4 overflow-hidden">
        {/* Background Lottie Animation */}
        <div className="absolute inset-0 z-0">
          <BackgroundLottie />
        </div>
  
        {/* Glowing Border Effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur-xl opacity-40 animate-pulse z-10 pointer-events-none" />
  
        {/* Foreground Content */}
        <div className="relative z-20 w-full max-w-2xl rounded-2xl shadow-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 p-[2px] overflow-hidden">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl px-8 py-10 w-full h-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-amber-100 mb-2 animate-gradient bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500 bg-clip-text text-transparent">
                Welcome to Online Checkers
              </h1>
              <h4 className="text-lg text-amber-100/60">Made By: Anwey</h4>
              <p className="text-lg text-amber-100/80 mt-2">
                Hello, <span className="text-amber-400 font-medium">{displayName}</span>!
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/Player_Stats')}
                  className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-all"
                >
                  View Stats
                </button>
              </div>
            </div>
  
            <div className="mb-10 flex justify-center">
              {renderBoardPreview()}
            </div>
  
            <div className="space-y-10">
              {/* Create Game */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-100/90">Create New Game</h3>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    placeholder="Enter game ID..."
                    className="w-full px-4 py-3 bg-slate-800/50 border border-amber-900/30 rounded-lg text-amber-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition placeholder:text-amber-100/40"
                    value={createGameId}
                    onChange={(e) => setCreateGameId(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-amber-50 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    onClick={handleCreateGame}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Game'}
                  </button>
                </div>
              </div>
  
              {/* Join Game */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-100/90">Join Existing Game</h3>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    placeholder="Enter game ID..."
                    className="w-full px-4 py-3 bg-slate-800/50 border border-green-900/30 rounded-lg text-green-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition placeholder:text-green-100/40"
                    value={joinGameId}
                    onChange={(e) => setJoinGameId(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    onClick={handleJoinGame}
                    disabled={loading}
                  >
                    {loading ? 'Joining...' : 'Join Game'}
                  </button>
                </div>
              </div>
            </div>
  
            <button
              className="mt-10 w-full sm:w-auto px-6 py-2.5 text-red-500 hover:text-red-600 font-medium rounded-lg transition-all hover:bg-red-100/10 flex items-center gap-2 justify-center"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );  
}
