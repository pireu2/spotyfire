import { stackServerApp } from "./src/stack/server";
async function run() {
  console.log("Keys on stackServerApp:", Object.keys(stackServerApp));
  console.log("Has createUser?", "createUser" in stackServerApp);
}
run();
