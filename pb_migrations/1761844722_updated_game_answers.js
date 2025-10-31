/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // update collection data
  unmarshal({
    "updateRule": "host.id = @request.auth.id || game.host = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != \"\" &&\n(\n  host = @request.auth.id ||\n  (\n    @collection.game_players:check.player ?= @request.auth.id &&\n    @collection.game_players:check.team ?= team &&\n    @collection.game_players:check.game ?= game\n  )\n)"
  }, collection)

  return app.save(collection)
})
