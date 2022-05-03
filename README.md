# Serverless functions with node-fetch for Request vs. Edge functions with spec compliant deno's Request

For context, see https://github.com/remix-run/remix/issues/3003

It turns out deno is throwing because deno is spec compliant for `Request`. I did a minimal repro and since Remix is using `node-fetch`, there is something in there that is not spec compliant that masks the issue.

I'm simulating what this bit of code does in Remix

```javascript
function stripIndexParam(request) {
  let url = new URL(request.url);
  let indexValues = url.searchParams.getAll("index");
  url.searchParams.delete("index");
  let indexValuesToKeep = [];
  for (let indexValue of indexValues) {
    if (indexValue) {
      indexValuesToKeep.push(indexValue);
    }
  }
  for (let toKeep of indexValuesToKeep) {
    url.searchParams.append("index", toKeep);
  }
  return new Request(url.href, request);
}
function stripDataParam(request) {
  let url = new URL(request.url);
  url.searchParams.delete("_data");
  return new Request(url.href, request);
}

async function callRouteAction({
  loadContext,
  match,
  request
}) {
  ...

  let result;

  try {
    result = await action({
      request: stripDataParam(stripIndexParam(request)),
      context: loadContext,
      params: match.params
    });
  } catch (error) {
    if (!isResponse(error)) {
      throw error;
    }

  ...
}
```

Clear skies in Node.js with node-fetch

```javascript
/** Run node index.js and you should see the following output:

body used: false
{ json: { message: 'Hello world!' } }
body used: false
{ json: { message: 'Hello world!' } }

 */
(async () => {
  const { default: fetch, Request} = await import('node-fetch');
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
    console.log(`body used: ${firstRequest.bodyUsed}`);
    const firstResponse = await fetch(firstRequest);
    const firstJson = await firstResponse.json();
    console.log(firstJson);
    console.log(`body used: ${firstRequest.bodyUsed}`);

    const secondResponse = await fetch(secondRequest);
    const secondJson = await secondResponse.json(); // No boom. All good because secondResponse.bodyUsed is false.
    console.log(secondJson);
  } catch (error) {
    console.error(error);
  }
})();
```

Rough waters as expected in specs compliant land with deno and the native Request object.

```typescript
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
```