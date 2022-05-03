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
