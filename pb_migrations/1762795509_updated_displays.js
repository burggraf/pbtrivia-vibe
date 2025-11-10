/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("displays")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool2777654405",
    "name": "available",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("displays")

  // remove field
  collection.fields.removeById("bool2777654405")

  return app.save(collection)
})
