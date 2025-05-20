// pages/lobby.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const Lobby = () => {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [userId, setUserId] = useState(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Fetch available games
  useEffect(() => {
    const fetchGames = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'waiting');

      if (data) setGames(data);
    };

    fetchGames();
  }, []);

  const createGame = async () => {
    const { data, error } = await supabase
      .from('games')
      .insert([
        {
          player_red: userId,
          board_state: createInitialBoard(),
          status: 'waiting',
        },
      ])
      .select()
      .single();

    if (data) router.push(`/game/${data.id}`);
  };

  const joinGame = async (gameId) => {
    const { data, error } = await supabase
      .from('games')
      .update({
        player_black: userId,
        status: 'active',
      })
      .eq('id', gameId)
      .select()
      .single();

    if (data) router.push(`/game/${gameId}`);
  };

  const createInitialBoard = () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 8; col++)
        if ((row + col) % 2 !== 0) board[row][col] = 'b';

    for (let row = 5; row < 8; row++)
      for (let col = 0; col < 8; col++)
        if ((row + col) % 2 !== 0) board[row][col] = 'r';

    return board;
  };

  return (
    <div className="p-6 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Game Lobby</h1>
      <button
        className="mb-6 px-4 py-2 bg-[var(--accent)] text-white rounded"
        onClick={createGame}
      >
        Create Game
      </button>
      <h2 className="text-lg font-semibold mb-2 text-[var(--foreground)]">Joinable Games:</h2>
      <ul className="space-y-2">
        {games.map((game) => (
          <li key={game.id} className="flex justify-between items-center border p-3 rounded">
            <span className="text-[var(--foreground)]">Game ID: {game.id.slice(0, 6)}...</span>
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded"
              onClick={() => joinGame(game.id)}
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
