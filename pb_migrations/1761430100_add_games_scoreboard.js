/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("games")

  // add new field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "json1234567890",
    "name": "scoreboard",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("games")

  // remove field
  collection.fields.removeById("json1234567890")

  return app.save(collection)
})