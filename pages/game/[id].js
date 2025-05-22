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
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds timer
  const [opponentTimeLeft, setOpponentTimeLeft] = useState(60);

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
            .update({ player_red: currentUserId,  })
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

  useEffect(() => {
    if (!game || !playerRole) return;
  
    // Only start the timer if it's *this player's* turn and game is active
    if (game.turn !== playerRole || game.status !== 'active') return;
  
    setTimeLeft(60);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          skipTurn(); // Automatically skip turn when timer runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    return () => clearInterval(interval);
  }, [game?.turn, playerRole, game?.status]);
  
  
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
    turn_started_at: winner ? null : new Date().toISOString(), // 👈 Add this line
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

  const skipTurn = async () => {
    const nextTurn = game.turn === 'r' ? 'b' : 'r';
    const { error } = await supabase
  .from('games')
  .update({
    turn: nextTurn,
    turn_started_at: new Date().toISOString(), // 👈 Add this line
  })
  .eq('id', gameId);

  
    if (error) {
      console.error('Failed to skip turn:', error);
    } else {
      setGame((prev) => ({
        ...prev,
        turn: nextTurn,
      }));
    }
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
    if (!playerRole) return;
    setLoading(true);
  
    await deleteActiveGame();
  
    const { error } = await supabase
      .from('games')
      .update({
        status: 'forfeited',
        forfeited_by: playerRole,
      })
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
        className={`
          aspect-square w-full h-full flex items-center justify-center 
          ${squareColor} 
          ${isSelected ? 'border-4 border-yellow-400' : ''}
          transition-all duration-200
        `}
        onClick={() => handleSquareClick(row, col)}
      >
        {piece && (
          <div
            className={`
              rounded-full shadow-md
              ${piece.toLowerCase() === 'r'
                ? 'bg-gradient-to-br from-red-400 to-red-700'
                : 'bg-gradient-to-br from-gray-700 to-black'}
              ${piece === piece.toUpperCase() ? 'ring-4 ring-yellow-300' : ''}
              w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-10 lg:h-10
              transition-transform duration-300 transform hover:scale-105
            `}
          />
        )}
      </div>
    );
  };
  

  const renderBoard = () => {
    const rows = Array.from({ length: boardSize }, (_, i) => i);
    const cols = Array.from({ length: boardSize }, (_, i) => i);
  
    // Reverse rows and columns if the player is black
    const displayRows = playerRole === 'b' ? [...rows].reverse() : rows;
    const displayCols = playerRole === 'b' ? [...cols].reverse() : cols;
  
    return (
      <div className="relative p-2 sm:p-4 bg-amber-800 rounded-xl shadow-2xl w-full max-w-full overflow-hidden">
        <div className="absolute inset-0 rounded-xl shadow-inner" />
        
        <div
          className="relative border-4 border-amber-900 rounded-lg overflow-hidden mx-auto grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
            width: '100%',
            maxWidth: 'min(90vw, 90vh)',
            aspectRatio: '1 / 1',
          }}
        >
          {displayRows.flatMap((row) =>
            displayCols.map((col) => renderSquare(row, col))
          )}
        </div>
  
        {/* Optional board frame decorations */}
        <div className="absolute top-0 left-0 right-0 h-2 sm:h-4 bg-amber-900 rounded-t-xl" />
        <div className="absolute bottom-0 left-0 right-0 h-2 sm:h-4 bg-amber-900 rounded-b-xl" />
        <div className="absolute left-0 top-0 bottom-0 w-2 sm:w-4 bg-amber-900 rounded-l-xl" />
        <div className="absolute right-0 top-0 bottom-0 w-2 sm:w-4 bg-amber-900 rounded-r-xl" />
      </div>
    );
  };
  
  

  const renderStatus = () => {
    if (!game) return null;
  
    const calculateOpponentTimeLeft = () => {
      if (!game.turn_started_at) return null;
      const elapsed = Math.floor((Date.now() - new Date(game.turn_started_at).getTime()) / 1000);
      return Math.max(0, 30 - elapsed); // assuming 30s turn limit
    };
  
    if (game.status === 'won') {
      const isWinner = game.winner === playerRole;
      return (
        <div className={`text-xl font-bold ${isWinner ? 'text-green-600' : 'text-red-600'}`}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{isWinner ? '✓' : '✗'}</span>
            {isWinner ? 'Victory!' : 'Defeat!'}
          </div>
        </div>
      );
    }
  
    if (game.status === 'forfeited') {
      const didOpponentForfeit = game.forfeited_by && game.forfeited_by !== playerRole;
  
      return (
        <div className={`text-xl font-bold ${didOpponentForfeit ? 'text-green-600' : 'text-red-600'}`}>
          {didOpponentForfeit ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🏳️</span>
              Opponent forfeited. You win!
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🏳️</span>
              You forfeited the game.
            </div>
          )}
        </div>
      );
    }
  
    if (isMyTurn()) {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xl font-bold text-amber-700 animate-pulse flex items-center gap-2 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8" />
            </svg>
            Your Move!
          </div>
          <p className="text-sm text-gray-700">Time left: {timeLeft}s</p>
        </div>
      );
    } else {
      const opponentTimeLeft = calculateOpponentTimeLeft();
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xl font-bold text-gray-600">Opponent's Turn</div>
          <p className="text-sm text-gray-700">Opponent's Remaining Time: {opponentTimeLeft}s</p>
        </div>
      );
    }
  };
  
  
  

  return (
    <div className="min-h-screen bg-gradient-to-r from-amber-50 to-amber-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-amber-800 rounded-xl shadow-2xl px-4 md:px-6 py-3 md:py-4 mb-4 md:mb-6 relative">
        <div className="absolute inset-0 rounded-xl shadow-inner" />
        <div className="flex flex-col sm:flex-row justify-between items-center relative z-10">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-amber-100 mb-2 sm:mb-0 text-center">
            Game ID: <span className="text-amber-300">{gameId?.slice(0, 6)}...</span>
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm md:text-base bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 md:px-4 py-1 md:py-2 rounded-lg flex items-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4 mb-4 md:mb-8 text-center">
        <div className="inline-block bg-amber-100 px-4 py-1 md:px-6 md:py-2 rounded-full shadow-md">
          <p className="text-base md:text-lg font-semibold text-amber-800">
            Playing as:{' '}
            <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full ${
              playerRole === 'r' ? 'bg-red-500' : 'bg-gray-800'
            } text-white text-sm md:text-base`}>
              {playerRole === 'r' ? 'Red' : playerRole === 'b' ? 'Black' : 'Spectator'}
            </span>
          </p>
        </div>
        {renderStatus()}
      </div>

      {renderBoard()}

      {(playerRole === 'r' || playerRole === 'b') && (
  <>
    {game?.status === 'won' || game?.status === 'forfeited' ? (
      <button
        onClick={() => router.push('/')}
        className="mt-4 md:mt-6 px-4 py-1.5 md:px-6 md:py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all transform hover:scale-[1.02] flex items-center gap-2 text-sm md:text-base"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Go back to Lobby
      </button>
    ) : (
      <button
        onClick={handleForfeit}
        disabled={loading}
        className="mt-4 md:mt-6 px-4 py-1.5 md:px-6 md:py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-medium transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 text-sm md:text-base"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Forfeit
      </button>
    )}
  </>
)}
    </div>
  );
};

export default GamePage;
