/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1869854226")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": true,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation_round_question_host",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "host",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_879072730",
    "hidden": false,
    "id": "relation_round_question_game",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "game",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_questions_collection",
    "hidden": false,
    "id": "relation_round_question_question",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "question",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_225224730",
    "hidden": false,
    "id": "relation_round_question_round",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "round",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1869854226")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation_round_question_host",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "host",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_879072730",
    "hidden": false,
    "id": "relation_round_question_game",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "game",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_questions_collection",
    "hidden": false,
    "id": "relation_round_question_question",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "question",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_225224730",
    "hidden": false,
    "id": "relation_round_question_round",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "round",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
