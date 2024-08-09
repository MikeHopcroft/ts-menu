Python ML Project TODO

* Remove `type` from `Product`
* Make Cart.items be an array of `Product`.
* Move `quantity` into `Product`.
  * QUESTION: will this cause too many repetitions of `quantity`?
* Regenerate TS type definitions
* Regenerate JSON schema
* Convert regression tests to new format (PrixFixeToLLM)
* Update LLMToPrixFixe
* Emit mapping from Product.name to default object.
* Write some documentation for this branch

-------------------------------------------------

* Name for LLMCart
* Translate
  * prix-fixe Cart => LLMCart
  * LLMCart => prix-fixe cart
* LLMProcessor
  * Templated by LLMCart type


* x Espressos shouldn't have Milks
* x Product vs option
* x BakeryOptions and BakeryPrepartions
* console.log('skip')
* Sorting?
* x here-or-to-go tagging
* x exclusives
* x pretty printing



* Extensions
* Code spaces
* Steps
* .env file
* Copy over menu files (or find in prix-fixe)
* Load menu

~~~
mkdir typechat-menu
cd typechat-menu
npx gts init --npm
git init
REM clean up code in src/index.ts
REM create .gitignore
REM commit
REM
npm install prix-fixe

~~~
