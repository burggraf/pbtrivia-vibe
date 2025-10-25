/**
 * PocketBase Hooks for Game Scoreboard Management
 *
 * This module manages the games.scoreboard field dynamically based on
 * game_teams and game_players collection events.
 */

/// <reference path="../pb_data/types.d.ts" />

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets or initializes the scoreboard for a game
 * @param {Dao} dao - PocketBase DAO
 * @param {string} gameId - The game ID
 * @returns {Object} - The current scoreboard or initialized structure
 */
function getGameScoreboard(dao, gameId) {
  try {
    const game = dao.findRecordById("games", gameId)
    let scoreboard = game.get("scoreboard")

    if (!scoreboard) {
      scoreboard = { teams: {} }
    } else if (!scoreboard.teams) {
      scoreboard.teams = {}
    }

    return { game, scoreboard }
  } catch (error) {
    console.error("Error getting game scoreboard:", error)
    throw new Error(`Failed to get scoreboard for game ${gameId}: ${error.message}`)
  }
}

/**
 * Saves the updated scoreboard to a game
 * @param {Dao} dao - PocketBase DAO
 * @param {Record} game - The game record
 * @param {Object} scoreboard - The updated scoreboard
 */
function saveGameScoreboard(dao, game, scoreboard) {
  try {
    game.set("scoreboard", scoreboard)
    dao.saveRecord(game)
  } catch (error) {
    console.error("Error saving game scoreboard:", error)
    throw new Error(`Failed to save scoreboard: ${error.message}`)
  }
}

/**
 * Gets player information for the scoreboard
 * @param {Dao} dao - PocketBase DAO
 * @param {string} playerId - The player ID
 * @returns {Object} - Player info with id, name, and email
 */
function getPlayerInfo(dao, playerId) {
  try {
    const player = dao.findRecordById("_pb_users_auth_", playerId)
    return {
      id: player.id,
      name: player.get("name") || player.get("email")?.split("@")[0] || "Unknown",
      email: player.get("email") || ""
    }
  } catch (error) {
    console.error("Error getting player info:", error)
    // Return minimal info if player not found
    return {
      id: playerId,
      name: "Unknown Player",
      email: ""
    }
  }
}

/**
 * Gets all players for a specific team
 * @param {Dao} dao - PocketBase DAO
 * @param {string} gameId - The game ID
 * @param {string} teamId - The team ID (or null for "no team")
 * @returns {Array} - Array of player objects
 */
function getTeamPlayers(dao, gameId, teamId) {
  try {
    const players = []

    // Find all game_players for this game and team
    const gamePlayers = dao.findRecordsByFilter(
      "game_players",
      `game = "${gameId}"${teamId ? ` && team = "${teamId}"` : ` && (team = null || team = "")`}`
    )

    for (const gamePlayer of gamePlayers) {
      const playerId = gamePlayer.get("player")
      const playerInfo = getPlayerInfo(dao, playerId)
      players.push(playerInfo)
    }

    return players
  } catch (error) {
    console.error("Error getting team players:", error)
    return []
  }
}

/**
 * Ensures "no team" exists in the scoreboard for players without teams
 * @param {Object} scoreboard - The current scoreboard
 * @returns {Object} - Updated scoreboard with "no team" if needed
 */
function ensureNoTeamExists(scoreboard) {
  if (!scoreboard.teams["no-team"]) {
    scoreboard.teams["no-team"] = {
      name: "No Team",
      players: []
    }
  }
  return scoreboard
}

/**
 * Removes a team from the scoreboard and reassigns players to "no team"
 * @param {Dao} dao - PocketBase DAO
 * @param {string} gameId - The game ID
 * @param {string} teamId - The team ID to remove
 */
function removeTeamFromScoreboard(dao, gameId, teamId) {
  const { game, scoreboard } = getGameScoreboard(dao, gameId)

  // Remove the team from the scoreboard
  if (scoreboard.teams[teamId]) {
    delete scoreboard.teams[teamId]
  }

  // Ensure "no team" exists
  ensureNoTeamExists(scoreboard)

  // Update players for "no team"
  scoreboard.teams["no-team"].players = getTeamPlayers(dao, gameId, null)

  // Save the updated scoreboard
  saveGameScoreboard(dao, game, scoreboard)
}

