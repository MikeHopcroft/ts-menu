# Menu Type System

This code generates TypeScript types from [prix-fixe](https://www.npmjs.com/package/prix-fixe) menus.

## Generating Types from Menus

You can build and run this code locally, but we recommend [GitHub Codespaces](https://docs.github.com/en/codespaces/overview).

Once you have your development environment configured, build the code with `npm run build` or `tsc --watch`.

Run the script with `node build/src/index.js`. This code will read the menu at `samples/menu/menu.yaml` and print Typescript to standard out.

## Menu Resources

You can read more about the menu structure in the [Interactive Menu Explorer Tutorial](https://github.com/MikeHopcroft/PrixFixe/blob/HEAD/documentation/repl.md) and [Prix Fixe Concepts](https://github.com/MikeHopcroft/PrixFixe/blob/HEAD/documentation/menu_concepts.md).