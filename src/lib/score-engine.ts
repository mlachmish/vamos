// ===== Vamos — Pure Scoring Engine =====
// No side effects, no framework deps. Pure functions only.

import {
  Team,
  PadelPoint,
  MatchScore,
  MatchSettings,
  GameScore,
  SetScore,
  PointEvent,
  Match,
  createInitialGameScore,
  createInitialSetScore,
} from './types';

// Deep clone helper
function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ===== Point Scoring (within a game) =====

const POINT_SEQUENCE: PadelPoint[] = ['0', '15', '30', '40'];

function nextPoint(current: PadelPoint): PadelPoint {
  const idx = POINT_SEQUENCE.indexOf(current);
  if (idx < 3) return POINT_SEQUENCE[idx + 1];
  return current; // Already at 40
}

function scoreRegularGame(
  game: GameScore,
  team: Team,
  settings: MatchSettings
): { game: GameScore; gameWon: boolean; winner: Team | null } {
  const newGame = clone(game);
  const scoring = team === 'a' ? 'points_a' : 'points_b';
  const opponent = team === 'a' ? 'points_b' : 'points_a';

  const scorerPoints = newGame[scoring];
  const opponentPoints = newGame[opponent];

  // Both at 40 — deuce situation
  if (scorerPoints === '40' && opponentPoints === '40') {
    if (settings.golden_point) {
      // Golden point: next point wins
      return { game: newGame, gameWon: true, winner: team };
    }
    // Advantage to scorer
    newGame[scoring] = 'AD';
    return { game: newGame, gameWon: false, winner: null };
  }

  // Scorer has advantage — they win the game
  if (scorerPoints === 'AD') {
    return { game: newGame, gameWon: true, winner: team };
  }

  // Opponent has advantage — back to deuce
  if (opponentPoints === 'AD') {
    newGame[opponent] = '40';
    return { game: newGame, gameWon: false, winner: null };
  }

  // Scorer at 40 (opponent not at 40) — win
  if (scorerPoints === '40') {
    return { game: newGame, gameWon: true, winner: team };
  }

  // Normal progression
  newGame[scoring] = nextPoint(scorerPoints);
  return { game: newGame, gameWon: false, winner: null };
}

function scoreTiebreakGame(
  game: GameScore,
  team: Team,
  tiebreakPoints: number
): { game: GameScore; gameWon: boolean; winner: Team | null } {
  const newGame = clone(game);
  const scoring = team === 'a' ? 'tiebreak_points_a' : 'tiebreak_points_b';
  const opponent = team === 'a' ? 'tiebreak_points_b' : 'tiebreak_points_a';

  newGame[scoring]++;

  const scorerPts = newGame[scoring];
  const opponentPts = newGame[opponent];

  // Must reach target AND win by 2
  if (scorerPts >= tiebreakPoints && scorerPts - opponentPts >= 2) {
    return { game: newGame, gameWon: true, winner: team };
  }

  return { game: newGame, gameWon: false, winner: null };
}

// ===== Game → Set progression =====

function checkSetWon(
  set: SetScore,
  settings: MatchSettings
): { won: boolean; winner: Team | null } {
  const { games_a, games_b, games_per_set } = { ...settings, ...set };

  // Check if either team has won enough games
  for (const team of ['a', 'b'] as const) {
    const myGames = team === 'a' ? set.games_a : set.games_b;
    const theirGames = team === 'a' ? set.games_b : set.games_a;

    if (myGames >= games_per_set && myGames - theirGames >= 2) {
      return { won: true, winner: team };
    }
  }

  // Tiebreak winner (the tiebreak game was won, set score is X-X+1 after tiebreak at X-X)
  if (set.tiebreak) {
    for (const team of ['a', 'b'] as const) {
      const myGames = team === 'a' ? set.games_a : set.games_b;
      const theirGames = team === 'a' ? set.games_b : set.games_a;
      if (myGames === games_per_set + 1 && theirGames === games_per_set) {
        return { won: true, winner: team };
      }
    }
  }

  return { won: false, winner: null };
}

function isTiebreakTime(set: SetScore, settings: MatchSettings): boolean {
  return (
    set.games_a === settings.games_per_set &&
    set.games_b === settings.games_per_set
  );
}

// ===== Serve rotation =====

function nextServingTeam(
  current: Team,
  game: GameScore
): Team {
  if (game.is_tiebreak) {
    // In tiebreak, serve alternates every 2 points after the first
    const totalPoints = game.tiebreak_points_a + game.tiebreak_points_b;
    if (totalPoints === 0) return current;
    // After first point, alternate every 2
    if (totalPoints === 1) return current === 'a' ? 'b' : 'a';
    // For subsequent points
    if ((totalPoints - 1) % 2 === 0) return current === 'a' ? 'b' : 'a';
    return current;
  }
  // Regular game: serve alternates every game (handled at game boundary)
  return current;
}

function switchServer(current: Team): Team {
  return current === 'a' ? 'b' : 'a';
}

