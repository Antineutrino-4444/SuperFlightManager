# SuperFlightManager

A static web prototype for discovering official-source flight segments and automatically composing connection paths.

## What it includes

- Search by origin and destination.
- Filter by plane type, airline, alliance, transfer area, overnight layovers, latest arrival time, and stop count.
- Automatically combine official airline-published segments into custom paths, with price breakdowns shown as segment sums.
- Display direct official-source links for every flight segment.
- Display loyalty-mile and elite-credit information per segment.
- Convert USD fares into other currencies using the latest European Central Bank exchange rates when available.

## Important implementation note

This prototype intentionally models **official-source provenance** at the segment level: each segment contains a direct airline source URL and metadata intended to represent airline-published availability. It does **not** scrape live airline fares in real time, because production-grade live pricing from official airline sources generally requires airline APIs, agreements, or a backend ingestion process.

## Run locally

Because this repo is intentionally dependency-light, you can open `index.html` directly in a browser or serve it with a tiny static server, for example:

```bash
python -m http.server 4173
```

Then visit <http://localhost:4173>.
