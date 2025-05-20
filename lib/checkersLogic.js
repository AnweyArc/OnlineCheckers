export const cloneBoard = (board) => board.map(row => [...row]);

export const isOpponent = (piece, player) => {
  if (!piece) return false;
  return piece.toLowerCase() !== player;
};

export const isKing = (piece) => piece === piece.toUpperCase();

export const shouldPromote = (piece, row, boardSize = 8) => {
  if (!piece) return false;
  const player = piece.toLowerCase();
  return (player === 'r' && row === 0) || (player === 'b' && row === boardSize - 1);
};

export const getValidMoves = (board, player) => {
  const moves = [];
  const jumps = [];

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const piece = board[row][col];
      if (!piece || piece.toLowerCase() !== player) continue;

      const dirs = getDirections(piece);
      for (let [dRow, dCol] of dirs) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (isInsideBoard(newRow, newCol) && !board[newRow][newCol]) {
          moves.push({ from: [row, col], to: [newRow, newCol] });
        } else {
          // Check for jump
          const jumpRow = row + dRow * 2;
          const jumpCol = col + dCol * 2;
          if (
            isInsideBoard(jumpRow, jumpCol) &&
            !board[jumpRow][jumpCol] &&
            isOpponent(board[newRow][newCol], player)
          ) {
            jumps.push({ from: [row, col], to: [jumpRow, jumpCol], capture: [newRow, newCol] });
          }
        }
      }
    }
  }

  return jumps.length > 0 ? jumps : moves;
};

export const isValidMove = (board, player, srcRow, srcCol, destRow, destCol) => {
  const possibleMoves = getValidMoves(board, player);
  return possibleMoves.some(
    (m) =>
      m.from[0] === srcRow &&
      m.from[1] === srcCol &&
      m.to[0] === destRow &&
      m.to[1] === destCol
  );
};

export const applyMove = (board, srcRow, srcCol, destRow, destCol) => {
  const newBoard = cloneBoard(board);
  const piece = newBoard[srcRow][srcCol];

  // Ensure piece exists and belongs to current player (safety check)
  if (!piece) return board;

  newBoard[srcRow][srcCol] = null;
  newBoard[destRow][destCol] = piece;

  // Check for capture
  if (Math.abs(destRow - srcRow) === 2) {
    const capRow = (srcRow + destRow) / 2;
    const capCol = (srcCol + destCol) / 2;
    newBoard[capRow][capCol] = null;
  }

  // Check for promotion
  if (shouldPromote(piece, destRow)) {
    newBoard[destRow][destCol] = piece.toUpperCase();
  }

  return newBoard;
};

export const getDirections = (piece) => {
  const isK = isKing(piece);
  const dir = piece.toLowerCase() === 'r' ? -1 : 1;
  return isK
    ? [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]
    : [
        [dir, -1],
        [dir, 1],
      ];
};

export const isInsideBoard = (row, col, size = 8) => {
  return row >= 0 && row < size && col >= 0 && col < size;
};

// ✅ Updated to match import in [id].js
export const checkWinCondition = (board) => {
  const redPieces = [];
  const blackPieces = [];

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const piece = board[row][col];
      if (piece?.toLowerCase() === 'r') redPieces.push([row, col]);
      else if (piece?.toLowerCase() === 'b') blackPieces.push([row, col]);
    }
  }

  const redHasMoves = redPieces.some(([r, c]) =>
    getValidMoves(board, 'r').some((m) => m.from[0] === r && m.from[1] === c)
  );
  const blackHasMoves = blackPieces.some(([r, c]) =>
    getValidMoves(board, 'b').some((m) => m.from[0] === r && m.from[1] === c)
  );

  if (redPieces.length === 0 || !redHasMoves) return 'b';
  if (blackPieces.length === 0 || !blackHasMoves) return 'r';

  return null; // No winner yet
};
