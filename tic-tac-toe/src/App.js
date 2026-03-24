import { useEffect, useState } from 'react';

function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay, humanPlayer, rows, cols }) {
  function handleClick(i) {
    const currentPlayer = xIsNext ? 'X' : 'O';

    if (declearWinner(squares, rows, cols) || squares[i]) return;

    // challenge 4: only human can click
    if (currentPlayer !== humanPlayer) return;

    const nextSquares = squares.slice();
    nextSquares[i] = currentPlayer;
    onPlay(nextSquares);
  }

  const winner = declearWinner(squares, rows, cols);
  const boardFull = squares.every((s) => s !== null);
  let status;

  if (winner) {
    status = 'Winner: ' + winner;
  } else if (boardFull) {
    status = 'Tie game';
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  return (
    <>
      <div className="status">{status}</div>
      {winner && <p className="congrats"> Congratulations!! You Win!</p>}

      {/* challenge 6: dynamic board rendering */}
      {Array.from({ length: rows }, (_, r) => (
        <div className="board-row" key={r}>
          {Array.from({ length: cols }, (_, c) => {
            const index = r * cols + c;
            return (
              <Square
                key={index}
                value={squares[index]}
                onSquareClick={() => handleClick(index)}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}

export default function Game() {
  const [xIsNext, setXIsNext] = useState(true);

  // challenge 6: board size input
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [inputRows, setInputRows] = useState(3);
  const [inputCols, setInputCols] = useState(3);

  const [history, setHistory] = useState([Array(3 * 3).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);

  // challenge 4: track human player
  const [humanPlayer, setHumanPlayer] = useState('X');

  const currentSquares = history[currentMove];

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setXIsNext(!xIsNext);
  }

  // challenge 2: reset
  function resetGame(newRows = rows, newCols = cols) {
    setHistory([Array(newRows * newCols).fill(null)]);
    setCurrentMove(0);
    setXIsNext(true);
    setHumanPlayer('X');
  }

  // challenge 6: apply board size
  function applyBoardSize() {
    const newRows = Math.max(1, Number(inputRows) || 3);
    const newCols = Math.max(1, Number(inputCols) || 3);

    setRows(newRows);
    setCols(newCols);
    setHistory([Array(newRows * newCols).fill(null)]);
    setCurrentMove(0);
    setXIsNext(true);
    setHumanPlayer('X');
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
    setXIsNext(nextMove % 2 === 0);
  }

  // challenge 4: switch player
  function switchPlayer() {
    setHumanPlayer(humanPlayer === 'X' ? 'O' : 'X');
  }

  // challenge 3: auto move
  useEffect(() => {
    const winner = declearWinner(currentSquares, rows, cols);
    const boardFull = currentSquares.every((s) => s !== null);
    const currentPlayer = xIsNext ? 'X' : 'O';

    if (!winner && !boardFull && currentPlayer !== humanPlayer) {
      const bestMove = findBestMove(currentSquares, currentPlayer, rows, cols);

      if (bestMove !== null) {
        const nextSquares = currentSquares.slice();
        nextSquares[bestMove] = currentPlayer;
        handlePlay(nextSquares);
      }
    }
  }, [xIsNext, currentSquares, humanPlayer, rows, cols]);

  const moves = history.map((squares, move) => {
    const description =
      move > 0 ? 'Go to move #' + move : 'Go to game start';

    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-board">
        {/* challenge 6: board size controls */}
        <div style={{ marginBottom: '10px' }}>
          <label>
            rows:
            <input
              type="number"
              min="1"
              value={inputRows}
              onChange={(e) => setInputRows(e.target.value)}
            />
          </label>

          <label style={{ marginLeft: '10px' }}>
            cols:
            <input
              type="number"
              min="1"
              value={inputCols}
              onChange={(e) => setInputCols(e.target.value)}
            />
          </label>

          <button onClick={applyBoardSize} style={{ marginLeft: '10px' }}>
            set board size
          </button>
        </div>

        <button onClick={() => resetGame()}>Reset</button>
        <button onClick={switchPlayer}>
          Switch to Player {humanPlayer === 'X' ? 'O' : 'X'}
        </button>

        <Board
          xIsNext={xIsNext}
          squares={currentSquares}
          onPlay={handlePlay}
          humanPlayer={humanPlayer}
          rows={rows}
          cols={cols}
        />
      </div>

      <div className="game-info">
        {/* challenge 6: show current board settings */}
        <p>board: {rows} x {cols}</p>
        <p>win length: {Math.min(rows, cols)}</p>
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

function getEmptySquares(squares) {
  const empty = [];
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) empty.push(i);
  }
  return empty;
}

function isDraw(squares) {
  return squares.every((s) => s !== null);
}

// challenge 5: minimax
function minimax(board, depth, isMaximizing) {
  const winner = declearWinner(board, 3, 3);

  if (winner === 'X') return 10 - depth;
  if (winner === 'O') return depth - 10;
  if (isDraw(board)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        const score = minimax(board, depth + 1, false);
        board[i] = null;
        bestScore = Math.max(bestScore, score);
      }
    }

    return bestScore;
  } else {
    let bestScore = Infinity;

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const score = minimax(board, depth + 1, true);
        board[i] = null;
        bestScore = Math.min(bestScore, score);
      }
    }

    return bestScore;
  }
}

function canWinNextMove(squares, player, rows, cols) {
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) {
      const testSquares = squares.slice();
      testSquares[i] = player;

      if (declearWinner(testSquares, rows, cols) === player) {
        return i;
      }
    }
  }
  return null;
}

function getCenterMove(squares, rows, cols) {
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2);

  const centers = [];

  if (rows % 2 === 1 && cols % 2 === 1) {
    centers.push(centerRow * cols + centerCol);
  } else {
    const rowChoices = rows % 2 === 0 ? [centerRow - 1, centerRow] : [centerRow];
    const colChoices = cols % 2 === 0 ? [centerCol - 1, centerCol] : [centerCol];

    for (const r of rowChoices) {
      for (const c of colChoices) {
        centers.push(r * cols + c);
      }
    }
  }

  for (const index of centers) {
    if (squares[index] === null) return index;
  }

  return null;
}

function getCornerMove(squares, rows, cols) {
  const corners = [
    0,
    cols - 1,
    (rows - 1) * cols,
    (rows - 1) * cols + (cols - 1),
  ];

  for (const index of corners) {
    if (squares[index] === null) return index;
  }

  return null;
}

// challenge 5: best move with minimax
function findBestMove(squares, player, rows, cols) {
  if (rows === 3 && cols === 3) {
    let bestMove = null;

    if (player === 'X') {
      let bestScore = -Infinity;

      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          const score = minimax(squares, 0, false);
          squares[i] = null;

          if (score > bestScore) {
            bestScore = score;
            bestMove = i;
          }
        }
      }
    } else {
      let bestScore = Infinity;

      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          const score = minimax(squares, 0, true);
          squares[i] = null;

          if (score < bestScore) {
            bestScore = score;
            bestMove = i;
          }
        }
      }
    }

    return bestMove;
  }

  // challenge 6: fast ai for larger boards
  const opponent = player === 'X' ? 'O' : 'X';

  const winningMove = canWinNextMove(squares, player, rows, cols);
  if (winningMove !== null) return winningMove;

  const blockingMove = canWinNextMove(squares, opponent, rows, cols);
  if (blockingMove !== null) return blockingMove;

  const centerMove = getCenterMove(squares, rows, cols);
  if (centerMove !== null) return centerMove;

  const cornerMove = getCornerMove(squares, rows, cols);
  if (cornerMove !== null) return cornerMove;

  const emptySquares = getEmptySquares(squares);
  return emptySquares.length > 0 ? emptySquares[0] : null;
}

// challenge 1
function declearWinner(squares, rows = 3, cols = 3) {
  // challenge 6: generalized winner check
  const winLength = Math.min(rows, cols);
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const start = squares[r * cols + c];
      if (!start) continue;

      for (const [dr, dc] of directions) {
        let count = 1;

        for (let step = 1; step < winLength; step++) {
          const nr = r + dr * step;
          const nc = c + dc * step;

          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
          if (squares[nr * cols + nc] !== start) break;

          count++;
        }

        if (count === winLength) return start;
      }
    }
  }

  return null;
}