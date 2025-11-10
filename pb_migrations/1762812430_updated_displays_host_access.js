/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("displays")

  // update collection data - allow host to update display metadata
  unmarshal({
    "updateRule": "@request.auth.id = display_user || available = true || @request.auth.id = host"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("displays")

  // rollback - remove host from update rule
  unmarshal({
    "updateRule": "@request.auth.id = display_user || available = true"
  }, collection)

  return app.save(collection)
})
