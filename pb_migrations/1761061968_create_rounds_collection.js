/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Check if rounds collection already exists
  try {
    const existingCollection = app.findCollectionByNameOrId("rounds");
    if (existingCollection) {
      app.delete(existingCollection);
      console.log("Existing rounds collection deleted, recreating with new schema");
    }
  } catch (error) {
    console.log("Rounds collection doesn't exist, creating new one");
  }

  // Get the games collection ID dynamically
  const gamesCollection = app.findCollectionByNameOrId("games");
  if (!gamesCollection) {
    throw new Error("Games collection not found. Please ensure the games collection is created first.");
  }

  // Create the rounds collection with all required fields
  const collection = new Collection({
    "createRule": "@request.auth.id!=''",  // Authenticated users can create rounds
    "deleteRule": "host.id=@request.auth.id",  // Only round host can delete
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_round_id",
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
        "id": "text_round_title",
        "max": 255,
        "min": 1,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number_round_question_count",
        "max": 100,
        "min": 1,
        "name": "question_count",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "json_round_categories",
        "name": "categories",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number_round_sequence",
        "max": 9999,
        "min": 1,
        "name": "sequence_number",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "relation_round_game",
        "collectionId": gamesCollection.id,  // Use dynamic games collection ID
        "cascade": false,
        "minSelect": 1,
        "maxSelect": 1,
        "name": "game",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "relation_round_host",
        "collectionId": "_pb_users_auth_",
        "cascade": false,
        "minSelect": 1,
        "maxSelect": 1,
        "name": "host",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "autodate_round_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate_round_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "autodate"
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_rounds_game` ON `rounds` (`game`)",
      "CREATE INDEX `idx_rounds_host` ON `rounds` (`host`)",
      "CREATE INDEX `idx_rounds_sequence` ON `rounds` (`game`, `sequence_number`)",
      "CREATE INDEX `idx_rounds_created` ON `rounds` (`created`)"
    ],
    "listRule": "host.id=@request.auth.id",  // Only host can list their own rounds
    "name": "rounds",
    "system": false,
    "type": "base",
    "updateRule": "host.id=@request.auth.id",  // Only round host can update
    "viewRule": "host.id=@request.auth.id"  // Only host can view their own rounds
  });

  return app.save(collection);
}, (app) => {
  // Rollback - delete the rounds collection
  const collection = app.findCollectionByNameOrId("rounds");
  if (collection) {
    return app.delete(collection);
  }
})