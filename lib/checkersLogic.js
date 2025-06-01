// checkersLogic.js

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

export const getCapturedPosition = (srcRow, srcCol, destRow, destCol) => [
  (srcRow + destRow) / 2,
  (srcCol + destCol) / 2,
];

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
  return [...moves, ...jumps];
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

export const applyMove = (board, srcRow, srcCol, destRow, destCol, boardSize = 8) => {
  let newBoard = cloneBoard(board);
  let piece = newBoard[srcRow][srcCol];

  if (!piece) return null;

  newBoard[srcRow][srcCol] = null;
  newBoard[destRow][destCol] = piece;

  // Check for capture
  if (Math.abs(destRow - srcRow) === 2) {
    const [capRow, capCol] = getCapturedPosition(srcRow, srcCol, destRow, destCol);
    newBoard[capRow][capCol] = null;

    // Promote before checking additional jumps
    if (shouldPromote(piece, destRow, boardSize)) {
      piece = piece.toUpperCase();
      newBoard[destRow][destCol] = piece;
    }

    // Chain jumps if it's a king
    if (isKing(piece)) {
      let continueJumping = true;
      let currentRow = destRow;
      let currentCol = destCol;

      while (continueJumping) {
        const jumps = getAdditionalJumps(newBoard, currentRow, currentCol, piece);
        if (jumps.length === 0) {
          continueJumping = false;
        } else {
          const next = jumps[0];
          const [nextDestRow, nextDestCol] = next.to;
          const [nextCapRow, nextCapCol] = next.capture;

          newBoard[currentRow][currentCol] = null;
          newBoard[nextCapRow][nextCapCol] = null;
          newBoard[nextDestRow][nextDestCol] = piece;

          currentRow = nextDestRow;
          currentCol = nextDestCol;
        }
      }
    }
  } else {
    if (shouldPromote(piece, destRow, boardSize)) {
      newBoard[destRow][destCol] = piece.toUpperCase();
    }
  }

  return newBoard;
};

export const getAdditionalJumps = (board, row, col, piece) => {
  const jumps = [];
  const dirs = getDirections(piece);
  const player = piece.toLowerCase();

  for (let [dRow, dCol] of dirs) {
    const midRow = row + dRow;
    const midCol = col + dCol;
    const jumpRow = row + dRow * 2;
    const jumpCol = col + dCol * 2;

    if (
      isInsideBoard(jumpRow, jumpCol) &&
      board[jumpRow][jumpCol] === null &&
      isOpponent(board[midRow][midCol], player)
    ) {
      jumps.push({ from: [row, col], to: [jumpRow, jumpCol], capture: [midRow, midCol] });
    }
  }
  return jumps;
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

  const redHasMoves = getValidMoves(board, 'r').length > 0;
  const blackHasMoves = getValidMoves(board, 'b').length > 0;

  if (redPieces.length === 0 || !redHasMoves) return 'b';
  if (blackPieces.length === 0 || !blackHasMoves) return 'r';

  return null; // No winner yet
};
