import { useEffect, useState } from 'react';

function Square({value, onSquareClick}) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay }) {
  function handleClick(i) {
    if (declearWinner(squares) || squares[i]) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    onPlay(nextSquares);
  }

  const winner = declearWinner(squares);
  let status;
 
  if (winner) {
    status = 'Winner: ' + winner ;
  } else { 
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  return (
    <>
      <div className="status">{status}</div>
      {winner && (
        <p className="congrats"> Congratulations!! You Win!</p>
      )}

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
  const currentSquares = history[currentMove];

  useEffect(() => {
    const winner = declearWinner(currentSquares);
    const boardFull = currentSquares.every(square => square !== null);

    if (!xIsNext && !winner && !boardFull) {
      const bestMove = findBestMove(currentSquares);

      if (bestMove !== null) {
        const nextSquares = currentSquares.slice();
        nextSquares[bestMove] = 'O';
        handlePlay(nextSquares);
      }
    }
  }, [xIsNext, currentSquares]);

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setXIsNext(!xIsNext);
  }

  function resetGame() {
    setHistory([Array(9).fill(null)]);
    setCurrentMove(0);
    setXIsNext(true);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
    setXIsNext(nextMove % 2 === 0);
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = 'Go to move #' + move;
    } else {
      description = 'Go to game start';
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  //challenge 2 
  return (
    <div className="game">
      <div className="game-board">
        <button onClick={resetGame}>Reset</button>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

function getEmptySquares(squares) {
  const emptySquares = [];
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) {
      emptySquares.push(i);
    }
  }
  return emptySquares;
}


//challenge 3 
function findBestMove(squares) {
  const moveOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  const emptySquares = getEmptySquares(squares);

  // If O can win, play there
  for (let i = 0; i < emptySquares.length; i++) {
    const index = emptySquares[i];
    const testSquares = squares.slice();
    testSquares[index] = 'O';
    if (declearWinner(testSquares) === 'O') {
      return index;
    }
  }

  // If X can win next, block X
  for (let i = 0; i < emptySquares.length; i++) {
    const index = emptySquares[i];
    const testSquares = squares.slice();
    testSquares[index] = 'X';
    if (declearWinner(testSquares) === 'X') {
      return index;
    }
  }

  // Otherwise use center, corners, edges
  for (let i = 0; i < moveOrder.length; i++) {
    const index = moveOrder[i];
    if (squares[index] === null) {
      return index;
    }
  }

  return null;
}
//challenge
function declearWinner(squares) {
  const re =
    /^(?:(?:...){0,2}([OX])\1\1|.{0,2}([OX])..\2..\2|([OX])...\3...\3|..([OX]).\4.\4)/g;

  const flat = squares.map((square) => square ?? '-').join('');

  re.lastIndex = 0;
  const match = re.exec(flat);

  if (!match) return null;

  return match[1] || match[2] || match[3] || match[4] || null;
}
