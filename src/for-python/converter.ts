import {createWorld, LogicalValidationSuite, TextTurn} from 'prix-fixe';

import {createLLMProducts} from './llmCatalog';
import {PrixFixeToLLM, PythonItem, PythonTestSuite} from './prefixe-to-json';
import {PrixFixeToTS} from './prefixe-to-typescript';

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
