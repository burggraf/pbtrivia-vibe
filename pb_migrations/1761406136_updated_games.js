/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_879072730")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select1234567897",
    "maxSelect": 1,
    "name": "status",
    "presentable": true,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "ready",
      "in-progress",
      "completed",
      "setup"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_879072730")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select1234567897",
    "maxSelect": 1,
    "name": "status",
    "presentable": true,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "setting-up",
      "ready",
      "in-progress",
      "completed",
      "setup"
    ]
  }))

  return app.save(collection)
})
