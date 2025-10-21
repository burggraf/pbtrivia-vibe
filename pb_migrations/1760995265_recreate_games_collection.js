/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // First, try to delete the existing games collection if it exists
  try {
    const existingCollection = app.findCollectionByNameOrId("games");
    app.delete(existingCollection);
  } catch (error) {
    // Collection doesn't exist, which is fine
    console.log("Games collection doesn't exist, creating new one");
  }

  // Create the new games collection with proper access rules
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && @request.auth.id != null",
    "deleteRule": "@request.auth.id = host && host != ''",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text4214356329",
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
        "id": "relation4214356330",
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
        "id": "text4214356331",
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
        "id": "text4214356332",
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
        "id": "date4214356333",
        "name": "startdate",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "number4214356334",
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
        "id": "text4214356335",
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
        "id": "select4214356336",
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
    "listRule": "1 = 1",
    "name": "games",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = host && host != ''",
    "viewRule": "1 = 1"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("games");
  return app.delete(collection);
})