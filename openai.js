import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  let requests = 0;
  let keepGoing = true;

  while (keepGoing) {
    console.time("request");
    const response = await openai.chat.completions
      .create({
        messages: [{ role: "system", content: "What does HTTP status code 429 mean?" }],
        model: "gpt-3.5-turbo-1106",
      })
      .asResponse(); // to inspect the headers returned, see: https://github.com/openai/openai-node?tab=readme-ov-file#advanced-usage

    console.log("HTTP STATUS ", response.status);
    requests++;
    console.log("REQUESTS MADE ", requests);
    console.log(response.headers);

    if (response.status !== 200) {
      console.log("NON 200 HTTP STATUS ", response.status);
      console.log("BREAKING AND PRINTING HEADERS");
      console.log(response.headers);

      keepGoing = false;
      break;
    }

    console.timeEnd("request");
  }
}

main();
