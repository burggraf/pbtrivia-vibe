/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("games");

  if (!collection) {
    throw new Error("Games collection not found");
  }

  // Update the access rules to allow authenticated users to access games
  collection.listRule = "1 = 1";
  collection.viewRule = "1 = 1";
  collection.createRule = "@request.auth.id != \"\" && @request.auth.id != null";
  collection.updateRule = "@request.auth.id = host && host != \"\"";
  collection.deleteRule = "@request.auth.id = host && host != \"\"";

  return app.save(collection);
}, (app) => {
  // Rollback - remove the games collection entirely
  const collection = app.findCollectionByNameOrId("games");
  if (collection) {
    return app.delete(collection);
  }
})