/**
 * Updates or creates a team in the scoreboard
 * @param {Dao} dao - PocketBase DAO
 * @param {string} gameId - The game ID
 * @param {string} teamId - The team ID
 * @param {string} teamName - The team name
 */
function updateTeamInScoreboard(dao, gameId, teamId, teamName) {
  const { game, scoreboard } = getGameScoreboard(dao, gameId)

  // Ensure "no team" exists for players without teams
  ensureNoTeamExists(scoreboard)

  // Update or create the team in the scoreboard
  if (!scoreboard.teams[teamId]) {
    scoreboard.teams[teamId] = {
      name: teamName,
      players: []
    }
  } else {
    scoreboard.teams[teamId].name = teamName
  }

  // Update players for this team
  scoreboard.teams[teamId].players = getTeamPlayers(dao, gameId, teamId)

  // Also update "no team" players in case players were moved
  scoreboard.teams["no-team"].players = getTeamPlayers(dao, gameId, null)

  // Save the updated scoreboard
  saveGameScoreboard(dao, game, scoreboard)
}

// ============================================================================
// GAME_TEAMS EVENT HOOKS
// ============================================================================

/**
 * Handle game_teams after create success
 */
onModelAfterCreateSuccess((e) => {
  if (e.model?.collectionName !== "game_teams") {
    return e.next()
  }

  const team = e.model
  const gameId = team.get("game")
  const teamId = team.id
  const teamName = team.get("name")

  console.log(`Team created: ${teamName} for game ${gameId}`)

  try {
    updateTeamInScoreboard($app.dao(), gameId, teamId, teamName)
  } catch (error) {
    console.error("Error updating scoreboard after team creation:", error)
  }

  return e.next()
}, "game_teams")

/**
 * Handle game_teams after update success
 */
onModelAfterUpdateSuccess((e) => {
  if (e.model?.collectionName !== "game_teams") {
    return e.next()
  }

  const team = e.model
  const gameId = team.get("game")
  const teamId = team.id
  const teamName = team.get("name")

  console.log(`Team updated: ${teamName} for game ${gameId}`)

  try {
    updateTeamInScoreboard($app.dao(), gameId, teamId, teamName)
  } catch (error) {
    console.error("Error updating scoreboard after team update:", error)
  }

  return e.next()
}, "game_teams")

/**
 * Handle game_teams after delete success
 */
onModelAfterDeleteSuccess((e) => {
  if (e.model?.collectionName !== "game_teams") {
    return e.next()
  }

  const team = e.model
  const gameId = team.get("game")
  const teamId = team.id
  const teamName = team.get("name")

  console.log(`Team deleted: ${teamName} for game ${gameId}`)

  try {
    removeTeamFromScoreboard($app.dao(), gameId, teamId)
  } catch (error) {
    console.error("Error updating scoreboard after team deletion:", error)
  }

  return e.next()
}, "game_teams")

// ============================================================================
// GAME_PLAYERS EVENT HOOKS
// ============================================================================

/**
 * Handle game_players after create success
 */
onModelAfterCreateSuccess((e) => {
  if (e.model?.collectionName !== "game_players") {
    return e.next()
  }

  const gamePlayer = e.model
  const gameId = gamePlayer.get("game")
  const teamId = gamePlayer.get("team")

  console.log(`Player added to game ${gameId}, team: ${teamId || "no team"}`)

  try {
    // Get the game teams to check if any exist
    const gameTeams = $app.dao().findRecordsByFilter("game_teams", `game = "${gameId}"`)

    if (gameTeams.length === 0) {
      // No teams exist, ensure "no team" exists and add player there
      const { game: gameRecord, scoreboard } = getGameScoreboard($app.dao(), gameId)
      ensureNoTeamExists(scoreboard)

      // Add player to "no team"
      const playerId = gamePlayer.get("player")
      const playerInfo = getPlayerInfo($app.dao(), playerId)

      // Check if player is already in the team
      const playerExists = scoreboard.teams["no-team"].players.some(p => p.id === playerId)
      if (!playerExists) {
        scoreboard.teams["no-team"].players.push(playerInfo)
      }

      saveGameScoreboard($app.dao(), gameRecord, scoreboard)
    } else {
      // Teams exist, update the specific team or "no team"
      if (teamId) {
        // Update the specific team
        const team = $app.dao().findRecordById("game_teams", teamId)
        const teamName = team.get("name")
        updateTeamInScoreboard($app.dao(), gameId, teamId, teamName)
      } else {
        // Update "no team"
        const { game: gameRecord, scoreboard } = getGameScoreboard($app.dao(), gameId)
        ensureNoTeamExists(scoreboard)

        // Add player to "no team"
        const playerId = gamePlayer.get("player")
        const playerInfo = getPlayerInfo($app.dao(), playerId)

        // Check if player is already in the team
        const playerExists = scoreboard.teams["no-team"].players.some(p => p.id === playerId)
        if (!playerExists) {
          scoreboard.teams["no-team"].players.push(playerInfo)
        }

        saveGameScoreboard($app.dao(), gameRecord, scoreboard)
      }
    }
  } catch (error) {
    console.error("Error updating scoreboard after player creation:", error)
  }

  return e.next()
}, "game_players")

