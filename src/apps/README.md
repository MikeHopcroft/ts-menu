## Generating Typescript Interfaces

~~~
node build\src\apps\generate-type-script.js
~~~

## Generating JSON Schema

~~~
typescript-json-schema src\processor\menu.ts Cart
~~~

## Converting a Test Suite

Also verifies that prixFixe

~~~
node build\src\apps\convert-test-suite.js -d samples\menu samples\tests\baseline.yaml 
~~~

## Generating Python Assets

* JSON test suite suitable LLM problems
  * Text based - no specific item keys like 163.2.5 or SKUs like 12345.
* JSON default product map
* TypeScript interfaces for inclusion in LLM prompts
* JSON schema for inclusion in LLM prompts
