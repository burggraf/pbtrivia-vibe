/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Delete the existing games collection if it exists
  try {
    const existingCollection = app.findCollectionByNameOrId("games");
    if (existingCollection) {
      app.delete(existingCollection);
    }
  } catch (error) {
    // Collection doesn't exist, which is fine
    console.log("Games collection doesn't exist, creating new one");
  }

  // Create a new games collection with simple, working access rules
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text1234567890",
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
        "id": "relation1234567891",
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
        "id": "text1234567892",
        "max": 255,
        "min": 1,
        "name": "name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567893",
        "max": 6,
        "min": 6,
        "name": "code",
        "pattern": "^[A-Z0-9]{6}$",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date1234567894",
        "name": "startdate",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "number1234567895",
        "max": 9999,
        "min": 1,
        "name": "duration",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "text1234567896",
        "max": 500,
        "min": 0,
        "name": "location",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1234567897",
        "maxSelect": 1,
        "maxValues": 1,
        "name": "status",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "setting-up",
          "ready",
          "in-progress",
          "completed"
        ]
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_games_host` ON `games` (`host`)",
      "CREATE INDEX `idx_games_startdate` ON `games` (`startdate`)",
      "CREATE INDEX `idx_games_status` ON `games` (`status`)",
      "CREATE UNIQUE INDEX `idx_games_code` ON `games` (`code`)"
    ],
    "listRule": null,
    "name": "games",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("games");
  if (collection) {
    return app.delete(collection);
  }
})