/**
 * Handle game_players after update success
 */
onModelAfterUpdateSuccess((e) => {
  if (e.model?.collectionName !== "game_players") {
    return e.next()
  }

  const gamePlayer = e.model
  const gameId = gamePlayer.get("game")
  const newTeamId = gamePlayer.get("team")

  console.log(`Player updated in game ${gameId}, new team: ${newTeamId || "no team"}`)

  try {
    // Get all teams for this game to update their player lists
    const gameTeams = $app.dao().findRecordsByFilter("game_teams", `game = "${gameId}"`)

    // Update each team in the scoreboard
    for (const team of gameTeams) {
      const teamId = team.id
      const teamName = team.get("name")
      updateTeamInScoreboard($app.dao(), gameId, teamId, teamName)
    }

    // Also update "no team" if there are players without teams
    const playersWithoutTeam = $app.dao().findRecordsByFilter(
      "game_players",
      `game = "${gameId}" && (team = null || team = "")`
    )

    if (playersWithoutTeam.length > 0) {
      const { game: gameRecord, scoreboard } = getGameScoreboard($app.dao(), gameId)
      ensureNoTeamExists(scoreboard)
      scoreboard.teams["no-team"].players = getTeamPlayers($app.dao(), gameId, null)
      saveGameScoreboard($app.dao(), gameRecord, scoreboard)
    }
  } catch (error) {
    console.error("Error updating scoreboard after player update:", error)
  }

  return e.next()
}, "game_players")

/**
 * Handle game_players after delete success
 */
onModelAfterDeleteSuccess((e) => {
  if (e.model?.collectionName !== "game_players") {
    return e.next()
  }

  const gamePlayer = e.model
  const gameId = gamePlayer.get("game")
  const teamId = gamePlayer.get("team")
  const playerId = gamePlayer.get("player")

  console.log(`Player removed from game ${gameId}, was in team: ${teamId || "no team"}`)

  try {
    // Remove player from the appropriate team in the scoreboard
    if (teamId) {
      const team = $app.dao().findRecordById("game_teams", teamId)
      const teamName = team.get("name")
      updateTeamInScoreboard($app.dao(), gameId, teamId, teamName)
    } else {
      // Update "no team"
      const { game: gameRecord, scoreboard } = getGameScoreboard($app.dao(), gameId)
      ensureNoTeamExists(scoreboard)

      // Remove player from "no team"
      scoreboard.teams["no-team"].players = scoreboard.teams["no-team"].players.filter(
        p => p.id !== playerId
      )

      saveGameScoreboard($app.dao(), gameRecord, scoreboard)
    }
  } catch (error) {
    console.error("Error updating scoreboard after player deletion:", error)
  }

  return e.next()
}, "game_players")

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handle errors for all scoreboard operations
 */
onRecordAfterCreateError((e) => {
  if (e.record?.collectionName === "game_teams" || e.record?.collectionName === "game_players") {
    console.error(`Error creating ${e.record.collectionName}:`, e.error)
  }
  return e.next()
}, "scoreboard")

onRecordAfterUpdateError((e) => {
  if (e.record?.collectionName === "game_teams" || e.record?.collectionName === "game_players") {
    console.error(`Error updating ${e.record.collectionName}:`, e.error)
  }
  return e.next()
}, "scoreboard")

onRecordAfterDeleteError((e) => {
  if (e.record?.collectionName === "game_teams" || e.record?.collectionName === "game_players") {
    console.error(`Error deleting ${e.record.collectionName}:`, e.error)
  }
  return e.next()
}, "scoreboard")

console.log("Scoreboard hooks loaded successfully!")