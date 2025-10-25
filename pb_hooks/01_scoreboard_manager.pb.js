/// <reference path="../pb_data/types.d.ts" />

console.log("=== SCOREBOARD MANAGER HOOK LOADING ===")

// Team creation hook
onRecordAfterCreateSuccess((e) => {
  console.log("=== TEAM CREATED ===")
  console.log("Team ID:", e.record?.id)
  console.log("Game ID:", e.record?.get("game"))

  const gameId = e.record?.get("game")
  if (gameId) {
    console.log("=== UPDATING SCOREBOARD FOR GAME:", gameId, " ===")

    try {
      const game = $app.findRecordById("pbc_879072730", gameId)

      // Get current scoreboard or create new one
      let currentScoreboard = game.get("scoreboard") || {}

      // Team created - add to teams section
      const teamId = e.record?.id
      const teamName = e.record?.get("name") || "Unknown Team"

      const updateData = {
        updated: new Date().toISOString(),
        teams: {
          ...(currentScoreboard.teams || {}),
          [teamId]: {
            name: teamName,
            players: []
          },
          "no-team": {
            name: "No Team",
            players: currentScoreboard.teams?.["no-team"]?.players || []
          }
        }
      }

      game.set("scoreboard", updateData)
      $app.save(game)
      console.log("Scoreboard updated successfully with team:", teamName)
    } catch (error) {
      console.error("Error updating scoreboard:", error.message)
    }
  }

  return e.next()
}, "pbc_1514236743")

// Player creation hook
onRecordAfterCreateSuccess((e) => {
  console.log("=== PLAYER CREATED ===")
  console.log("Player ID:", e.record?.id)
  console.log("Game ID:", e.record?.get("game"))
  console.log("Team ID:", e.record?.get("team"))

  const gameId = e.record?.get("game")
  if (gameId) {
    console.log("=== UPDATING SCOREBOARD FOR GAME:", gameId, " ===")

    try {
      const game = $app.findRecordById("pbc_879072730", gameId)

      // Get current scoreboard or create new one
      let currentScoreboard = game.get("scoreboard") || {}

      // Player created - get player details
      const playerId = e.record?.id
      const playerRef = e.record?.get("player")
      const assignedTeamId = e.record?.get("team")

      let playerInfo = { id: playerId, name: "", email: "" }

      // Try to get player details if we have the player reference
      if (playerRef) {
        try {
          const playerRecord = $app.findRecordById("_pb_users_auth_", playerRef)
          playerInfo = {
            id: playerId,
            name: playerRecord.get("name") || "",
            email: playerRecord.get("email") || ""
          }
        } catch (playerError) {
          console.log("Could not fetch player details, using basic info")
        }
      }

      // Start with current teams structure
      let updatedTeams = { ...(currentScoreboard.teams || {}) }

      // Remove player from all teams and no-team first (to handle duplicates)
      Object.keys(updatedTeams).forEach(teamId => {
        if (updatedTeams[teamId].players) {
          updatedTeams[teamId].players = updatedTeams[teamId].players.filter(p => p.id !== playerId)
        }
      })

      // Add player to appropriate team
      if (assignedTeamId && assignedTeamId !== "") {
        // Player was created with a team assignment
        if (!updatedTeams[assignedTeamId]) {
          // Try to get the actual team name
          let teamName = "Unknown Team"
          try {
            const teamRecord = $app.findRecordById("pbc_1514236743", assignedTeamId)
            teamName = teamRecord.get("name") || "Unknown Team"
          } catch (teamError) {
            console.log("Could not fetch team details, using default name")
          }
          updatedTeams[assignedTeamId] = { name: teamName, players: [] }
        }
        if (!updatedTeams[assignedTeamId].players) {
          updatedTeams[assignedTeamId].players = []
        }
        updatedTeams[assignedTeamId].players.push(playerInfo)
        console.log("Player added to assigned team:", assignedTeamId)
      } else {
        // Player has no team - add to no-team
        if (!updatedTeams["no-team"]) {
          updatedTeams["no-team"] = { name: "No Team", players: [] }
        }
        if (!updatedTeams["no-team"].players) {
          updatedTeams["no-team"].players = []
        }
        updatedTeams["no-team"].players.push(playerInfo)
        console.log("Player added to no-team")
      }

      const updateData = {
        updated: new Date().toISOString(),
        teams: updatedTeams
      }

      game.set("scoreboard", updateData)
      $app.save(game)
      console.log("Scoreboard updated successfully with player:", playerInfo.email || playerId)
    } catch (error) {
      console.error("Error updating scoreboard:", error.message)
    }
  }

  return e.next()
}, "pbc_3826546831")

