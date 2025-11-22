/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("game_questions")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "file3274582604",
    "maxSelect": 1,
    "maxSize": 5242880,
    "mimeTypes": [
      "audio/mpeg"
    ],
    "name": "audio_file",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select2031051962",
    "maxSelect": 1,
    "name": "audio_status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "none",
      "generating",
      "available",
      "failed"
    ]
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1062146226",
    "max": 0,
    "min": 0,
    "name": "audio_error",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("game_questions")

  // remove field
  collection.fields.removeById("file3274582604")

  // remove field
  collection.fields.removeById("select2031051962")

  // remove field
  collection.fields.removeById("text1062146226")

  return app.save(collection)
})