function toggleServingPlayer(score: MatchScore): void {
  if (score.serving_team === 'a') {
    score.serving_player_a = score.serving_player_a === 1 ? 2 : 1;
  } else {
    score.serving_player_b = score.serving_player_b === 1 ? 2 : 1;
  }
}

// ===== Main: Score a Point =====

export function scorePoint(match: Match, team: Team): Match {
  if (match.score.winner) return match; // Match is over

  const newMatch = clone(match);
  const score = newMatch.score;
  const settings = newMatch.settings;

  // Save snapshot for undo
  const snapshot: PointEvent = {
    team,
    timestamp: new Date().toISOString(),
    score_snapshot: clone(match.score),
  };
  newMatch.point_history.push(snapshot);

  const currentSet = score.sets[score.current_set];

  // Check if this is a super tiebreak (final set, super_tiebreak enabled)
  const isFinalSet = score.sets.filter(s => s.winner === 'a').length === settings.sets_to_win - 1 &&
                     score.sets.filter(s => s.winner === 'b').length === settings.sets_to_win - 1;
  const isSuperTiebreak = isFinalSet && settings.super_tiebreak &&
                          currentSet.games_a === 0 && currentSet.games_b === 0 &&
                          score.current_game.is_tiebreak;

  // Score the point
  let gameResult;
  if (score.current_game.is_tiebreak) {
    const tbPoints = isSuperTiebreak ? 10 : settings.tiebreak_points;
    gameResult = scoreTiebreakGame(score.current_game, team, tbPoints);
  } else {
    gameResult = scoreRegularGame(score.current_game, team, settings);
  }

  score.current_game = gameResult.game;

  if (!gameResult.gameWon) {
    // Update serving in tiebreak (changes every 2 points after first)
    if (score.current_game.is_tiebreak) {
      const totalPts = score.current_game.tiebreak_points_a + score.current_game.tiebreak_points_b;
      const wasTotalPts = totalPts - 1;
      // Server changes after 1st point, then every 2 points
      if (wasTotalPts === 0 || (wasTotalPts > 0 && wasTotalPts % 2 === 0)) {
        toggleServingPlayer(score);
        score.serving_team = switchServer(score.serving_team);
      }
    }
    return newMatch;
  }

  // Game was won — award game to the team
  if (team === 'a') {
    currentSet.games_a++;
  } else {
    currentSet.games_b++;
  }

  // Super tiebreak: winning the tiebreak wins the set immediately
  if (isSuperTiebreak) {
    currentSet.winner = team;
    score.winner = team;
    newMatch.status = 'completed';
    return newMatch;
  }

  // Check if set is won
  const setResult = checkSetWon(currentSet, settings);

  if (!setResult.won) {
    // Check if we should start a tiebreak
    if (isTiebreakTime(currentSet, settings)) {
      currentSet.tiebreak = true;
      score.current_game = createInitialGameScore(true);
    } else {
      score.current_game = createInitialGameScore();
    }
    // Serve switches between games
    toggleServingPlayer(score);
    score.serving_team = switchServer(score.serving_team);
    return newMatch;
  }

  // Set was won
  currentSet.winner = setResult.winner;

  // Check if match is won
  const setsWonA = score.sets.filter(s => s.winner === 'a').length;
  const setsWonB = score.sets.filter(s => s.winner === 'b').length;

  if (setsWonA >= settings.sets_to_win) {
    score.winner = 'a';
    newMatch.status = 'completed';
    return newMatch;
  }
  if (setsWonB >= settings.sets_to_win) {
    score.winner = 'b';
    newMatch.status = 'completed';
    return newMatch;
  }

  // Start new set
  const newSet = createInitialSetScore();
  score.sets.push(newSet);
  score.current_set++;

  // Check if the new set should start as a super tiebreak
  const nowFinalSet = setsWonA === settings.sets_to_win - 1 && setsWonB === settings.sets_to_win - 1;
  if (nowFinalSet && settings.super_tiebreak) {
    score.current_game = createInitialGameScore(true);
  } else {
    score.current_game = createInitialGameScore();
  }

  // Serve switches between sets
  toggleServingPlayer(score);
  score.serving_team = switchServer(score.serving_team);

  return newMatch;
}

// ===== Undo =====

export function undoLastPoint(match: Match): Match {
  if (match.point_history.length === 0) return match;

  const newMatch = clone(match);
  const lastEvent = newMatch.point_history.pop()!;

  newMatch.score = lastEvent.score_snapshot;
  newMatch.status = 'in_progress';

  return newMatch;
}

// ===== Display helpers =====

export function getGameScoreDisplay(game: GameScore): { a: string; b: string } {
  if (game.is_tiebreak) {
    return {
      a: String(game.tiebreak_points_a),
      b: String(game.tiebreak_points_b),
    };
  }
  return {
    a: game.points_a,
    b: game.points_b,
  };
}

export function getMatchSummary(match: Match): string {
  return match.score.sets
    .filter(s => s.winner !== null)
    .map(s => `${s.games_a}-${s.games_b}`)
    .join('  ');
}
