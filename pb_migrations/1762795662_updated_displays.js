/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("displays")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = display_user",
    "deleteRule": "@request.auth.id = display_user",
    "updateRule": "@request.auth.id = display_user || available = true"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("displays")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "updateRule": ""
  }, collection)

  return app.save(collection)
})
