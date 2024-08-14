import prettier from 'prettier';
import pf, {
  cartFromlogicalCart,
  CatalogSpec,
  createWorld,
  DimensionSpec,
  GenericCase,
  loadLogicalValidationSuite,
  LogicalValidationSuite,
  TextTurn,
  ValidationStep,
} from 'prix-fixe';

import {Item} from '../for-python/menu-python';
import {createLLMProducts} from '../processor/llmCatalog';
//import {Product} from '../processor/menu';

interface Product {
  name: string;
  values: string[];
  dimensions: string[];
  exclusives: string[];
  options: string[];
  tags: string[];
  isOption: boolean;
}

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
  for (const test of suite.tests) {
    if ('id' in test) {
      yield test;
    } else {
      console.log(`=== ${test.comment} ===`);
      yield* getTestCases(test);
    }
  }
}

export class PrixFixeToLLM {
  world: pf.World;
  catalogSpec: CatalogSpec;
  nameToProduct: Map<string, Product>;
  attributeInfo: pf.AttributeInfo;
  catalog: pf.ICatalog;
  genericNameToTag: Map<string, string>;
  // tagToAttributeNames: Map<string, string[]>;
  friendlyAttributeNames: Map<string, string>;
  counter = 0;

  constructor(
    world: pf.World,
    catalogSpec: CatalogSpec,
    nameToProduct: Map<string, Product>,
    genericNameToTag: Map<string, string>,
    friendlyAttributeNames: Map<string, string>
    // tagToAttributeNames: Map<string, string[]>
  ) {
    this.world = world;
    this.catalogSpec = catalogSpec;
    this.nameToProduct = nameToProduct;
    this.attributeInfo = world.attributeInfo;
    this.catalog = world.catalog;
    this.genericNameToTag = genericNameToTag;
    // this.tagToAttributeNames = tagToAttributeNames;
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

  createTypeScript(): string {
    formatInterfaces(this.catalogSpec, this.nameToProduct);

    return '';
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
    // const properties = tagToAttributeNames.get(type);
    // if (properties === undefined) {
    //   throw new Error();
    // }
    for (const [i, field] of fields.entries()) {
      // const property = properties[i];
      // const property = tensor.dimensions[i].name;
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

///////////////////////////////////////////////////////////////////////////////
//
// Product formatting
//
///////////////////////////////////////////////////////////////////////////////
function toTypeName(name: string) {
  return name
    .split(/[-_]/)
    .map(x => x[0].toUpperCase() + x.slice(1))
    .join('');
}

function toPropertyName(name: string) {
  return name
    .split(/[-_]/)
    .map((x, i) => (i === 0 ? x[0] : x[0].toUpperCase()) + x.slice(1))
    .join('');
}

function toStringLiteralUnion(names: string[]) {
  return names.map(n => JSON.stringify(n)).join(' | ');
}

function toTypeUnion(names: string[]) {
  return names.map(n => toTypeName(n)).join(' | ');
}

function formatDimension(dimension: DimensionSpec) {
  return `type ${toTypeName(dimension.name)} = ${toStringLiteralUnion(
    dimension.attributes.map(a => a.name)
  )};`;
}

function formatDimensions(catalog: CatalogSpec): string {
  const lines: string[] = [];
  for (const d of catalog.dimensions) {
    lines.push(formatDimension(d));
    lines.push('');
  }
  return lines.join('\n');
}

function formatInterfaces(
  catalog: CatalogSpec,
  nameToProduct: Map<string, Product>
) {
  const lines: string[] = [];

  // Boilerplate definition of Cart and ItemInstance.
  lines.push(formatOrder());
  lines.push('');

  // type Product = A | B | ... ;
  const topLevel = toTypeUnion(
    [...nameToProduct.values()].filter(p => !p.isOption).map(p => p.name)
  );
  lines.push(`type Product = ${topLevel}`);
  lines.push('');

  // Interfaces for each Product and Option.
  for (const product of nameToProduct.values()) {
    lines.push(formatProduct2(catalog, product));
    lines.push('');
  }

  // Type aliases for configuration dimensions.
  lines.push(formatDimensions(catalog));

  // Create source code and format.
  const text = lines.join('\n');
  const formatted = prettier.format(text, {
    parser: 'typescript',
    singleQuote: true,
  });
  console.log(formatted);
}

function formatProduct2(catalog: CatalogSpec, product: Product): string {
  const lines: string[] = [];
  lines.push(`interface ${toTypeName(product.name)} {`);
  // lines.push(`  type: "${toTypeName(product.name)}";`);
  lines.push(
    `  name: ${product.values.map(x => JSON.stringify(x)).join(' | ')};`
  );
  if (product.dimensions.length > 0) {
    // lines.push('  configuration: {');
    for (const dimensionName of product.dimensions) {
      lines.push(
        `    ${toPropertyName(dimensionName)}?: ${toTypeName(dimensionName)};`
      );
    }
    // lines.push('  };');
  }

  if (product.options.length > 0) {
    lines.push(`  options: (${toTypeUnion(product.options)})[];`);
  }
  lines.push('}');
  return lines.join('\n');
}

function formatOrder(): string {
  return `interface Order { items: ItemInstance[]; }

          interface ItemInstance { item: Product; quantity: number; }
          `;
}

///////////////////////////////////////////////////////////////////////////////
//
// Converter application below
//
///////////////////////////////////////////////////////////////////////////////

const friendlyAttributeNames = new Map<string, string>([
  ['coffee_temperature', 'temperature'],
  ['coffee_size', 'size'],
  ['espresso_size', 'size'],
  ['option_quantity', 'amount'],
  ['', ''],
]);

function go() {
  const pfSuite = loadLogicalValidationSuite<TextTurn>(
    'samples/tests/baseline.yaml'
  );

  const dataPath = 'samples/menu';
  const world = createWorld(dataPath);
  // console.log(JSON.stringify(suite, null, 2));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {catalog, nameToProduct, genericNameToTag} =
    createLLMProducts(dataPath);

  // console.log(JSON.stringify([...tagToAttributeNames.entries()], null, 2));

  const converter = new PrixFixeToLLM(
    world,
    catalog,
    nameToProduct,
    genericNameToTag,
    friendlyAttributeNames
  );

  const suite = converter.convertTestSuite(pfSuite);
  console.log(JSON.stringify(suite, null, 2));

  converter.createTypeScript();
  // converter.createDefaults();
}

go();

// https://stackoverflow.com/questions/37040026/typescript-compilation-extremely-slow-12s
// https://github.com/microsoft/TypeScript/wiki/Performance
