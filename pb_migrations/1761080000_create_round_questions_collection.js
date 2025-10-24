/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Check if round_questions collection already exists and handle it gracefully
  try {
    const existingCollection = app.findCollectionByNameOrId("round_questions");
    if (existingCollection) {
      console.log("Round_questions collection already exists, skipping creation");
      return;
    }
  } catch (error) {
    console.log("Round_questions collection doesn't exist, creating new one");
  }

  // Step 1: Resolve ALL dependencies BEFORE creating the collection
  const usersCollection = app.findCollectionByNameOrId("_pb_users_auth_");
  if (!usersCollection) {
    throw new Error("Users collection not found. This collection must exist for authentication.");
  }

  const gamesCollection = app.findCollectionByNameOrId("games");
  if (!gamesCollection) {
    throw new Error("Games collection not found. Please ensure the games collection is created first.");
  }

  const questionsCollection = app.findCollectionByNameOrId("questions");
  if (!questionsCollection) {
    throw new Error("Questions collection not found. Please ensure the questions collection is created first.");
  }

  const roundsCollection = app.findCollectionByNameOrId("rounds");
  if (!roundsCollection) {
    throw new Error("Rounds collection not found. Please ensure the rounds collection is created first.");
  }

  // Step 2: Create the round_questions collection with dynamically resolved collection IDs
  const collection = new Collection({
    "createRule": "@request.auth.id!=''",  // Authenticated users can create round_questions
    "deleteRule": "host.id=@request.auth.id",  // Only round_question host can delete
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_round_question_id",
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
        "id": "relation_round_question_host",
        "collectionId": usersCollection.id,  // Dynamic resolution for users collection
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
        "id": "relation_round_question_game",
        "collectionId": gamesCollection.id,  // Dynamic resolution for games collection
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
        "id": "relation_round_question_question",
        "collectionId": questionsCollection.id,  // Dynamic resolution for questions collection
        "cascade": false,
        "minSelect": 1,
        "maxSelect": 1,
        "name": "question",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "relation_round_question_round",
        "collectionId": roundsCollection.id,  // Dynamic resolution for rounds collection
        "cascade": false,
        "minSelect": 1,
        "maxSelect": 1,
        "name": "round",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number_round_question_sequence",
        "max": 9999,
        "min": 0,
        "name": "sequence",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "text_round_question_category_name",
        "max": 255,
        "min": 1,
        "name": "category_name",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate_round_question_created",
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
        "id": "autodate_round_question_updated",
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
      "CREATE INDEX `idx_round_questions_host` ON `round_questions` (`host`)",
      "CREATE INDEX `idx_round_questions_game` ON `round_questions` (`game`)",
      "CREATE INDEX `idx_round_questions_round` ON `round_questions` (`round`)",
      "CREATE INDEX `idx_round_questions_question` ON `round_questions` (`question`)",
      "CREATE INDEX `idx_round_questions_sequence` ON `round_questions` (`round`, `sequence`)",
      "CREATE INDEX `idx_round_questions_host_game` ON `round_questions` (`host`, `game`)",
      "CREATE INDEX `idx_round_questions_created` ON `round_questions` (`created`)"
    ],
    "listRule": "host.id=@request.auth.id",  // Only host can list their own round_questions
    "name": "round_questions",
    "system": false,
    "type": "base",
    "updateRule": "host.id=@request.auth.id",  // Only round_question host can update
    "viewRule": "host.id=@request.auth.id"  // Only host can view their own round_questions
  });

  return app.save(collection);
}, (app) => {
  // Rollback - safely delete the round_questions collection
  const collection = app.findCollectionByNameOrId("round_questions");
  if (collection) {
    return app.delete(collection);
  }
})