/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "host.id=@request.auth.id",
    "listRule": "host.id=@request.auth.id",
    "updateRule": "host.id=@request.auth.id",
    "viewRule": "host.id=@request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
