/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1869854226")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number_round_question_sequence",
    "max": 9999,
    "min": 0,
    "name": "sequence",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1869854226")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number_round_question_sequence",
    "max": 9999,
    "min": 0,
    "name": "sequence",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
