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

export const getValidMoves = (board, player, fromRow = null, fromCol = null) => {
  const moves = [];
  const jumps = [];

  const positionsToCheck = fromRow !== null && fromCol !== null
    ? [[fromRow, fromCol]]
    : board.flatMap((rowArr, r) =>
        rowArr.map((_, c) => [r, c])
      );

  for (let [row, col] of positionsToCheck) {
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

  return [...moves, ...jumps];
};

export const getCapturesFromPosition = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];

  const player = piece.toLowerCase();
  const captures = [];

  const dirs = getDirections(piece);
  for (let [dRow, dCol] of dirs) {
    const midRow = row + dRow;
    const midCol = col + dCol;
    const destRow = row + dRow * 2;
    const destCol = col + dCol * 2;

    if (
      isInsideBoard(destRow, destCol) &&
      !board[destRow][destCol] &&
      isOpponent(board[midRow]?.[midCol], player)
    ) {
      captures.push({ from: [row, col], to: [destRow, destCol], capture: [midRow, midCol] });
    }
  }

  return captures;
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

  if (!piece) return null;

  newBoard[srcRow][srcCol] = null;
  newBoard[destRow][destCol] = piece;

  let didCapture = false;

  if (Math.abs(destRow - srcRow) === 2) {
    const capRow = (srcRow + destRow) / 2;
    const capCol = (srcCol + destCol) / 2;
    newBoard[capRow][capCol] = null;
    didCapture = true;
  }

  if (shouldPromote(piece, destRow)) {
    newBoard[destRow][destCol] = piece.toUpperCase();
  }

  const moreCaptures = didCapture ? getCapturesFromPosition(newBoard, destRow, destCol) : [];

  return {
    board: newBoard,
    moreCaptures,
  };
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

  const redHasMoves = redPieces.some(([r, c]) =>
    getValidMoves(board, 'r', r, c).length > 0
  );
  const blackHasMoves = blackPieces.some(([r, c]) =>
    getValidMoves(board, 'b', r, c).length > 0
  );

  if (redPieces.length === 0 || !redHasMoves) return 'b';
  if (blackPieces.length === 0 || !blackHasMoves) return 'r';

  return null; // No winner yet
};
