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
  let status;

  if (winner) {
    status = 'Winner: ' + winner;
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
    const boardFull = currentSquares.every(s => s !== null);
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
    const boardFull = currentSquares.every(s => s !== null);
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
    const description = move > 0
      ? 'Go to move #' + move
      : 'Go to game start';

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

// challenge 3: empty squares
function getEmptySquares(squares) {
  const empty = [];
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) empty.push(i);
  }
  return empty;
}

// challenge 3: best move logic
function findBestMove(squares, player) {
  const moveOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  const empty = getEmptySquares(squares);
  const opponent = player === 'X' ? 'O' : 'X';

  // win
  for (let i of empty) {
    const test = squares.slice();
    test[i] = player;
    if (declearWinner(test) === player) return i;
  }

  // block
  for (let i of empty) {
    const test = squares.slice();
    test[i] = opponent;
    if (declearWinner(test) === opponent) return i;
  }

  // order
  for (let i of moveOrder) {
    if (squares[i] === null) return i;
  }

  return null;
}

// challenge 1: regex winner
function declearWinner(squares) {
  const re =
    /^(?:(?:...){0,2}([OX])\1\1|.{0,2}([OX])..\2..\2|([OX])...\3...\3|..([OX]).\4.\4)/g;

  const flat = squares.map(s => s ?? '-').join('');

  re.lastIndex = 0;
  const match = re.exec(flat);

  if (!match) return null;

  return match[1] || match[2] || match[3] || match[4] || null;
}