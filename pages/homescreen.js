import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import BackgroundLottie from '../components/BackgroundLottie';

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
                  <div className={`relative z-10 rounded-full shadow-lg w-[60%] h-[60%]
                    ${piece === 'r'
                      ? 'bg-gradient-to-br from-red-500 to-red-700 ring-2 ring-red-200'
                      : 'bg-gradient-to-br from-gray-800 to-black ring-2 ring-gray-300'}`}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 overflow-hidden">
      {/* Background Lottie Animation */}
      <div className="absolute inset-0 z-0">
        <BackgroundLottie />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl bg-gradient-to-br from-sky-400 via-purple-400 to-pink-400 p-[2px] animate-gradient">
      <div className="bg-white rounded-2xl px-8 py-10 w-full h-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Online Checkers</h1>
          <h4 className="text-lg text-gray-400">Made By: Anwey</h4>
          <p className="text-lg text-gray-600">
            Hello, <span className="text-blue-600 font-medium">{displayName}</span>!
          </p>
          <div className="mt-4">
            <button
              onClick={() => router.push('/Player_Stats')}
              className="text-sm text-blue-500 hover:text-blue-700 font-medium transition-all"
            >
              View Stats
            </button>
          </div>
        </div>

        <div className="mb-10 flex justify-center">
          {renderBoardPreview()}
        </div>

        <div className="space-y-8">
          {/* Create Game */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Create New Game</h3>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                type="text"
                placeholder="Enter game ID..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={createGameId}
                onChange={(e) => setCreateGameId(e.target.value)}
                disabled={loading}
              />
              <button
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 whitespace-nowrap"
                onClick={handleCreateGame}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </div>

          {/* Join Game */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Join Existing Game</h3>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                type="text"
                placeholder="Enter game ID..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                disabled={loading}
              />
              <button
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 whitespace-nowrap"
                onClick={handleJoinGame}
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </div>
        </div>

        <button
          className="mt-10 w-full sm:w-auto px-6 py-2.5 text-red-600 hover:text-red-700 font-medium rounded-lg transition-all hover:bg-red-50 flex items-center gap-2 justify-center"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
    </div>
  );
}
