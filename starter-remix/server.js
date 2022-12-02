const path = require("path");
const express = require("express");
const compression = require("compression");
const morgan = require("morgan");
const { createRequestHandler } = require("@remix-run/express");
const WebSocket = require("ws");

const BUILD_DIR = path.join(process.cwd(), "build");

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

app.all(
  "*",
  process.env.NODE_ENV === "development"
    ? (req, res, next) => {
        purgeRequireCache();

        return createRequestHandler({
          build: require(BUILD_DIR),
          mode: process.env.NODE_ENV,
        })(req, res, next);
      }
    : createRequestHandler({
        build: require(BUILD_DIR),
        mode: process.env.NODE_ENV,
      })
);
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

if (process.env["NODE_ENV"] !== "production") {
  const connectToRemixSocket = (cb, attempts = 0) => {
      const remixSocket = new WebSocket(`ws://127.0.0.1:8002`);

      remixSocket.once("open", () => {
          console.log("Connected to remix dev socket");

          cb(null, remixSocket);
      });

      remixSocket.once("error", (error) => {
          if (attempts < 3) {
              setTimeout(() => {
                  connectToRemixSocket(cb, attempts += 1);
              }, 1000);
          }
          else {
              cb(error, null);
          }
      });
  };

  connectToRemixSocket((error, remixSocket) => {
      if (error) {
          throw error;
      }

      const customSocket = new WebSocket.Server({ server });

      remixSocket.on("message", (message) => {
          customSocket.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                  client.send(message.toString());
              }
          });
      });
  });
}

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, but then you'll have to reconnect to databases/etc on each
  // change. We prefer the DX of this, so we've included it for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}
