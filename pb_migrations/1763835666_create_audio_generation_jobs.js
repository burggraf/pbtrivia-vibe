/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Resolve games collection ID dynamically
  const gamesCollection = app.findCollectionByNameOrId("games");
  if (!gamesCollection) {
    throw new Error("games collection not found");
  }

  const collection = new Collection({
    "name": "audio_generation_jobs",
    "type": "base",
    "system": false,
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
        "cascadeDelete": true,
        "collectionId": gamesCollection.id,
        "hidden": false,
        "id": "relation590033291",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "game",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select1579384326",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["pending", "processing", "completed", "failed"]
      },
      {
        "hidden": false,
        "id": "number1326724116",
        "max": 100,
        "min": 0,
        "name": "progress",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1326724117",
        "min": 0,
        "name": "total_questions",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1326724118",
        "min": 0,
        "name": "processed_questions",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "json1326724119",
        "maxSize": 0,
        "name": "failed_questions",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number1326724120",
        "min": 0,
        "name": "current_api_key_index",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_job_status` ON `audio_generation_jobs` (`status`)",
      "CREATE INDEX `idx_job_game` ON `audio_generation_jobs` (`game`)"
    ],
    "listRule": "@request.auth.id != '' && game.host.id = @request.auth.id",
    "viewRule": "@request.auth.id != '' && game.host.id = @request.auth.id",
    "createRule": "@request.auth.id != '' && game.host.id = @request.auth.id",
    "updateRule": null,
    "deleteRule": "@request.auth.id != '' && game.host.id = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  // Rollback: delete collection
  const collection = app.findCollectionByNameOrId("audio_generation_jobs");
  if (collection) {
    return app.delete(collection);
  }
});
