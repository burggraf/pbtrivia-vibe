/// <reference path="../pb_data/types.d.ts" />

console.log("=== BOOTSTRAP HOOK LOADING ===")

onBootstrap((e) => {
  console.log("=== BOOTSTRAP HOOK FIRED! ===")
  console.log("App is available:", !!e.app)
  console.log("Hooks directory:", __hooks)
  return e.next()
})