// Player update hook - handles when player joins/leaves teams
onRecordAfterUpdateSuccess((e) => {
  console.log("=== PLAYER UPDATED ===")
  console.log("Player ID:", e.record?.id)
  console.log("Game ID:", e.record?.get("game"))
  console.log("Team ID:", e.record?.get("team"))

  const gameId = e.record?.get("game")
  if (gameId) {
    console.log("=== UPDATING SCOREBOARD FOR PLAYER TEAM ASSIGNMENT:", gameId, " ===")

    try {
      const game = $app.findRecordById("pbc_879072730", gameId)
      const currentScoreboard = game.get("scoreboard") || { teams: {} }

      const playerId = e.record?.id
      const newTeamId = e.record?.get("team")
      const playerRef = e.record?.get("player")

      let playerInfo = { id: playerId, name: "", email: "" }

      // Get player details
      if (playerRef) {
        try {
          const playerRecord = $app.findRecordById("_pb_users_auth_", playerRef)
          playerInfo = {
            id: playerId,
            name: playerRecord.get("name") || "",
            email: playerRecord.get("email") || ""
          }
        } catch (playerError) {
          console.log("Could not fetch player details, using basic info")
        }
      }

      // Start with current teams structure
      let updatedTeams = { ...(currentScoreboard.teams || {}) }

      // Remove player from all teams and no-team first
      Object.keys(updatedTeams).forEach(teamId => {
        if (updatedTeams[teamId].players) {
          updatedTeams[teamId].players = updatedTeams[teamId].players.filter(p => p.id !== playerId)
        }
      })

      // Add player to appropriate team
      if (newTeamId && newTeamId !== "") {
        // Player joined a specific team
        if (!updatedTeams[newTeamId]) {
          // Try to get the actual team name
          let teamName = "Unknown Team"
          try {
            const teamRecord = $app.findRecordById("pbc_1514236743", newTeamId)
            teamName = teamRecord.get("name") || "Unknown Team"
          } catch (teamError) {
            console.log("Could not fetch team details, using default name")
          }
          updatedTeams[newTeamId] = { name: teamName, players: [] }
        }
        if (!updatedTeams[newTeamId].players) {
          updatedTeams[newTeamId].players = []
        }
        updatedTeams[newTeamId].players.push(playerInfo)
        console.log("Player added to team:", newTeamId)
      } else {
        // Player has no team - add to no-team
        if (!updatedTeams["no-team"]) {
          updatedTeams["no-team"] = { name: "No Team", players: [] }
        }
        if (!updatedTeams["no-team"].players) {
          updatedTeams["no-team"].players = []
        }
        updatedTeams["no-team"].players.push(playerInfo)
        console.log("Player added to no-team")
      }

      const updateData = {
        updated: new Date().toISOString(),
        teams: updatedTeams
      }

      game.set("scoreboard", updateData)
      $app.save(game)
      console.log("Scoreboard updated successfully for player team assignment")
    } catch (error) {
      console.error("Error updating scoreboard for player assignment:", error.message)
    }
  }

  return e.next()
}, "pbc_3826546831")

console.log("=== SCOREBOARD MANAGER HOOK LOADED ===")