# Hopple

A daily word game. Get from the start word to the goal by changing one letter at a time. Each step must be a valid word. You have two undos.

## Play locally

Open a terminal in this folder and run:

```sh
python -m http.server 8080
```

Open http://localhost:8080. Desktop uses your keyboard; phones show the game keyboard.

## Publish your update

1. Extract hopple-source.zip. It contains one folder named hopple, with index.html directly inside it.
2. In GitHub, replace the old ladderle source folder with this hopple folder. Avoid nesting either folder inside another.
3. In your existing Cloudflare Workers build settings, change the root directory from `/ladderle` to `/hopple`.
4. Leave the build command empty. Keep the existing deploy command:

```sh
npx wrangler deploy --assets . --name ladderle --compatibility-date 2026-10-23
```

The Worker name stays ladderle so your current hosting resource and URL continue to work. The website itself is Hopple.

5. Commit the update and deploy. Hard-refresh the live site after the deployment succeeds.

If you upload the contents of hopple directly at the repository root instead, use `/` as the Cloudflare root directory.

## Included files

- index.html and styles.css: page structure and appearance.
- js/: the six active game scripts, including the dictionary and solver.
- assets/: your river, frog and lily pad, plus the log and rock drawings.

Development scripts, tests and artwork notes are in the separate hopple-development.zip download. There is no build step or package installation needed to publish this folder. No analytics or advertising provider is loaded.

## Dictionary

The game accepts 3,262 four-letter words, including plurals and verb forms. Daily puzzles use a smaller familiar vocabulary for their intended solutions, while every accepted word remains available for your own route.

The expansion uses lowercase SCOWL-derived Hunspell entries and their explicitly listed inflections, with project additions such as MOGS. Source notices are included in SCOWL-Copyright.txt. No dictionary download is required when playing.

## Pixel theme

The logo uses a lily pad in place of the o. The original Hopple Pixel display font is bundled locally in assets/hopple-pixel.woff; there are no external font requests. The log labels and long instructions keep a readable system font. The frog turns toward the river before crossing on a win; reduced-motion users go directly to results.
