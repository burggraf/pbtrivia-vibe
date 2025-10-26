/// <reference path="../pb_data/types.d.ts" />

console.log("=== SCOREBOARD MANAGER HOOK LOADING ===")

// Team creation hook
onRecordAfterCreateSuccess((e) => {
  console.log("=== TEAM CREATED ===")
  console.log("Team ID:", e.record?.id)
  console.log("Game ID:", e.record?.get("game"))

  const gameId = e.record?.get("game")
  if (gameId) {
    console.log("=== REBUILDING SCOREBOARD FOR GAME:", gameId, " ===")

    try {
      const game = $app.findRecordById("pbc_879072730", gameId)

      // Start with empty teams structure
      let teams = {
        "no-team": {
          name: "No Team",
          players: []
        }
      }

      // Get all teams for this game
      try {
        const teamsRecords = $app.findRecordsByFilter("pbc_1514236743", `game="${gameId}"`)
        console.log("Found", teamsRecords.length, "teams for game")

        teamsRecords.forEach(team => {
          const teamId = team.id
          const teamName = team.get("name") || "Unknown Team"
          teams[teamId] = {
            name: teamName,
            players: []
          }
        })
      } catch (teamsError) {
        console.log("Error fetching teams:", teamsError.message)
      }

      // Get all players for this game
      try {
        const playersRecords = $app.findRecordsByFilter("pbc_3826546831", `game="${gameId}"`)
        console.log("Found", playersRecords.length, "player records for game")

        // Deduplicate players by user ID - keep the latest record for each user
        const uniquePlayers = {}
        playersRecords.forEach(player => {
          const playerRef = player.get("player")
          if (playerRef) {
            // If this user doesn't exist yet, or this record is newer, keep it
            if (!uniquePlayers[playerRef] || player.created > uniquePlayers[playerRef].created) {
              uniquePlayers[playerRef] = player
            }
          }
        })

        console.log("Found", Object.keys(uniquePlayers).length, "unique players for game")

        Object.values(uniquePlayers).forEach(player => {
          const playerRef = player.get("player")
          const assignedTeamId = player.get("team") || "no-team"

          let playerInfo = { id: playerRef, name: "", email: "" }

          // Get player details
          if (playerRef) {
            try {
              const playerRecord = $app.findRecordById("_pb_users_auth_", playerRef)
              playerInfo = {
                id: playerRef,
                name: playerRecord.get("name") || "",
                email: playerRecord.get("email") || ""
              }
            } catch (playerError) {
              console.log("Could not fetch details for player", playerRef)
            }
          }

          // Ensure the team exists
          if (!teams[assignedTeamId]) {
            teams[assignedTeamId] = {
              name: assignedTeamId === "no-team" ? "No Team" : "Unknown Team",
              players: []
            }
          }

          // Add player to their team
          teams[assignedTeamId].players.push(playerInfo)
          console.log("Added player", playerInfo.email || playerRef, "to team", assignedTeamId)
        })
      } catch (playersError) {
        console.log("Error fetching players:", playersError.message)
      }

      // Create the final scoreboard object
      const scoreboardData = {
        updated: new Date().toISOString(),
        teams: teams
      }

      // Save to game
      game.set("scoreboard", scoreboardData)
      $app.save(game)

      console.log("Scoreboard rebuilt successfully with", Object.keys(teams).length, "teams")
    } catch (error) {
      console.error("Error rebuilding scoreboard:", error.message)
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
    console.log("=== REBUILDING SCOREBOARD FOR GAME:", gameId, " ===")

    try {
      const game = $app.findRecordById("pbc_879072730", gameId)

      // Start with empty teams structure
      let teams = {
        "no-team": {
          name: "No Team",
          players: []
        }
      }

      // Get all teams for this game
      try {
        const teamsRecords = $app.findRecordsByFilter("pbc_1514236743", `game="${gameId}"`)
        console.log("Found", teamsRecords.length, "teams for game")

        teamsRecords.forEach(team => {
          const teamId = team.id
          const teamName = team.get("name") || "Unknown Team"
          teams[teamId] = {
            name: teamName,
            players: []
          }
        })
      } catch (teamsError) {
        console.log("Error fetching teams:", teamsError.message)
      }

      // Get all players for this game
      try {
        const playersRecords = $app.findRecordsByFilter("pbc_3826546831", `game="${gameId}"`)
        console.log("Found", playersRecords.length, "player records for game")

        // Deduplicate players by user ID - keep the latest record for each user
        const uniquePlayers = {}
        playersRecords.forEach(player => {
          const playerRef = player.get("player")
          if (playerRef) {
            // If this user doesn't exist yet, or this record is newer, keep it
            if (!uniquePlayers[playerRef] || player.created > uniquePlayers[playerRef].created) {
              uniquePlayers[playerRef] = player
            }
          }
        })

        console.log("Found", Object.keys(uniquePlayers).length, "unique players for game")

        Object.values(uniquePlayers).forEach(player => {
          const playerRef = player.get("player")
          const assignedTeamId = player.get("team") || "no-team"

          let playerInfo = { id: playerRef, name: "", email: "" }

          // Get player details
          if (playerRef) {
            try {
              const playerRecord = $app.findRecordById("_pb_users_auth_", playerRef)
              playerInfo = {
                id: playerRef,
                name: playerRecord.get("name") || "",
                email: playerRecord.get("email") || ""
              }
            } catch (playerError) {
              console.log("Could not fetch details for player", playerRef)
            }
          }

          // Ensure the team exists
          if (!teams[assignedTeamId]) {
            teams[assignedTeamId] = {
              name: assignedTeamId === "no-team" ? "No Team" : "Unknown Team",
              players: []
            }
          }

          // Add player to their team
          teams[assignedTeamId].players.push(playerInfo)
          console.log("Added player", playerInfo.email || playerRef, "to team", assignedTeamId)
        })
      } catch (playersError) {
        console.log("Error fetching players:", playersError.message)
      }

      // Create the final scoreboard object
      const scoreboardData = {
        updated: new Date().toISOString(),
        teams: teams
      }

      // Save to game
      game.set("scoreboard", scoreboardData)
      $app.save(game)

      console.log("Scoreboard rebuilt successfully with", Object.keys(teams).length, "teams")
    } catch (error) {
      console.error("Error rebuilding scoreboard:", error.message)
    }
  }

  return e.next()
}, "pbc_3826546831")

// Player update hook
onRecordAfterUpdateSuccess((e) => {
  console.log("=== PLAYER UPDATED ===")
  console.log("Player ID:", e.record?.id)
  console.log("Game ID:", e.record?.get("game"))
  console.log("Team ID:", e.record?.get("team"))

  const gameId = e.record?.get("game")
  if (gameId) {
    console.log("=== REBUILDING SCOREBOARD FOR GAME:", gameId, " ===")

    try {
      const game = $app.findRecordById("pbc_879072730", gameId)

      // Start with empty teams structure
      let teams = {
        "no-team": {
          name: "No Team",
          players: []
        }
      }

      // Get all teams for this game
      try {
        const teamsRecords = $app.findRecordsByFilter("pbc_1514236743", `game="${gameId}"`)
        console.log("Found", teamsRecords.length, "teams for game")

        teamsRecords.forEach(team => {
          const teamId = team.id
          const teamName = team.get("name") || "Unknown Team"
          teams[teamId] = {
            name: teamName,
            players: []
          }
        })
      } catch (teamsError) {
        console.log("Error fetching teams:", teamsError.message)
      }

      // Get all players for this game
      try {
        const playersRecords = $app.findRecordsByFilter("pbc_3826546831", `game="${gameId}"`)
        console.log("Found", playersRecords.length, "player records for game")

        // Deduplicate players by user ID - keep the latest record for each user
        const uniquePlayers = {}
        playersRecords.forEach(player => {
          const playerRef = player.get("player")
          if (playerRef) {
            // If this user doesn't exist yet, or this record is newer, keep it
            if (!uniquePlayers[playerRef] || player.created > uniquePlayers[playerRef].created) {
              uniquePlayers[playerRef] = player
            }
          }
        })

        console.log("Found", Object.keys(uniquePlayers).length, "unique players for game")

        Object.values(uniquePlayers).forEach(player => {
          const playerRef = player.get("player")
          const assignedTeamId = player.get("team") || "no-team"

          let playerInfo = { id: playerRef, name: "", email: "" }

          // Get player details
          if (playerRef) {
            try {
              const playerRecord = $app.findRecordById("_pb_users_auth_", playerRef)
              playerInfo = {
                id: playerRef,
                name: playerRecord.get("name") || "",
                email: playerRecord.get("email") || ""
              }
            } catch (playerError) {
              console.log("Could not fetch details for player", playerRef)
            }
          }

          // Ensure the team exists
          if (!teams[assignedTeamId]) {
            teams[assignedTeamId] = {
              name: assignedTeamId === "no-team" ? "No Team" : "Unknown Team",
              players: []
            }
          }

          // Add player to their team
          teams[assignedTeamId].players.push(playerInfo)
          console.log("Added player", playerInfo.email || playerRef, "to team", assignedTeamId)
        })
      } catch (playersError) {
        console.log("Error fetching players:", playersError.message)
      }

      // Create the final scoreboard object
      const scoreboardData = {
        updated: new Date().toISOString(),
        teams: teams
      }

      // Save to game
      game.set("scoreboard", scoreboardData)
      $app.save(game)

      console.log("Scoreboard rebuilt successfully with", Object.keys(teams).length, "teams")
    } catch (error) {
      console.error("Error rebuilding scoreboard:", error.message)
    }
  }

  return e.next()
}, "pbc_3826546831")

// Player delete hook
onRecordAfterDeleteSuccess((e) => {
  console.log("=== PLAYER DELETED ===")
  console.log("Player ID:", e.record?.id)
  console.log("Game ID:", e.record?.get("game"))

  const gameId = e.record?.get("game")
  if (gameId) {
    console.log("=== REBUILDING SCOREBOARD FOR GAME:", gameId, " ===")

    try {
      const game = $app.findRecordById("pbc_879072730", gameId)

      // Start with empty teams structure
      let teams = {
        "no-team": {
          name: "No Team",
          players: []
        }
      }

      // Get all teams for this game
      try {
        const teamsRecords = $app.findRecordsByFilter("pbc_1514236743", `game="${gameId}"`)
        console.log("Found", teamsRecords.length, "teams for game")

        teamsRecords.forEach(team => {
          const teamId = team.id
          const teamName = team.get("name") || "Unknown Team"
          teams[teamId] = {
            name: teamName,
            players: []
          }
        })
      } catch (teamsError) {
        console.log("Error fetching teams:", teamsError.message)
      }

      // Get all players for this game
      try {
        const playersRecords = $app.findRecordsByFilter("pbc_3826546831", `game="${gameId}"`)
        console.log("Found", playersRecords.length, "player records for game")

        // Deduplicate players by user ID - keep the latest record for each user
        const uniquePlayers = {}
        playersRecords.forEach(player => {
          const playerRef = player.get("player")
          if (playerRef) {
            // If this user doesn't exist yet, or this record is newer, keep it
            if (!uniquePlayers[playerRef] || player.created > uniquePlayers[playerRef].created) {
              uniquePlayers[playerRef] = player
            }
          }
        })

        console.log("Found", Object.keys(uniquePlayers).length, "unique players for game")

        Object.values(uniquePlayers).forEach(player => {
          const playerRef = player.get("player")
          const assignedTeamId = player.get("team") || "no-team"

          let playerInfo = { id: playerRef, name: "", email: "" }

          // Get player details
          if (playerRef) {
            try {
              const playerRecord = $app.findRecordById("_pb_users_auth_", playerRef)
              playerInfo = {
                id: playerRef,
                name: playerRecord.get("name") || "",
                email: playerRecord.get("email") || ""
              }
            } catch (playerError) {
              console.log("Could not fetch details for player", playerRef)
            }
          }

          // Ensure the team exists
          if (!teams[assignedTeamId]) {
            teams[assignedTeamId] = {
              name: assignedTeamId === "no-team" ? "No Team" : "Unknown Team",
              players: []
            }
          }

          // Add player to their team
          teams[assignedTeamId].players.push(playerInfo)
          console.log("Added player", playerInfo.email || playerRef, "to team", assignedTeamId)
        })
      } catch (playersError) {
        console.log("Error fetching players:", playersError.message)
      }

      // Create the final scoreboard object
      const scoreboardData = {
        updated: new Date().toISOString(),
        teams: teams
      }

      // Save to game
      game.set("scoreboard", scoreboardData)
      $app.save(game)

      console.log("Scoreboard rebuilt successfully with", Object.keys(teams).length, "teams")
    } catch (error) {
      console.error("Error rebuilding scoreboard:", error.message)
    }
  }

  return e.next()
}, "pbc_3826546831")

// Team delete hook
onRecordAfterDeleteSuccess((e) => {
  console.log("=== TEAM DELETED ===")
  console.log("Team ID:", e.record?.id)
  console.log("Game ID:", e.record?.get("game"))

  const gameId = e.record?.get("game")
  if (gameId) {
    console.log("=== REBUILDING SCOREBOARD FOR GAME:", gameId, " ===")

    try {
      const game = $app.findRecordById("pbc_879072730", gameId)

      // Start with empty teams structure
      let teams = {
        "no-team": {
          name: "No Team",
          players: []
        }
      }

      // Get all teams for this game
      try {
        const teamsRecords = $app.findRecordsByFilter("pbc_1514236743", `game="${gameId}"`)
        console.log("Found", teamsRecords.length, "teams for game")

        teamsRecords.forEach(team => {
          const teamId = team.id
          const teamName = team.get("name") || "Unknown Team"
          teams[teamId] = {
            name: teamName,
            players: []
          }
        })
      } catch (teamsError) {
        console.log("Error fetching teams:", teamsError.message)
      }

      // Get all players for this game
      try {
        const playersRecords = $app.findRecordsByFilter("pbc_3826546831", `game="${gameId}"`)
        console.log("Found", playersRecords.length, "player records for game")

        // Deduplicate players by user ID - keep the latest record for each user
        const uniquePlayers = {}
        playersRecords.forEach(player => {
          const playerRef = player.get("player")
          if (playerRef) {
            // If this user doesn't exist yet, or this record is newer, keep it
            if (!uniquePlayers[playerRef] || player.created > uniquePlayers[playerRef].created) {
              uniquePlayers[playerRef] = player
            }
          }
        })

        console.log("Found", Object.keys(uniquePlayers).length, "unique players for game")

        Object.values(uniquePlayers).forEach(player => {
          const playerRef = player.get("player")
          const assignedTeamId = player.get("team") || "no-team"

          let playerInfo = { id: playerRef, name: "", email: "" }

          // Get player details
          if (playerRef) {
            try {
              const playerRecord = $app.findRecordById("_pb_users_auth_", playerRef)
              playerInfo = {
                id: playerRef,
                name: playerRecord.get("name") || "",
                email: playerRecord.get("email") || ""
              }
            } catch (playerError) {
              console.log("Could not fetch details for player", playerRef)
            }
          }

          // Ensure the team exists
          if (!teams[assignedTeamId]) {
            teams[assignedTeamId] = {
              name: assignedTeamId === "no-team" ? "No Team" : "Unknown Team",
              players: []
            }
          }

          // Add player to their team
          teams[assignedTeamId].players.push(playerInfo)
          console.log("Added player", playerInfo.email || playerRef, "to team", assignedTeamId)
        })
      } catch (playersError) {
        console.log("Error fetching players:", playersError.message)
      }

      // Create the final scoreboard object
      const scoreboardData = {
        updated: new Date().toISOString(),
        teams: teams
      }

      // Save to game
      game.set("scoreboard", scoreboardData)
      $app.save(game)

      console.log("Scoreboard rebuilt successfully with", Object.keys(teams).length, "teams")
    } catch (error) {
      console.error("Error rebuilding scoreboard:", error.message)
    }
  }

  return e.next()
}, "pbc_1514236743")

console.log("=== SCOREBOARD MANAGER HOOK LOADED ===")