/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Add Performance Indexes
 *
 * This migration adds database indexes to optimize query performance during game creation,
 * player joins, and gameplay. These indexes were identified through code analysis of
 * frequently executed queries.
 *
 * Collections affected:
 * - games: Optimize player joins by code and host dashboard queries
 * - game_teams: Optimize team lookups during game setup and play
 * - game_players: Optimize player join validation and roster queries
 * - game_answers: Optimize answer submission and scoring queries
 */

migrate((app) => {
  console.log("Starting performance index migration...");

  try {
    // ==========================================
    // GAMES COLLECTION
    // ==========================================
    console.log("Adding indexes to 'games' collection...");
    const gamesCollection = app.findCollectionByNameOrId("games");
    if (!gamesCollection) {
      throw new Error("Games collection not found");
    }

    // Add composite index for player joins (code + status lookup)
    // Used in: src/lib/games.ts:106-108 - findGameByCode()
    gamesCollection.indexes.push(
      "CREATE INDEX `idx_games_code_status` ON `games` (`code`, `status`)"
    );

    // Add composite index for host dashboard queries (host + startdate sorting)
    // Used in: src/lib/games.ts:8-29 - getGames() with client-side filtering
    gamesCollection.indexes.push(
      "CREATE INDEX `idx_games_host_startdate` ON `games` (`host`, `startdate`)"
    );

    app.save(gamesCollection);
    console.log("✓ Games collection indexes added");

    // ==========================================
    // GAME_TEAMS COLLECTION
    // ==========================================
    console.log("Adding indexes to 'game_teams' collection...");
    const gameTeamsCollection = app.findCollectionByNameOrId("game_teams");
    if (!gameTeamsCollection) {
      throw new Error("Game_teams collection not found");
    }

    // Add index for fetching all teams in a game
    // Used in: src/lib/games.ts:124-126 - getTeamsByGame()
    gameTeamsCollection.indexes.push(
      "CREATE INDEX `idx_game_teams_game` ON `game_teams` (`game`)"
    );

    // Add composite index for host + game lookups (future-proofing for security rules)
    gameTeamsCollection.indexes.push(
      "CREATE INDEX `idx_game_teams_host_game` ON `game_teams` (`host`, `game`)"
    );

    app.save(gameTeamsCollection);
    console.log("✓ Game_teams collection indexes added");

    // ==========================================
    // GAME_PLAYERS COLLECTION
    // ==========================================
    console.log("Adding indexes to 'game_players' collection...");
    const gamePlayersCollection = app.findCollectionByNameOrId("game_players");
    if (!gamePlayersCollection) {
      throw new Error("Game_players collection not found");
    }

    // Add composite index for checking if player is already in game
    // Used in: src/lib/games.ts:178-179 - findPlayerInGame()
    gamePlayersCollection.indexes.push(
      "CREATE INDEX `idx_game_players_game_player` ON `game_players` (`game`, `player`)"
    );

    // Add standalone index for listing all players in a game
    gamePlayersCollection.indexes.push(
      "CREATE INDEX `idx_game_players_game` ON `game_players` (`game`)"
    );

    app.save(gamePlayersCollection);
    console.log("✓ Game_players collection indexes added");

    // ==========================================
    // GAME_ANSWERS COLLECTION
    // ==========================================
    console.log("Adding indexes to 'game_answers' collection...");
    const gameAnswersCollection = app.findCollectionByNameOrId("game_answers");
    if (!gameAnswersCollection) {
      throw new Error("Game_answers collection not found");
    }

    // Add composite index for fetching answers by game and team (scoring queries)
    gameAnswersCollection.indexes.push(
      "CREATE INDEX `idx_game_answers_game_team` ON `game_answers` (`game`, `team`)"
    );

    // Add index for fetching all answers for a specific question
    gameAnswersCollection.indexes.push(
      "CREATE INDEX `idx_game_answers_game_questions_id` ON `game_answers` (`game_questions_id`)"
    );

    // Add composite index for checking if team has answered a specific question
    // Most specific lookup pattern for answer submission validation
    gameAnswersCollection.indexes.push(
      "CREATE INDEX `idx_game_answers_game_question_team` ON `game_answers` (`game`, `game_questions_id`, `team`)"
    );

    app.save(gameAnswersCollection);
    console.log("✓ Game_answers collection indexes added");

    console.log("Performance index migration completed successfully!");
    return null;

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }

}, (app) => {
  // ROLLBACK: Remove all indexes added in the up migration
  console.log("Rolling back performance index migration...");

  try {
    // Remove games indexes
    const gamesCollection = app.findCollectionByNameOrId("games");
    if (gamesCollection) {
      gamesCollection.indexes = gamesCollection.indexes.filter(idx =>
        !idx.includes("idx_games_code_status") &&
        !idx.includes("idx_games_host_startdate")
      );
      app.save(gamesCollection);
      console.log("✓ Games collection indexes removed");
    }

    // Remove game_teams indexes
    const gameTeamsCollection = app.findCollectionByNameOrId("game_teams");
    if (gameTeamsCollection) {
      gameTeamsCollection.indexes = gameTeamsCollection.indexes.filter(idx =>
        !idx.includes("idx_game_teams_game") &&
        !idx.includes("idx_game_teams_host_game")
      );
      app.save(gameTeamsCollection);
      console.log("✓ Game_teams collection indexes removed");
    }

    // Remove game_players indexes
    const gamePlayersCollection = app.findCollectionByNameOrId("game_players");
    if (gamePlayersCollection) {
      gamePlayersCollection.indexes = gamePlayersCollection.indexes.filter(idx =>
        !idx.includes("idx_game_players_game_player") &&
        !idx.includes("idx_game_players_game")
      );
      app.save(gamePlayersCollection);
      console.log("✓ Game_players collection indexes removed");
    }

    // Remove game_answers indexes
    const gameAnswersCollection = app.findCollectionByNameOrId("game_answers");
    if (gameAnswersCollection) {
      gameAnswersCollection.indexes = gameAnswersCollection.indexes.filter(idx =>
        !idx.includes("idx_game_answers_game_team") &&
        !idx.includes("idx_game_answers_game_questions_id") &&
        !idx.includes("idx_game_answers_game_question_team")
      );
      app.save(gameAnswersCollection);
      console.log("✓ Game_answers collection indexes removed");
    }

    console.log("Rollback completed successfully!");
    return null;

  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  }
});
