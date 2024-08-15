import pf, {
  cartFromlogicalCart,
  CatalogSpec,
  GenericCase,
  LogicalValidationSuite,
  TextTurn,
  ValidationStep,
} from 'prix-fixe';

import {Product} from './llmCatalog';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// type Item = Record<string, any>;
// import {Item} from './menu-python';

export interface PythonTestSuite {
  cases: PythonTestCase[];
}

interface PythonTestCase {
  turns: PythonTestTurn[];
}

interface PythonTestTurn {
  query: string;
  expected: PythonCart;
}

interface PythonCart {
  items: PythonItem[];
}

export type PythonItem = {
  name: string;
  quantity: number;
  options?: PythonItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>;

// TODO: eliminate Item?
type Item = PythonItem;

export class PrixFixeToLLM {
  world: pf.World;
  catalogSpec: CatalogSpec;
  nameToProduct: Map<string, Product>;
  attributeInfo: pf.AttributeInfo;
  catalog: pf.ICatalog;
  genericNameToTag: Map<string, string>;
  friendlyAttributeNames: Map<string, string>;
  counter = 0;

  constructor(
    world: pf.World,
    catalogSpec: CatalogSpec,
    nameToProduct: Map<string, Product>,
    genericNameToTag: Map<string, string>,
    friendlyAttributeNames: Map<string, string>
  ) {
    this.world = world;
    this.catalogSpec = catalogSpec;
    this.nameToProduct = nameToProduct;
    this.attributeInfo = world.attributeInfo;
    this.catalog = world.catalog;
    this.genericNameToTag = genericNameToTag;
    this.friendlyAttributeNames = friendlyAttributeNames;

    this.convertItem = this.convertItem.bind(this);
    this.convertTestCase = this.convertTestCase.bind(this);
  }

  createDefaults(): Record<string, Item> {
    const nameToDefault: Record<string, Item> = {};
    for (const g of this.catalog.genericEntities()) {
      const item = {...this.itemFromKey(g.defaultKey), quantity: 1};
      nameToDefault[g.name] = item;
    }
    return nameToDefault;
  }

  convertTestSuite(suite: LogicalValidationSuite<TextTurn>): PythonTestSuite {
    const cases = [...getTestCases(suite)].map(this.convertTestCase);
    return {cases};
  }

  private convertTestCase(
    test: GenericCase<ValidationStep<TextTurn>>
  ): PythonTestCase {
    const turns = test.steps.map(step => {
      const query = step.turns[0].transcription;
      const cart = cartFromlogicalCart(step.cart, this.catalog);
      const expected = this.convertCart(cart);
      return {query, expected};
    });
    return {turns};
  }

  private convertCart(pfCart: pf.Cart): PythonCart {
    return {items: pfCart.items.map(this.convertItem)};
  }

  private convertItem(pfItem: pf.ItemInstance): Item {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item: Record<string, any> = {
      ...this.itemFromKey(pfItem.key),
      quantity: pfItem.quantity,
    };

    if (pfItem.children && pfItem.children.length) {
      const options = pfItem.children.map(this.convertItem);
      item.options = options;
    }
    return item as Item;
  }

  private itemFromKey(key: string): Item {
    const generic = this.catalog.getGenericForKey(key);
    const type = this.genericNameToTag.get(generic.name);
    if (type === undefined) {
      throw new Error(`Unknown generic ${generic.name}.`);
    }
    const name = generic.name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item: Record<string, any> = {
      name,
    };

    const tensor = this.attributeInfo.getTensorForEntity(generic.pid);
    const fields = key.split(':').map(parseBase10Int);
    fields.shift();
    for (const [i, field] of fields.entries()) {
      const property = this.friendlyAttributeNames.get(
        tensor.dimensions[i].name
      );
      if (property === undefined) {
        throw new Error(`No friendly name for ${tensor.dimensions[i].name}.`);
      }
      const value = tensor.dimensions[i].attributes[field].name;
      item[property] = value;
    }

    return item as Item;
  }
}

// Borrowed from prix-fixe
function parseBase10Int(text: string): number {
  const n = Number.parseInt(text, 10);
  if (isNaN(n)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const message = `Invalid number ${text}.`;
  }
  return n;
}

function* getTestCases(
  suite: LogicalValidationSuite<TextTurn>
): Generator<GenericCase<ValidationStep<TextTurn>>> {
  for (const test of suite.tests) {
    if ('id' in test) {
      yield test;
    } else {
      console.log(`=== ${test.comment} ===`);
      yield* getTestCases(test);
    }
  }
}
