# PocketBase Migration Best Practices

## CRITICAL RULE: NEVER HARDCODE COLLECTION IDS

**ALWAYS FOLLOW THIS RULE: NEVER hardcode collection IDs in PocketBase migrations - always resolve them dynamically.**

Hardcoded collection IDs like `"collectionId": "pbc_879072730"` cause "Missing collection context" errors because those IDs don't exist or change between environments.

## Collection Relations

When creating collections with relation fields, **NEVER** hardcode collection IDs. Always resolve them dynamically:

### ❌ BAD (will cause "Missing collection context" errors)
```js
{
  "type": "relation",
  "name": "game",
  "collectionId": "pbc_879072730",  // Hardcoded ID - WRONG!
}
```

### ✅ GOOD (dynamic resolution)
```js
// Get the games collection ID dynamically
const gamesCollection = app.findCollectionByNameOrId("games");
if (!gamesCollection) {
  throw new Error("Games collection not found. Please ensure the games collection is created first.");
}

{
  "type": "relation",
  "name": "game",
  "collectionId": gamesCollection.id,  // Dynamic resolution - CORRECT!
}
```

## Complete Migration Pattern

### Required Pattern for All Migrations with Relations:

```js
/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Step 1: Resolve ALL dependencies BEFORE creating the collection
  const gamesCollection = app.findCollectionByNameOrId("games");
  if (!gamesCollection) {
    throw new Error("Games collection not found. Please ensure the games collection is created first.");
  }

  const usersCollection = app.findCollectionByNameOrId("users");
  if (!usersCollection) {
    throw new Error("Users collection not found. Please ensure the users collection is created first.");
  }

  // Step 2: Create the collection with dynamically resolved collection IDs
  const collection = new Collection({
    "createRule": "@request.auth.id!=''",
    "deleteRule": "host.id=@request.auth.id",
    "fields": [
      // ... other fields
      {
        "type": "relation",
        "name": "game",
        "collectionId": gamesCollection.id, // Dynamic resolution - CORRECT!
        "maxSelect": 1,
        "minSelect": 1,
        "required": true,
        "cascade": false
      },
      {
        "type": "relation",
        "name": "host",
        "collectionId": usersCollection.id, // Dynamic resolution - CORRECT!
        "maxSelect": 1,
        "minSelect": 1,
        "required": true,
        "cascade": false
      }
      // ... more fields
    ],
    "name": "rounds",
    "type": "base"
  });

  return app.save(collection);
}, (app) => {
  // Rollback - safely delete the collection
  const collection = app.findCollectionByNameOrId("rounds");
  if (collection) {
    return app.delete(collection);
  }
});
```

## Migration Dependencies

### Multiple Relations Example

```js
migrate((app) => {
  // Resolve all dependencies in order
  const usersCollection = app.findCollectionByNameOrId("users");
  if (!usersCollection) {
    throw new Error("Users collection not found. This collection must be created first.");
  }

  const categoriesCollection = app.findCollectionByNameOrId("categories");
  if (!categoriesCollection) {
    throw new Error("Categories collection not found. This collection must be created first.");
  }

  const questionsCollection = app.findCollectionByNameOrId("questions");
  if (!questionsCollection) {
    throw new Error("Questions collection not found. This collection must be created first.");
  }

  // Now create the collection with all resolved dependencies
  const collection = new Collection({
    name: "game_sessions",
    fields: [
      {
        type: "relation",
        name: "player",
        collectionId: usersCollection.id,
        maxSelect: 1,
        required: true
      },
      {
        type: "relation",
        name: "category",
        collectionId: categoriesCollection.id,
        maxSelect: 1,
        required: true
      },
      {
        type: "relation",
        name: "questions",
        collectionId: questionsCollection.id,
        maxSelect: 10,
        required: true
      }
    ]
  });

  return app.save(collection);
});
```

## Error Prevention

1. **Always check if related collections exist** before creating relations
2. **Use descriptive error messages** when collections aren't found
3. **Order migrations properly** - dependent collections should be created first
4. **Validate all dependencies** before starting collection creation
5. **Use dynamic resolution for ALL relation fields**

## Migration File Naming

Use timestamped naming for proper order execution:
- Format: `{timestamp}_{description}.js`
- Example: `1761061968_create_rounds_collection.js`

## Common Issues

### "Missing collection context" Error
This error occurs when:
1. A relation field references a non-existent collection ID
2. Collection IDs are hardcoded incorrectly
3. The referenced collection was deleted or modified
4. Migration execution order is wrong (dependent collection not yet created)

### How to Debug
1. Check migration execution order
2. Verify all referenced collections exist
3. Ensure no hardcoded collection IDs
4. Check for typos in collection names

### Solution
Always use dynamic collection ID resolution as shown in the examples above.

## Best Practices Checklist

For every migration with relation fields:

- [ ] No hardcoded collection IDs anywhere in the file
- [ ] All dependencies resolved before collection creation
- [ ] Clear error messages for missing dependencies
- [ ] Proper migration file naming
- [ ] Comments explaining complex relations
- [ ] Rollback logic that handles collection deletion safely

## Special Collections

### User Collection (built-in)
```js
{
  "type": "relation",
  "name": "user",
  "collectionId": "_pb_users_auth_", // Built-in user collection ID
  // ... other config
}
```

### System Collections
Be careful with system collections - they may have fixed IDs that shouldn't be changed.