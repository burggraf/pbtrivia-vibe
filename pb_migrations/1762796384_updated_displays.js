/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("displays")

  // Resolve games collection ID dynamically
  const gamesCollection = app.findCollectionByNameOrId("games")

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": gamesCollection.id,
    "hidden": false,
    "id": "relation590033292",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "game",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("displays")

  // remove field
  collection.fields.removeById("relation590033292")

  return app.save(collection)
})
