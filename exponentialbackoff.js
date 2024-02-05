const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function doRetriesWithBackOff() {
  let retries = 0;
  let retry = true;

  do {
    // first wait is ZERO
    // 2^0 = 1
    // 1 - 1 = 0
    // 0 * 100 = 0
    const waitInMilliseconds = (Math.pow(2, retries) - 1) * 100;

    await sleep(waitInMilliseconds);

    const response = await fetch("https://king-prawn-app-wwvho.ondigitalocean.app/");

    switch (response.status) {
      // Success
      case 200:
        retry = false;
        console.log("successful");
        break;
      // Throttling, timeouts
      case 429: // Too Many Requests
        console.log("retrying");
        retries++;
        retry = true;
        break;
      // Some other error occurred, so stop calling the API
      default:
        console.log("stopping");
        retries++;
        retry = false;
        Sentry.captureException(`${response.status} received for rate limited API call`)
        break;
    }
  } while (retry && retries < MAX_RETRIES);
}

// For testing purposes
for (let i = 0; i < 500; i++) {
  await doRetriesWithBackOff();
}
