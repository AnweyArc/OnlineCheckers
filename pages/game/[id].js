// pages/game/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const boardSize = 8;

const GamePage = () => {
  const router = useRouter();
  const { id: gameId } = router.query;
  const [game, setGame] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [playerRole, setPlayerRole] = useState(null); // 'r' or 'b' or null
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;

      const { data: user } = await supabase.auth.getUser();
      const currentUserId = user?.user?.id;
      setUserId(currentUserId);

      // Fetch game data
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
        // Auto assign player_red or player_black if empty
        if (!gameData.player_red) {
          const { error: updateError } = await supabase
            .from('games')
            .update({ player_red: currentUserId })
            .eq('id', gameId);
          if (!updateError) gameData.player_red = currentUserId;
        } else if (
          !gameData.player_black &&
          gameData.player_red !== currentUserId
        ) {
          const { error: updateError } = await supabase
            .from('games')
            .update({ player_black: currentUserId })
            .eq('id', gameId);
          if (!updateError) gameData.player_black = currentUserId;
        }

        setGame(gameData);

        // Determine playerRole based on logged-in user
        if (currentUserId === gameData.player_red) setPlayerRole('r');
        else if (currentUserId === gameData.player_black) setPlayerRole('b');
        else setPlayerRole(null); // spectator
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

  const isValidMove = (srcRow, srcCol, destRow, destCol) => {
    const piece = game.board_state[srcRow][srcCol];
    if (!piece || game.board_state[destRow][destCol]) return false;

    // Only allow moving your own pieces
    if (piece.toLowerCase() !== playerRole) return false;

    const dir = piece.toLowerCase() === 'r' ? -1 : 1;
    const diffRow = destRow - srcRow;
    const diffCol = destCol - srcCol;

    // Basic move: diagonal by 1 step forward only
    return Math.abs(diffCol) === 1 && diffRow === dir;
  };

  const movePiece = async (srcRow, srcCol, destRow, destCol) => {
    setLoading(true);

    console.log(`Moving piece from (${srcRow},${srcCol}) to (${destRow},${destCol})`);
    console.log('Current turn:', game.turn, 'Player role:', playerRole);

    const newBoard = game.board_state.map((row) => [...row]);
    const piece = newBoard[srcRow][srcCol];
    newBoard[srcRow][srcCol] = null;
    newBoard[destRow][destCol] = piece;

    const nextTurn = game.turn === 'r' ? 'b' : 'r';

    const { error } = await supabase
      .from('games')
      .update({
        board_state: newBoard,
        turn: nextTurn,
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error updating move:', error);
      alert('Failed to move piece. Please try again.');
    } else {
      // Update local state immediately to reflect move
      setGame((prev) => ({
        ...prev,
        board_state: newBoard,
        turn: nextTurn,
      }));
    }

    setLoading(false);
  };

  const handleSquareClick = (row, col) => {
    if (!game || !isMyTurn() || loading) return;
    const piece = game.board_state[row][col];

    if (selected) {
      const [srcRow, srcCol] = selected;
      if (isValidMove(srcRow, srcCol, row, col)) {
        movePiece(srcRow, srcCol, row, col);
      }
      setSelected(null);
    } else if (piece?.toLowerCase() === playerRole) {
      setSelected([row, col]);
    }
  };

  // Delete active game from active_games table
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

  // Forfeit handler: delete active game, update status, redirect home
  const handleForfeit = async () => {
    setLoading(true);
    await deleteActiveGame();

    await supabase
      .from('games')
      .update({ status: 'forfeited' }) // Optional: track game status
      .eq('id', gameId);

    setLoading(false);
    router.push('/');
  };

  // Logout function
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
            }`}
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
          {playerRole === 'r'
            ? 'Red'
            : playerRole === 'b'
            ? 'Black'
            : 'Spectator'}
        </span>
      </p>
      <p className="mb-4">{isMyTurn() ? "Your turn" : "Opponent's turn"}</p>
      {renderBoard()}

      {/* Forfeit Button */}
      {(playerRole === 'r' || playerRole === 'b') && (
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
