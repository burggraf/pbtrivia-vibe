/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("games");

  if (!collection) {
    throw new Error("Games collection not found");
  }

  // Add proper access rules to allow authenticated users to access games
  collection.listRule = "1 = 1";
  collection.viewRule = "1 = 1";
  collection.createRule = "@request.auth.id != \"\" && @request.auth.id != null";
  collection.updateRule = "@request.auth.id = host && host != \"\"";
  collection.deleteRule = "@request.auth.id = host && host != \"\"";

  return app.save(collection);
}, (app) => {
  // Rollback - remove access rules
  const collection = app.findCollectionByNameOrId("games");
  if (collection) {
    collection.listRule = null;
    collection.viewRule = null;
    collection.createRule = null;
    collection.updateRule = null;
    collection.deleteRule = null;
    return app.save(collection);
  }
})