/** Run deno run --allow-all --unstable ./index.ts and you should see the following output:

body used: false
{ json: { message: "Hello world!" } }
body used: true
TypeError: Input request's body is unusable.
    at new Request (deno:ext/fetch/23_request.js:325:17)
    at deno:ext/fetch/26_fetch.js:422:29
    at new Promise (<anonymous>)
    at fetch (deno:ext/fetch/26_fetch.js:418:20)
    at file:///Users/nicktaylor/dev/deno-request-demo/index.ts:18:34

 */
const firstRequest = new Request("https://post.deno.dev", {
  method: "POST",
  body: JSON.stringify({
    message: "Hello world!",
  }),
  headers: {
    "content-type": "application/json",
  },
});
const secondRequest = new Request('https://post.deno.dev', firstRequest);

try {
  console.log(`body used: ${firstRequest.bodyUsed}`)
  const firstResponse = await fetch(firstRequest)
  const firstJson = await firstResponse.json()
  console.log(firstJson)
  console.log(`body used: ${firstRequest.bodyUsed}`)

  const secondResponse = await fetch(secondRequest)
  const secondJson = await secondResponse.json() // 💥 boom!
  console.log(secondJson)
} catch (error) {
  console.error(error);
}
