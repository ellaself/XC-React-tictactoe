import { useEffect, useMemo, useState } from "react";


function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick} type="button">
      {value}
    </button>
  );
}

function SizePicker({ rows, cols, setRows, setCols, onApply }) {
  const winLen = Math.min(rows, cols);

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <label>
        Rows:&nbsp;
        <input
          type="number"
          min={1}
          max={10}
          value={rows}
          onChange={(e) => setRows(clampInt(e.target.value, 1, 10))}
          style={{ width: 70 }}
        />
      </label>

      <label>
        Cols:&nbsp;
        <input
          type="number"
          min={1}
          max={10}
          value={cols}
          onChange={(e) => setCols(clampInt(e.target.value, 1, 10))}
          style={{ width: 70 }}
        />
      </label>

      <button onClick={onApply} type="button">Apply Size</button>

      <span style={{ opacity: 0.8 }}>
        Win = <strong>{winLen}</strong>
      </span>
    </div>
  );
}

function Board({ squares, rows, cols, onClickSquare, status, winner }) {
  const gridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 44px)`,
      gap: 6,
      marginTop: 12,
    }),
    [cols]
  );

  return (
    <>
      <div className="status">{status}</div>
      {winner ? <p className="congrats">Congratulations!! { winner } Wins!</p> : null}

      <div style={gridStyle}>
        {squares.map((value, i) => (
          <Square key={i} value={value} onSquareClick={() => onClickSquare(i)} />
        ))}
      </div>
    </>
  );
}


export default function Game() {
  // Challenge 6/7: dynamic board size
  const [rowsDraft, setRowsDraft] = useState(3);
  const [colsDraft, setColsDraft] = useState(3);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const size = rows * cols;
  const k = Math.min(rows, cols);

  const [history, setHistory] = useState([Array(size).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);

  // Challenge 4: player switching
  const [humanPlayer, setHumanPlayer] = useState("X");

  const currentSquares = history[currentMove];
  const currentPlayer = xIsNext ? "X" : "O";
  const isLatestMove = currentMove === history.length - 1;

  const winner = calculateWinner(currentSquares, rows, cols, k);

  const isBoardFull = useMemo(
    () => currentSquares.every((square) => square !== null),
    [currentSquares]
  );

  const status = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (isBoardFull) return "Tie game!";
    return `Next player: ${currentPlayer}`;
  }, [winner, isBoardFull, currentPlayer]);

  // Challenge 2: reset board
  function resetGame(nextRows = rows, nextCols = cols) {
    const nextSize = nextRows * nextCols;
    setHistory([Array(nextSize).fill(null)]);
    setCurrentMove(0);
    setXIsNext(true);
    setHumanPlayer("X");
  }

  // Challenge 7: resize during play
  function applySize() {
    const newRows = rowsDraft;
    const newCols = colsDraft;

    const mappedSquares = mapBoard(
      currentSquares,
      rows,
      cols,
      newRows,
      newCols
    );

    setRows(newRows);
    setCols(newCols);
    setHistory([mappedSquares]);
    setCurrentMove(0);

    const xCount = mappedSquares.filter((s) => s === "X").length;
    const oCount = mappedSquares.filter((s) => s === "O").length;
    setXIsNext(xCount === oCount);
  }

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setXIsNext((prev) => !prev);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
    setXIsNext(nextMove % 2 === 0);
  }

  function onClickSquare(i) {
    if (!isLatestMove || winner || currentSquares[i]) return;
    if (currentPlayer !== humanPlayer) return;

    const nextSquares = currentSquares.slice();
    nextSquares[i] = currentPlayer;
    handlePlay(nextSquares);
  }

  // Challenge 3/4/5: computer move
  useEffect(() => {
    if (!isLatestMove || winner || isBoardFull) return;

    if (currentPlayer !== humanPlayer) {
      const best = findBestMove(
        currentSquares.slice(),
        rows,
        cols,
        k,
        currentPlayer
      );

      if (best === null) return;

      const nextSquares = currentSquares.slice();
      nextSquares[best] = currentPlayer;
      handlePlay(nextSquares);
    }
  }, [
    currentSquares,
    currentPlayer,
    humanPlayer,
    isBoardFull,
    isLatestMove,
    winner,
    rows,
    cols,
    k,
  ]);

  function switchPlayerAndComputerMove() {
    if (!isLatestMove || winner || isBoardFull) return;

    const best = findBestMove(
      currentSquares.slice(),
      rows,
      cols,
      k,
      currentPlayer
    );

    if (best === null) return;

    const nextSquares = currentSquares.slice();
    nextSquares[best] = currentPlayer;
    handlePlay(nextSquares);

    setHumanPlayer(opponentOf(currentPlayer));
  }

  const moves = useMemo(
    () =>
      history.map((_, move) => {
        const description =
          move > 0 ? `Go to move #${move}` : "Go to game start";

        return (
          <li key={move}>
            <button onClick={() => jumpTo(move)} type="button">
              {description}
            </button>
          </li>
        );
      }),
    [history]
  );

  return (
    <div className="game">
      <div className="game-board">
        <SizePicker
          rows={rowsDraft}
          cols={colsDraft}
          setRows={setRowsDraft}
          setCols={setColsDraft}
          onApply={applySize}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={() => resetGame()} type="button">Reset</button>

          <button onClick={switchPlayerAndComputerMove} type="button">
            Switch to Player {opponentOf(humanPlayer)}
          </button>

          <span style={{ marginLeft: 6, opacity: 0.85 }}>
            Human: <strong>{humanPlayer}</strong>
          </span>

          <span style={{ opacity: 0.85 }}>
            Board: <strong>{rows}×{cols}</strong>
          </span>
        </div>

        <Board
          squares={currentSquares}
          rows={rows}
          cols={cols}
          onClickSquare={onClickSquare}
          status={status}
          winner={winner}
        />
      </div>

      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  );
}


