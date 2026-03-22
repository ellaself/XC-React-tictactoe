import { useEffect, useState } from 'react';

function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay, humanPlayer }) {
  function handleClick(i) {
    const currentPlayer = xIsNext ? 'X' : 'O';

    if (declearWinner(squares) || squares[i]) return;

    // challenge 4: only human can click
    if (currentPlayer !== humanPlayer) return;

    const nextSquares = squares.slice();
    nextSquares[i] = currentPlayer;
    onPlay(nextSquares);
  }

  const winner = declearWinner(squares);
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

      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );
}

export default function Game() {
  const [xIsNext, setXIsNext] = useState(true);
  const [history, setHistory] = useState([Array(9).fill(null)]);
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
  function resetGame() {
    setHistory([Array(9).fill(null)]);
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
    const winner = declearWinner(currentSquares);
    const boardFull = currentSquares.every((s) => s !== null);
    const currentPlayer = xIsNext ? 'X' : 'O';

    if (winner || boardFull) return;

    const bestMove = findBestMove(currentSquares, currentPlayer);

    if (bestMove !== null) {
      const nextSquares = currentSquares.slice();
      nextSquares[bestMove] = currentPlayer;
      handlePlay(nextSquares);
    }

    setHumanPlayer(currentPlayer === 'X' ? 'O' : 'X');
  }

  // challenge 3: auto move
  useEffect(() => {
    const winner = declearWinner(currentSquares);
    const boardFull = currentSquares.every((s) => s !== null);
    const currentPlayer = xIsNext ? 'X' : 'O';

    if (!winner && !boardFull && currentPlayer !== humanPlayer) {
      const bestMove = findBestMove(currentSquares, currentPlayer);

      if (bestMove !== null) {
        const nextSquares = currentSquares.slice();
        nextSquares[bestMove] = currentPlayer;
        handlePlay(nextSquares);
      }
    }
  }, [xIsNext, currentSquares, humanPlayer]);

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
        <button onClick={resetGame}>Reset</button>
        <button onClick={switchPlayer}>
          Switch to Player {humanPlayer === 'X' ? 'O' : 'X'}
        </button>

        <Board
          xIsNext={xIsNext}
          squares={currentSquares}
          onPlay={handlePlay}
          humanPlayer={humanPlayer}
        />
      </div>

      <div className="game-info">
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
  const winner = declearWinner(board);

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

// challenge 5: best move with minimax
function findBestMove(squares, player) {
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

// challenge 1
function declearWinner(squares) {
  const re =
    /^(?:(?:...){0,2}([OX])\1\1|.{0,2}([OX])..\2..\2|([OX])...\3...\3|..([OX]).\4.\4)/g;

  const flat = squares.map((s) => s ?? '-').join('');

  re.lastIndex = 0;
  const match = re.exec(flat);

  if (!match) return null;

  return match[1] || match[2] || match[3] || match[4] || null;
}