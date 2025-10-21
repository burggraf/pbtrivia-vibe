/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("games");

  if (!collection) {
    throw new Error("Games collection not found");
  }

  // Use the exact PocketBase syntax without spaces
  collection.listRule = "1=1";  // Allow all authenticated users
  collection.viewRule = "1=1";  // Allow all authenticated users
  collection.createRule = "@request.auth.id!=''";  // Authenticated users can create
  collection.updateRule = "host.id=@request.auth.id";  // Only game host can update
  collection.deleteRule = "host.id=@request.auth.id";  // Only game host can delete

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