function calculateWinner(squares, rows, cols, k) {
  if (rows === 3 && cols === 3 && k === 3) {
    return calculateWinnerRegex3x3(squares);
  }

  const directions = [[0,1],[1,0],[1,1],[1,-1]];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const start = squares[idx(r,c,cols)];
      if (!start) continue;

      for (const [dr,dc] of directions) {
        let ok = true;

        for (let step = 1; step < k; step++) {
          const rr = r + dr*step;
          const cc = c + dc*step;

          if (rr<0 || rr>=rows || cc<0 || cc>=cols ||
              squares[idx(rr,cc,cols)] !== start) {
            ok = false;
            break;
          }
        }

        if (ok) return start;
      }
    }
  }

  return null;
}

function calculateWinnerRegex3x3(squares) {
  const re =
    /^(?:(?:...){0,2}([OX])\1\1|.{0,2}([OX])..\2..\2|([OX])...\3...\3|..([OX]).\4.\4)/g;

  const flat = squares.map((s) => s ?? "-").join("");
  re.lastIndex = 0;

  const match = re.exec(flat);
  if (!match) return null;

  return match[1] || match[2] || match[3] || match[4] || null;
}




function findBestMove(board, rows, cols, k, currentPlayer) {
  const emptyCells = getEmptyIndices(board);
  if (emptyCells.length === 0) return null;

  const opponent = opponentOf(currentPlayer);

  // win
  for (const i of emptyCells) {
    board[i] = currentPlayer;
    if (calculateWinner(board, rows, cols, k) === currentPlayer) {
      board[i] = null;
      return i;
    }
    board[i] = null;
  }

  // block
  for (const i of emptyCells) {
    board[i] = opponent;
    if (calculateWinner(board, rows, cols, k) === opponent) {
      board[i] = null;
      return i;
    }
    board[i] = null;
  }

  // minimax
  const maxDepth = board.length <= 9 ? board.length : 4;

  let bestMove = null;
  let bestScore = currentPlayer === "X" ? -Infinity : Infinity;

  for (const i of emptyCells) {
    board[i] = currentPlayer;

    const score = minimax(
      board,
      rows,
      cols,
      k,
      0,
      currentPlayer === "O",
      maxDepth
    );

    board[i] = null;

    if (currentPlayer === "X") {
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove ?? emptyCells[0];
}

function minimax(board, rows, cols, k, depth, isMaximizing, maxDepth) {
  const winner = calculateWinner(board, rows, cols, k);

  if (winner === "X") return 10 - depth;
  if (winner === "O") return depth - 10;
  if (isDraw(board)) return 0;
  if (depth >= maxDepth) return 0;

  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const i of getEmptyIndices(board)) {
    board[i] = isMaximizing ? "X" : "O";

    const score = minimax(
      board,
      rows,
      cols,
      k,
      depth + 1,
      !isMaximizing,
      maxDepth
    );

    bestScore = isMaximizing
      ? Math.max(bestScore, score)
      : Math.min(bestScore, score);

    board[i] = null;
  }

  return bestScore;
}

//helpers

function mapBoard(oldSquares, oldRows, oldCols, newRows, newCols) {
  const newSquares = Array(newRows * newCols).fill(null);

  const rMax = Math.min(oldRows, newRows);
  const cMax = Math.min(oldCols, newCols);

  for (let r = 0; r < rMax; r++) {
    for (let c = 0; c < cMax; c++) {
      newSquares[r*newCols+c] = oldSquares[r*oldCols+c];
    }
  }

  return newSquares;
}

function idx(r,c,cols){ return r*cols+c; }

function opponentOf(player){ return player==="X" ? "O" : "X"; }

function getEmptyIndices(board){
  const out=[];
  for(let i=0;i<board.length;i++){
    if(board[i]===null) out.push(i);
  }
  return out;
}

function isDraw(board){
  return board.every((s)=>s!==null);
}

function clampInt(value,min,max){
  const n = Number(value);
  if(!Number.isFinite(n)) return min;
  return Math.max(min,Math.min(max,Math.floor(n)));
}