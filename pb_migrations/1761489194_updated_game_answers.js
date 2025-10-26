/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_wiCpLMqskd` ON `game_answers` (\n  `game_questions_id`,\n  `team`\n)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
