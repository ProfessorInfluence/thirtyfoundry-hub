# ThirtyFoundry hub

A zero-dependency Node site that reads `../tracker/roadmap.json` and `../tracker/progress.json` on every request. Progress entries override roadmap slots. A launched product (`status: "live"`) gets a detail route at `/apps/<id>` and its free-trial URL; unavailable app URLs are ordinary links and cannot crash the hub.

```sh
npm install
npm start
```

Open `http://localhost:3000`. Use `PORT` and `PUBLIC_URL` to configure deployment. Run `npm test` for the smoke tests. Production can deploy this Node service directly or pre-render it as static output.
