/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567890",
        "max": 255,
        "min": 0,
        "name": "external_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567891",
        "max": 255,
        "min": 1,
        "name": "category",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567892",
        "max": 255,
        "min": 1,
        "name": "subcategory",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1234567893",
        "maxSelect": 1,
        "maxValues": 1,
        "name": "difficulty",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "easy",
          "medium",
          "hard"
        ]
      },
      {
        "hidden": false,
        "id": "text1234567894",
        "max": 2000,
        "min": 1,
        "name": "question",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567895",
        "max": 500,
        "min": 1,
        "name": "answer_a",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567896",
        "max": 500,
        "min": 1,
        "name": "answer_b",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567897",
        "max": 500,
        "min": 1,
        "name": "answer_c",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567898",
        "max": 500,
        "min": 1,
        "name": "answer_d",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567899",
        "max": 100,
        "min": 0,
        "name": "level",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567900",
        "max": 1000,
        "min": 0,
        "name": "metadata",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate1234567901",
        "name": "imported_at",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_questions_collection",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_questions_external_id` ON `questions` (`external_id`) WHERE `external_id` != ''",
      "CREATE INDEX `idx_questions_category` ON `questions` (`category`)",
      "CREATE INDEX `idx_questions_difficulty` ON `questions` (`difficulty`)",
      "CREATE INDEX `idx_questions_imported_at` ON `questions` (`imported_at`)"
    ],
    "listRule": null,
    "name": "questions",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("questions");

  return app.delete(collection);
})