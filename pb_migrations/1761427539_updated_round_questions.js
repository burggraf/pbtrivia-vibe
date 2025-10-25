/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1869854226")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_round_questions_host` ON `game_questions` (`host`)",
      "CREATE INDEX `idx_round_questions_game` ON `game_questions` (`game`)",
      "CREATE INDEX `idx_round_questions_round` ON `game_questions` (`round`)",
      "CREATE INDEX `idx_round_questions_question` ON `game_questions` (`question`)",
      "CREATE INDEX `idx_round_questions_sequence` ON `game_questions` (\n  `round`,\n  `sequence`\n)",
      "CREATE INDEX `idx_round_questions_host_game` ON `game_questions` (\n  `host`,\n  `game`\n)",
      "CREATE INDEX `idx_round_questions_created` ON `game_questions` (`created`)"
    ],
    "name": "game_questions"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1869854226")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_round_questions_host` ON `round_questions` (`host`)",
      "CREATE INDEX `idx_round_questions_game` ON `round_questions` (`game`)",
      "CREATE INDEX `idx_round_questions_round` ON `round_questions` (`round`)",
      "CREATE INDEX `idx_round_questions_question` ON `round_questions` (`question`)",
      "CREATE INDEX `idx_round_questions_sequence` ON `round_questions` (`round`, `sequence`)",
      "CREATE INDEX `idx_round_questions_host_game` ON `round_questions` (`host`, `game`)",
      "CREATE INDEX `idx_round_questions_created` ON `round_questions` (`created`)"
    ],
    "name": "round_questions"
  }, collection)

  return app.save(collection)
})
