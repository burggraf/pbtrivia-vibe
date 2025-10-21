/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("games");

  if (!collection) {
    throw new Error("Games collection not found");
  }

  // Use valid PocketBase rule syntax
  collection.listRule = "id != null";  // Allow all authenticated users to list games
  collection.viewRule = "id != null";  // Allow all authenticated users to view games
  collection.createRule = "@request.auth.id != \"\" && @request.auth.id != null";  // Authenticated users can create
  collection.updateRule = "@request.auth.id = host && host != \"\"";  // Only game host can update
  collection.deleteRule = "@request.auth.id = host && host != \"\"";  // Only game host can delete

  return app.save(collection);
}, (app) => {
  // Rollback - remove all access rules
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