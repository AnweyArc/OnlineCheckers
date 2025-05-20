import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

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
  const [loading, setLoading] = useState(false);
  const [joinGameId, setJoinGameId] = useState('');
  const [createGameId, setCreateGameId] = useState(''); // NEW: custom game id input

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
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

    // Simple validation: only letters, numbers, dashes, and underscores allowed
    if (!/^[a-zA-Z0-9-_]+$/.test(createGameId)) {
      alert('Game ID can only contain letters, numbers, dashes (-), and underscores (_).');
      return;
    }

    setLoading(true);

    // Check if the game ID already exists
    const { data: existingGame, error: existingError } = await supabase
      .from('games')
      .select('id')
      .eq('id', createGameId.trim())
      .single();

    if (existingGame) {
      alert('This Game ID is already taken. Please choose another.');
      setLoading(false);
      return;
    }

    // Insert into games table with the custom ID
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

    // Insert into active_games table
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

    // Check if game exists in active_games
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

    // Check if game in games table exists and if player_black is empty
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

    // Update the player_black slot
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
    <div className="flex flex-col border-4 border-black scale-75">
      {Array(boardSize).fill(null).map((_, row) => (
        <div key={row} className="flex">
          {Array(boardSize).fill(null).map((_, col) => {
            const isEven = (row + col) % 2 === 0;
            const squareColor = isEven ? 'bg-gray-300' : 'bg-gray-600';
            const board = createInitialBoard();
            const piece = board[row][col];

            return (
              <div key={`${row}-${col}`} className={`w-10 h-10 flex items-center justify-center ${squareColor}`}>
                {piece && (
                  <div className={`w-6 h-6 rounded-full ${piece === 'r' ? 'bg-red-500' : 'bg-black'}`} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Online Checkers</h1>

      {renderBoardPreview()}

      <div className="flex gap-4 mt-6 items-center">
        <input
          type="text"
          placeholder="Create Game ID"
          className="px-3 py-2 rounded border border-gray-400"
          value={createGameId}
          onChange={(e) => setCreateGameId(e.target.value)}
          disabled={loading}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleCreateGame}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Game'}
        </button>
      </div>

      <div className="flex gap-4 mt-6 items-center">
        <input
          type="text"
          placeholder="Enter Game ID"
          className="px-3 py-2 rounded border border-gray-400"
          value={joinGameId}
          onChange={(e) => setJoinGameId(e.target.value)}
          disabled={loading}
        />
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={handleJoinGame}
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join Game'}
        </button>
      </div>

      <button
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}
