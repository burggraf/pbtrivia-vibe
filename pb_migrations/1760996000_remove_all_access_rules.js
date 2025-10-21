/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("games");

  if (!collection) {
    throw new Error("Games collection not found");
  }

  // Remove ALL access rules completely
  collection.listRule = null;
  collection.viewRule = null;
  collection.createRule = null;
  collection.updateRule = null;
  collection.deleteRule = null;

  return app.save(collection);
}, (app) => {
  // Rollback - this is the same as the forward migration
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