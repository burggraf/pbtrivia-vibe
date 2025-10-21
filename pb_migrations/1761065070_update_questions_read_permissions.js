/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("questions");

  if (!collection) {
    throw new Error("Questions collection not found");
  }

  // Allow authenticated users to read questions for categories access
  // Keep write operations restricted to superusers only
  collection.listRule = "@request.auth.id!=''";  // Authenticated users can list questions
  collection.viewRule = "@request.auth.id!=''";  // Authenticated users can view questions
  collection.createRule = null;  // Only superusers can create questions
  collection.updateRule = null;  // Only superusers can update questions
  collection.deleteRule = null;  // Only superusers can delete questions

  return app.save(collection);
}, (app) => {
  // Rollback - restore original restrictive permissions
  const collection = app.findCollectionByNameOrId("questions");
  if (collection) {
    collection.listRule = null;
    collection.viewRule = null;
    collection.createRule = null;
    collection.updateRule = null;
    collection.deleteRule = null;
    return app.save(collection);
  }
})