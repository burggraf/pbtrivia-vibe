/// <reference path="../../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  // Add create rule to allow authenticated users to create game answers
  const createRule = {
    name: "allow authenticated create",
    rule: "(host != null && @request.auth.id != null && host.id = @request.auth.id)",
    action: "create"
  }

  // Add create rule to allow users to read game answers (for their own games)
  const readRule = {
    name: "allow host read game answers",
    rule: "(host != null && @request.auth.id != null && host.id = @request.auth.id) || game.id = @request.auth.id",
    action: "read"
  }

  // Add create rule to allow users to update game answers (for their own games)
  const updateRule = {
    name: "allow host update game answers",
    rule: "(host != null && @request.auth.id != null && host.id = @request.auth.id) || game.id = @request.auth.id",
    action: "update"
  }

  // Add create rule to allow users to delete game answers (for their own games)
  const deleteRule = {
    name: "allow host delete game answers",
    rule: "(host != null && @request.auth.id != null && host.id = @request.auth.id) || game.id = @request.auth.id",
    action: "delete"
  }

  // Add create rule to allow users to manage game answers (for their own games)
  const manageRule = {
    name: "allow host manage game answers",
    rule: "(host != null && @request.auth.id != null && host.id = @request.auth.id) || game.id = @request.auth.id",
    action: "manage"
  }

  // Update collection rules
  collection.createRule = createRule.rule
  collection.readRule = readRule.rule
  collection.updateRule = updateRule.rule
  collection.deleteRule = deleteRule.rule
  collection.manageRule = manageRule.rule

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2458582319")

  return app.save(collection)
})