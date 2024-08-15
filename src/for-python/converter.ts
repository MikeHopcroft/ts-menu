import {createWorld, LogicalValidationSuite, TextTurn} from 'prix-fixe';

import {createLLMProducts} from './llmCatalog';
import {PrixFixeToLLM} from './prefixe-to-json';
import {PrixFixeToTS} from './prefixe-to-typescript';
import {PythonItem, PythonTestSuite} from './python-test-suite';

///////////////////////////////////////////////////////////////////////////////
//
// Converter
//
// In the context of a given prix-fixe menu,
//
//   * Generates mapping from product name to default configuration.
//   * Generates Typescript interface definitions for menu.
//   * Converts prix-fixe test suite to form suitable for use with LLMs.
//
///////////////////////////////////////////////////////////////////////////////
export class Converter {
  prixFixeToLLM: PrixFixeToLLM;
  prixFixeToTS: PrixFixeToTS;

  constructor(dataPath: string, friendlyAttributeNames: Map<string, string>) {
    const world = createWorld(dataPath);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {catalogSpec, nameToProduct, genericNameToTag} =
      createLLMProducts(dataPath);

    this.prixFixeToLLM = new PrixFixeToLLM(
      world,
      catalogSpec,
      nameToProduct,
      genericNameToTag,
      friendlyAttributeNames
    );

    this.prixFixeToTS = new PrixFixeToTS(
      catalogSpec,
      nameToProduct,
      friendlyAttributeNames
    );
  }

  createDefaults(): Record<string, PythonItem> {
    return this.prixFixeToLLM.createDefaults();
  }

  convertTestSuite(suite: LogicalValidationSuite<TextTurn>): PythonTestSuite {
    return this.prixFixeToLLM.convertTestSuite(suite);
  }

  createTypeScriptMenu(): string {
    return this.prixFixeToTS.generateTypescriptTypes();
  }
}
