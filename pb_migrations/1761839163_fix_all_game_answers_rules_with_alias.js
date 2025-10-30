/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // Fix ALL rules to use :check alias for @collection.game_players queries
  const ruleWithAlias = "@request.auth.id != \"\" &&\n(\n  host = @request.auth.id ||\n  (\n    @collection.game_players:check.player ?= @request.auth.id &&\n    @collection.game_players:check.team ?= team &&\n    @collection.game_players:check.game ?= game\n  )\n)"

  unmarshal({
    "createRule": ruleWithAlias,
    "listRule": ruleWithAlias,
    "viewRule": ruleWithAlias,
    "updateRule": ruleWithAlias
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // Rollback to rules without alias
  const ruleWithoutAlias = "@request.auth.id != \"\" &&\n(\n  host = @request.auth.id ||\n  (\n    @collection.game_players.player ?= @request.auth.id &&\n    @collection.game_players.team ?= team &&\n    @collection.game_players.game ?= game\n  )\n)"

  unmarshal({
    "createRule": ruleWithoutAlias,
    "listRule": ruleWithoutAlias,
    "viewRule": ruleWithoutAlias,
    "updateRule": ruleWithoutAlias
  }, collection)

  return app.save(collection)
})
