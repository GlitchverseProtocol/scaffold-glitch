import { expect, test } from "@playwright/test";

test("should get api response", async ({ request }) => {
  const helloRes = await request.get(`api/hello`);

  const hello = await helloRes.json();
  expect(hello.message).toEqual("Hello World!");
});
