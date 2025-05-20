// pages/game/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { applyMove, isValidMove, checkWinCondition } from '../../lib/checkersLogic';

const boardSize = 8;

const GamePage = () => {
  const router = useRouter();
  const { id: gameId } = router.query;
  const [game, setGame] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [playerRole, setPlayerRole] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;

      const { data: user } = await supabase.auth.getUser();
      const currentUserId = user?.user?.id;
      setUserId(currentUserId);

      let { data: gameData, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) {
        console.error('Error fetching game:', error);
        return;
      }

      if (gameData) {
        if (!gameData.player_red) {
          const { error: updateError } = await supabase
            .from('games')
            .update({ player_red: currentUserId })
            .eq('id', gameId);
          if (!updateError) gameData.player_red = currentUserId;
        } else if (!gameData.player_black && gameData.player_red !== currentUserId) {
          const { error: updateError } = await supabase
            .from('games')
            .update({ player_black: currentUserId })
            .eq('id', gameId);
          if (!updateError) gameData.player_black = currentUserId;
        }

        setGame(gameData);
        if (currentUserId === gameData.player_red) setPlayerRole('r');
        else if (currentUserId === gameData.player_black) setPlayerRole('b');
        else setPlayerRole(null);
      }
    };

    fetchGame();
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel('game-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const updatedGame = payload.new;
          setGame(updatedGame);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const isMyTurn = () => {
    if (!game || !userId || !playerRole) return false;
    return game.turn === playerRole;
  };

  const movePiece = async (srcRow, srcCol, destRow, destCol) => {
    setLoading(true);

    const newBoard = applyMove(game.board_state, srcRow, srcCol, destRow, destCol);

    if (!newBoard) {
      alert('Invalid move!');
      setLoading(false);
      return;
    }

    const winner = checkWinCondition(newBoard);
    const nextTurn = winner ? null : game.turn === 'r' ? 'b' : 'r';

    const { error } = await supabase
      .from('games')
      .update({
        board_state: newBoard,
        turn: nextTurn,
        status: winner ? 'won' : game.status,
        winner: winner || null,
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error updating move:', error);
      alert('Failed to update move on server.');
    } else {
      setGame((prev) => ({
        ...prev,
        board_state: newBoard,
        turn: nextTurn,
        status: winner ? 'won' : prev.status,
        winner: winner || null,
      }));
    }

    setSelected(null);
    setLoading(false);
  };

  const handleSquareClick = (row, col) => {
    if (!game || !isMyTurn() || loading || game.status === 'won') return;
    const piece = game.board_state[row][col];

    if (selected) {
      const [srcRow, srcCol] = selected;
      if (isValidMove(game.board_state, playerRole, srcRow, srcCol, row, col)) {
        movePiece(srcRow, srcCol, row, col);
      } else {
        alert('Invalid move!');
      }
      setSelected(null);
    } else if (piece?.toLowerCase() === playerRole) {
      setSelected([row, col]);
    }
  };

  const deleteActiveGame = async () => {
    if (!gameId) return;
    const { error } = await supabase
      .from('active_games')
      .delete()
      .eq('game_id', gameId);

    if (error) {
      console.error('Error deleting active game:', error);
    }
  };

  const handleForfeit = async () => {
    setLoading(true);
    await deleteActiveGame();
    await supabase
      .from('games')
      .update({ status: 'forfeited' })
      .eq('id', gameId);
    setLoading(false);
    router.push('/');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const renderSquare = (row, col) => {
    const isEven = (row + col) % 2 === 0;
    const squareColor = isEven ? 'bg-gray-300' : 'bg-gray-600';
    const piece = game?.board_state?.[row]?.[col];
    const isSelected = selected && selected[0] === row && selected[1] === col;

    return (
      <div
        key={`${row}-${col}`}
        className={`w-12 h-12 flex items-center justify-center ${squareColor} ${
          isSelected ? 'border-4 border-yellow-400' : ''
        }`}
        onClick={() => handleSquareClick(row, col)}
      >
        {piece && (
          <div
            className={`w-8 h-8 rounded-full ${
              piece.toLowerCase() === 'r' ? 'bg-red-500' : 'bg-black'
            } ${piece === piece.toUpperCase() ? 'ring-4 ring-white' : ''}`}
          />
        )}
      </div>
    );
  };

  const renderBoard = () => (
    <div className="flex flex-col border-4 border-black">
      {Array.from({ length: boardSize }).map((_, row) => (
        <div key={row} className="flex">
          {Array.from({ length: boardSize }).map((_, col) => renderSquare(row, col))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md flex justify-between items-center px-4 py-3 bg-white shadow-md mb-4 rounded">
        <h1 className="text-2xl font-bold">Game ID: {gameId?.slice(0, 6)}...</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <p className="mb-2">
        You are playing as:{' '}
        <span className={playerRole === 'r' ? 'text-red-600' : 'text-black'}>
          {playerRole === 'r' ? 'Red' : playerRole === 'b' ? 'Black' : 'Spectator'}
        </span>
      </p>
      <p className="mb-4">
        {game?.status === 'won'
          ? game?.winner === playerRole
            ? 'You won!'
            : 'You lost!'
          : isMyTurn()
          ? "Your turn"
          : "Opponent's turn"}
      </p>

      {renderBoard()}

      {(playerRole === 'r' || playerRole === 'b') && game?.status !== 'won' && (
        <button
          onClick={handleForfeit}
          disabled={loading}
          className="mt-6 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          {loading ? 'Processing...' : 'Forfeit Game'}
        </button>
      )}
    </div>
  );
};

export default GamePage;
