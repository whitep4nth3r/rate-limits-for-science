// You can also use CommonJS `require('@sentry/node')` instead of `import`
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://c3bad3d1cfbd0e123ca29ff16710ad70@o4505635661873152.ingest.sentry.io/4506585837142016",
  integrations: [new ProfilingIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

async function getArbitraryUser() {
  const response = await fetch("https://api.github.com/users/octocat");
  return response;
}

// Thanks https://flaviocopes.com/await-loop-javascript/
const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};

const makeLotsOfRequests = async (action, n) => {
  for (let i = 1; i <= n; i++) {
    const result = await action();

    // for the unauthenticated API, we may receive 429 or 403
    if (result.status === 429 || result.status === 403) {
      Sentry.captureException(`${result.status} received for call to GitHub`);
      // epoch time in seconds
      const resetInSeconds = result.headers.get("x-ratelimit-reset");

      if (resetInSeconds !== null) {
        const nowInSeconds = Math.round(new Date().valueOf() / 1000);
        const secondsToWait = resetInSeconds - nowInSeconds;

        // Retry only if we need to wait fewer than 5 seconds
        // we *could* be waiting for up to 60 minutes for the limit to reset
        if (secondsToWait < 5) {
          console.log("BREAKING AND WAITING FOR ", secondsToWait + " seconds");
          await wait(secondsToWait * 1000);
        } else {
          // provide useful feedback to user
          console.error(
            `HTTP ${result.status}: Sorry, try again later in ${Math.round(
              secondsToWait / 60,
            )} mins.`,
          );
          break;
        }
      }
    }
  }
};

await makeLotsOfRequests(getArbitraryUser, 100);
