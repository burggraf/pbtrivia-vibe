/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n(\n  host = @request.auth.id ||\n  (\n    @collection.game_players.player ?= @request.auth.id &&\n    @collection.game_players.team ?= team &&\n    @collection.game_players.game ?= game\n  )\n)\n",
    "deleteRule": null,
    "listRule": "@request.auth.id != \"\" &&\n(\n  host = @request.auth.id ||\n  (\n    @collection.game_players.player ?= @request.auth.id &&\n    @collection.game_players.team ?= team &&\n    @collection.game_players.game ?= game\n  )\n)\n",
    "updateRule": null,
    "viewRule": "@request.auth.id != \"\" &&\n(\n  host = @request.auth.id ||\n  (\n    @collection.game_players.player ?= @request.auth.id &&\n    @collection.game_players.team ?= team &&\n    @collection.game_players.game ?= game\n  )\n)\n"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "(host != null && @request.auth.id != null && host.id = @request.auth.id) || game.id = @request.auth.id",
    "listRule": "host.id=@request.auth.id",
    "updateRule": "(host != null && @request.auth.id != null && host.id = @request.auth.id) || game.id = @request.auth.id",
    "viewRule": "host.id=@request.auth.id"
  }, collection)

  return app.save(collection)
})
