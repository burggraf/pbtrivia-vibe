/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2837562276")

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4231605813",
    "max": 0,
    "min": 0,
    "name": "player_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1514236743",
    "hidden": false,
    "id": "relation694999214",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "team_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2411891325",
    "max": 0,
    "min": 0,
    "name": "team_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2837562276")

  // remove field
  collection.fields.removeById("text4231605813")

  // remove field
  collection.fields.removeById("relation694999214")

  // remove field
  collection.fields.removeById("text2411891325")

  return app.save(collection)
})
