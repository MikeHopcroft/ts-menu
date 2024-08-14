import pf, {
  cartFromlogicalCart,
  createWorld,
  GenericCase,
  ICatalog,
  loadLogicalValidationSuite,
  LogicalCart,
  LogicalValidationSuite,
  TensorDescription,
  TextTurn,
  ValidationStep,
} from 'prix-fixe';

// import pf, {
//   IdGenerator,
//   TensorEntityBuilder,
// } from 'prix-fixe';

import {Cart, Item} from '../for-python/menu-python';
import {createLLMProducts} from '../processor/llmCatalog';

interface PythonTestSuite {
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

type PythonItem = {
  name: string;
  quantity: number;
  options?: PythonItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>;

function* getTestCases(
  suite: LogicalValidationSuite<TextTurn>
): Generator<GenericCase<ValidationStep<TextTurn>>> {
  //
  // const a = suite.tests[0];
  for (const test of suite.tests) {
    if ('id' in test) {
      yield test;
    } else {
      console.log(`=== ${test.comment} ===`);
      yield* getTestCases(test);
    }
  }
}

// function convertCart(cart: LogicalCart): PythonCart {
//   return {items: []};
// }

// function convertTestCase(
//   test: GenericCase<ValidationStep<TextTurn>>
// ): PythonTestCase {
//   const turns = test.steps.map(step => {
//     const query = step.turns[0].transcription;
//     const expected = convertCart(step.cart);
//     return {query, expected};
//   });
//   return {turns};
// }

// function convertTestSuite(
//   suite: LogicalValidationSuite<TextTurn>
// ): PythonTestSuite {
//   const filter = new Set([1, 45]);
//   const cases = [];

//   for (const test of getTestCases(suite)) {
//     if (!filter.has(test.id)) {
//       continue;
//     }
//     if (test.steps.length === 1) {
//       console.log(`${test.id}: ${test.steps[0].turns[0].transcription}`);
//     } else {
//       console.log(`${test.id}:`);
//       for (const [i, step] of test.steps.entries()) {
//         const label = String.fromCharCode('a'.charCodeAt(0) + i);
//         console.log(`  ${label}: ${step.turns[0].transcription}`);
//       }
//     }
//     cases.push(convertTestCase(test));
//   }
//   return {cases};
// }

export class PrixFixeToLLM {
  attributeInfo: pf.AttributeInfo;
  catalog: pf.ICatalog;
  world: pf.World;
  genericNameToTag: Map<string, string>;
  tagToAttributeNames: Map<string, string[]>;
  counter = 0;

  constructor(
    world: pf.World,
    genericNameToTag: Map<string, string>,
    tagToAttributeNames: Map<string, string[]>
  ) {
    this.world = world;
    this.attributeInfo = world.attributeInfo;
    this.catalog = world.catalog;
    this.genericNameToTag = genericNameToTag;
    this.tagToAttributeNames = tagToAttributeNames;

    this.convertItem = this.convertItem.bind(this);
    this.convertTestCase = this.convertTestCase.bind(this);
  }

  createDefaults(): Record<string, Item> {
    const nameToDefault: Record<string, Item> = {};
    for (const g of this.catalog.genericEntities()) {
      // console.log(`aaa ${g.defaultKey}: ${g.name}`);
      const item = {...this.itemFromKey(g.defaultKey), quantity: 1};
      nameToDefault[g.name] = item;
    }
    // console.log(JSON.stringify(nameToDefault, null, 2));
    return nameToDefault;
  }

  convertTestSuite(suite: LogicalValidationSuite<TextTurn>): PythonTestSuite {
    // const filter = new Set([1, 45]);
    const cases = [...getTestCases(suite)].map(this.convertTestCase);

    // for (const test of getTestCases(suite)) {
    //   if (!filter.has(test.id)) {
    //     continue;
    //   }
    //   if (test.steps.length === 1) {
    //     console.log(`${test.id}: ${test.steps[0].turns[0].transcription}`);
    //   } else {
    //     console.log(`${test.id}:`);
    //     for (const [i, step] of test.steps.entries()) {
    //       const label = String.fromCharCode('a'.charCodeAt(0) + i);
    //       console.log(`  ${label}: ${step.turns[0].transcription}`);
    //     }
    //   }
    //   cases.push(this.convertTestCase(test));
    // }
    return {cases};
  }

  convertTestCase(test: GenericCase<ValidationStep<TextTurn>>): PythonTestCase {
    const turns = test.steps.map(step => {
      const query = step.turns[0].transcription;
      const cart = cartFromlogicalCart(step.cart, this.catalog);
      const expected = this.convertCart(cart);
      return {query, expected};
    });
    return {turns};
  }

  convertCart(pfCart: pf.Cart): PythonCart {
    // // console.log('===============================');
    // if (this.counter === 17) {
    //   console.log('here');
    // }
    // console.log(`${this.counter++}: ===============================`);
    // console.log(JSON.stringify(pfCart, null, 2));
    // console.log('+++++');
    // const cart = {items: pfCart.items.map(this.convertItem)};
    // console.log(JSON.stringify(cart, null, 2));
    // return cart;

    return {items: pfCart.items.map(this.convertItem)};
  }

  private convertItem(pfItem: pf.ItemInstance): Item {
    const item: {[key: string]: any} = {
      ...this.itemFromKey(pfItem.key),
      quantity: pfItem.quantity,
    }; // as Item;
    // const generic = this.catalog.getGenericForKey(pfItem.key);
    // const type = this.genericNameToTag.get(generic.name);
    // if (type === undefined) {
    //   throw new Error(`Unknown generic ${generic.name}.`);
    // }
    // const name = generic.name;
    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // const item: {[key: string]: any} = {
    //   name,
    //   quantity: pfItem.quantity,
    // };

    // const tensor = this.attributeInfo.getTensorForEntity(generic.pid);
    // const fields = pfItem.key.split(':').map(parseBase10Int);
    // fields.shift();
    // const properties = tagToAttributeNames.get(type);
    // if (properties === undefined) {
    //   throw new Error();
    // }
    // for (const [i, field] of fields.entries()) {
    //   const property = properties[i];
    //   const value = tensor.dimensions[i].attributes[field].name;
    //   item[property] = value;
    // }

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
    const item: {[key: string]: any} = {
      name,
    };

    const tensor = this.attributeInfo.getTensorForEntity(generic.pid);
    const fields = key.split(':').map(parseBase10Int);
    fields.shift();
    const properties = tagToAttributeNames.get(type);
    if (properties === undefined) {
      throw new Error();
    }
    for (const [i, field] of fields.entries()) {
      const property = properties[i];
      const value = tensor.dimensions[i].attributes[field].name;
      item[property] = value;
    }

    return item as Item;
  }
  // private getTensor(
  //   tensors: pf.TensorDescription[],
  //   tid: pf.TID
  // ): TensorDescription {
  //   for (const t of tensors) {
  //     if (t.tid === tid) {
  //       return t;
  //     }
  //   }
  //   throw new Error(`TID ${tid} not found.`);
  // }
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

///////////////////////////////////////////////////////////////////////////////
//
// Converter application below
//
///////////////////////////////////////////////////////////////////////////////

const tagToAttributeNames = new Map<string, string[]>([
  ['BakeryProducts', []],
  ['BakeryOptions', ['amount']],
  ['BakeryPreparations', []],
  ['LatteDrinks', ['temperature', 'size']],
  ['EspressoDrinks', ['temperature', 'size']],
  ['CoffeeDrinks', ['temperature', 'size']],
  ['Syrups', ['amount']],
  ['Caffeines', []],
  ['Milks', []],
  ['Creamers', []],
  ['Toppings', ['amount']],
  ['LattePreparations', []],
  ['Sweeteners', ['amount']],
]);

// function createDefaults(catalog: ICatalog) {
//   for (const g of catalog.genericEntities()) {
//     console.log(`${g.defaultKey}: ${g.name}`);
//   }
// }

// function go() {
//   const dataPath = 'samples/menu';
//   const world = createWorld(dataPath);
//   createDefaults(world.catalog);
// }

function go() {
  // const filter = new Set([1, 45]);
  const pfSuite = loadLogicalValidationSuite<TextTurn>(
    'samples/tests/baseline.yaml'
  );

  const dataPath = 'samples/menu';
  const world = createWorld(dataPath);
  // console.log(JSON.stringify(suite, null, 2));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {catalog, nameToProduct, genericNameToTag} =
    createLLMProducts(dataPath);

  const converter = new PrixFixeToLLM(
    world,
    genericNameToTag,
    tagToAttributeNames
  );

  // const suite = converter.convertTestSuite(pfSuite);
  // console.log(JSON.stringify(suite, null, 2));

  converter.createDefaults();
  // for (const test of getTestCases(suite)) {
  //   if (!filter.has(test.id)) {
  //     continue;
  //   }
  //   if (test.steps.length === 1) {
  //     console.log(`${test.id}: ${test.steps[0].turns[0].transcription}`);
  //   } else {
  //     console.log(`${test.id}:`);
  //     for (const [i, step] of test.steps.entries()) {
  //       const label = String.fromCharCode('a'.charCodeAt(0) + i);
  //       console.log(`  ${label}: ${step.turns[0].transcription}`);
  //     }
  //   }
  // }
}

go();

// https://stackoverflow.com/questions/37040026/typescript-compilation-extremely-slow-12s
// https://github.com/microsoft/TypeScript/wiki/Performance
