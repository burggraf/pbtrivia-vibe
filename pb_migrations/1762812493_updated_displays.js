/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_345224242")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id = display_user || available = true || @request.auth.id = host"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_345224242")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id = display_user || available = true"
  }, collection)

  return app.save(collection)
})
