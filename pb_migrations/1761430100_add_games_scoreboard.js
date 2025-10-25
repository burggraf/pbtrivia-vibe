/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("games")

  // add new field
  collection.add(
    "scoreboard",
    new SchemaField({
      type: "json",
      required: false,
      default: () => ({
        teams: {}
      })
    })
  )

  // update collection
  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("games")

  // remove field
  collection.remove("scoreboard")

  // update collection
  app.save(collection)
})