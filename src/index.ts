import path from 'path';
import prettier from 'prettier';
import {
  CatalogSpec,
  DimensionSpec,
  GroupSpec,
  ItemSpec,
  loadCatalogFile,
} from 'prix-fixe';

interface Product {
  name: string;
  values: string[];
  dimensions: string[];
  exclusives: string[];
  options: string[];
  tags: string[];
  isOption: boolean;
}

///////////////////////////////////////////////////////////////////////////////
//
// Order validation
//
///////////////////////////////////////////////////////////////////////////////
const validationTests = [
  // {input: 1, result: ['Expected an object of type `Order`.']},
  // {input: {}, result: ['Expected Order to have an `items` property.']},
  // {
  //   input: {items: 1},
  //   result: ['The `items` property should be an array of `Product`.'],
  // },
  // {input: {items: []}, result: []},
  // {input: {items: [1]}, result: ['Each `item` should be an `ItemInstance`.']},
  // {
  //   input: {items: [{}]},
  //   result: [
  //     'Expected `ItemInstance` to have an `quantity` property.',
  //     'Each `ItemInstance` should have a `Product` property.',
  //   ],
  // },
  // {
  //   input: {items: [{quantity: 'a'}]},
  //   result: [
  //     'The `quantity` property should be an integer greater than zero.',
  //     'Each `ItemInstance` should have a `Product` property.',
  //   ],
  // },
  // {
  //   input: {items: [{quantity: -1}]},
  //   result: [
  //     'The `quantity` property should be an integer greater than zero.',
  //     'Each `ItemInstance` should have a `Product` property.',
  //   ],
  // },
  // {
  //   input: {items: [{quantity: 0}]},
  //   result: [
  //     'The `quantity` property cannot be zero.',
  //     'Each `ItemInstance` should have a `Product` property.',
  //   ],
  // },
  // {
  //   input: {items: [{quantity: 1.5}]},
  //   result: [
  //     'The `quantity` property should an an integer.',
  //     'Each `ItemInstance` should have a `Product` property.',
  //   ],
  // },
  // {
  //   input: {items: [{quantity: 2}]},
  //   result: ['Each `ItemInstance` should have a `Product` property.'],
  // },
  {
    input: {items: [{quantity: 2, product: 1}]},
    result: ['Each `item` should be an `ItemInstance`.'],
  },
  {
    input: {items: [{quantity: 2, product: {}}]},
    result: ['`Products` must have a `type` field.'],
  },
  {
    input: {items: [{quantity: 2, product: {type: 'sandwiches'}}]},
    result: [
      '`Product.type` cannot be `sandwiches`. Legal types are bakery_products, bakery_options, bakery_preparations, latte_drinks, espresso_drinks, coffee_drinks, syrups, caffeines, milks, creamers, toppings, latte_preparations, sweeteners.',
    ],
  },
  {
    input: {items: [{quantity: 2, product: {type: 'latte_drinks'}}]},
    result: ['`Products` must have a `name` field.'],
  },
  {
    input: {
      items: [
        {quantity: 2, product: {type: 'latte_drinks', name: 'cheeseburger'}},
      ],
    },
    result: [],
  },
  {
    input: {
      items: [
        {quantity: 2, product: {type: 'latte_drinks', name: 'cappuccino'}},
      ],
    },
    result: [],
  },
];

function runTests(nameToProduct: Map<string, Product>) {
  for (const test of validationTests) {
    const result = validate(test.input, nameToProduct);

    if (result.join('\n') !== test.result.join('\n')) {
      console.log('==========================');
      console.log(JSON.stringify(test.input, null, 2));
      console.log(JSON.stringify(result, null, 2));
    }
  }
}

class Diagnostics {
  lines: string[] = [];

  add(line: string) {
    this.lines.push(line);
  }

  getLines() {
    return this.lines;
  }
}

export function validate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
  nameToProduct: Map<string, Product>
): string[] {
  const diagnostics = new Diagnostics();

  try {
    validateOrder(order, nameToProduct, diagnostics);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    diagnostics.add(`Unknown error: ${e.message}.`);
  }
  return diagnostics.getLines();
}

function validateOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
  nameToProduct: Map<string, Product>,
  diagnostics: Diagnostics
) {
  // order is an object
  if (!(order instanceof Object)) {
    diagnostics.add('Expected an object of type `Order`.');
    return;
  }

  // order has a single property called items
  if (order.items === undefined) {
    diagnostics.add('Expected Order to have an `items` property.');
    return;
  }

  // items is an array
  if (!(order.items instanceof Array)) {
    diagnostics.add('The `items` property should be an array of `Product`.');
    return;
  }

  // each item is an ItemInstance
  for (const item of order.items) {
    validateLineItem(item, nameToProduct, diagnostics);
  }
}

function validateLineItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lineItem: any,
  nameToProduct: Map<string, Product>,
  diagnostics: Diagnostics
) {
  // lineItem is an object
  if (!(lineItem instanceof Object)) {
    diagnostics.add('Each `item` should be an `ItemInstance`.');
    return;
  }

  // lineItem has a property called quantity that is a non-negative integer.
  const quantity = lineItem.quantity;
  if (quantity === undefined) {
    diagnostics.add('Expected `ItemInstance` to have an `quantity` property.');
  } else {
    const q = Number(quantity);
    if (isNaN(q) || q < 0) {
      diagnostics.add(
        'The `quantity` property should be an integer greater than zero.'
      );
    } else if (q === 0) {
      diagnostics.add('The `quantity` property cannot be zero.');
    } else {
      if (Math.round(q) !== q) {
        diagnostics.add('The `quantity` property should an an integer.');
      }
    }
  }

  // lineItem has a property that is a Product
  const product = lineItem.product;
  if (product === undefined) {
    diagnostics.add('Each `ItemInstance` should have a `Product` property.');
    return;
  }

  validateProduct(product, nameToProduct, diagnostics);
}

function validateProduct(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any,
  nameToProduct: Map<string, Product>,
  diagnostics: Diagnostics
) {
  // product is an object
  if (!(product instanceof Object)) {
    diagnostics.add('Each `item` should be an `ItemInstance`.');
    return;
  }

  // type field
  if (!product.type) {
    diagnostics.add('`Products` must have a `type` field.');
    return;
  }
  const p = nameToProduct.get(product.type);
  if (!p) {
    diagnostics.add(
      `\`Product.type\` cannot be \`${product.type}\`. Legal types are ${[
        ...nameToProduct.keys(),
      ].join(', ')}.`
    );
    return;
  }

  // name field
  if (!product.name) {
    diagnostics.add('`Products` must have a `name` field.');
    return;
  }
  if (!p.values.includes(product.name)) {
    diagnostics.add(
      `\`Product.name\` cannot be \`${product.name}\`. Legal names for \`${
        product.type
      }\` are ${[p.values.join(', ')].join(', ')}.`
    );
  }

  // legal configuration
  // all axes legal
  // no duplicate axes
  // all values are legal

  // legal options
  // no duplicate options
  // mutual exclusivity
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyField(
  obj: any,
  name: string,
  type: string,
  diagnostics: Diagnostics
) {}

///////////////////////////////////////////////////////////////////////////////
//
// Utility functions
//
///////////////////////////////////////////////////////////////////////////////
function getTensor(catalog: CatalogSpec, name: string | undefined) {
  for (const t of catalog.tensors) {
    if (t.name === name) {
      return t;
    }
  }
  return undefined;
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

function formatProduct(catalog: CatalogSpec, product: Product): string {
  const lines: string[] = [];
  lines.push(`interface ${toTypeName(product.name)} {`);
  lines.push(
    `  name: ${product.values.map(x => JSON.stringify(x)).join(' | ')};`
  );
  if (product.dimensions.length > 0) {
    for (const dimensionName of product.dimensions) {
      lines.push(
        `  ${toPropertyName(dimensionName)}?: ${toTypeName(dimensionName)};`
      );
    }
  }
  if (product.exclusives.length > 0) {
    for (const exclusive of product.exclusives) {
      lines.push(`  ${toPropertyName(exclusive)}?: ${toTypeName(exclusive)};`);
    }
  }
  if (product.options.length > 0) {
    lines.push(`  options: (${toTypeUnion(product.options)})[];`);
  }
  lines.push('}');
  return lines.join('\n');
}

function formatProduct2(catalog: CatalogSpec, product: Product): string {
  const lines: string[] = [];
  lines.push(`interface ${toTypeName(product.name)} {`);
  lines.push(`  type: "${toTypeName(product.name)}";`);
  lines.push(
    `  name: ${product.values.map(x => JSON.stringify(x)).join(' | ')};`
  );
  if (product.dimensions.length > 0) {
    lines.push('  configuration: {');
    for (const dimensionName of product.dimensions) {
      lines.push(
        `    ${toPropertyName(dimensionName)}?: ${toTypeName(dimensionName)};`
      );
    }
    lines.push('  };');
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
// Product generation
//
///////////////////////////////////////////////////////////////////////////////
function toProduct(
  catalog: CatalogSpec,
  group: GroupSpec,
  tags: string[],
  isOption: boolean
): Product {
  if (!group.tags || group.tags.length !== 1) {
    throw new Error('Expect exactly one tag.');
  }

  if (!('items' in group)) {
    throw new Error('Expected `items` field.');
  }

  const name = group.tags![0];

  const values = group.items.map(x => (x as ItemSpec).name);

  let dimensions: string[] = [];
  if (group.tensor && group.tensor !== 'none') {
    const tensor = getTensor(catalog, group.tensor);
    if (!tensor) {
      throw new Error(`Unknown tensor "${group.tensor}".`);
    }
    dimensions = tensor.dimensions;
  }
  const exclusives: string[] = [];
  const options: string[] = [];
  return {
    name,
    values,
    dimensions,
    exclusives,
    options,
    tags: [...group.tags, ...tags],
    isOption,
  };
}

function* generateProducts(
  catalog: CatalogSpec,
  groups: GroupSpec[],
  tags: string[] = [],
  isOption = false
): Generator<Product> {
  for (const group of groups) {
    if (group.type === 'option') {
      if ('items' in group) {
        const currentTags =
          group.tags && group.tags.length > 0 ? [...tags, ...group.tags] : tags;
        yield* generateProducts(catalog, group.items, currentTags, true);
      }
    } else if ('items' in group) {
      if (group.tags) {
        yield toProduct(catalog, group, tags, isOption);
      } else {
        console.log('skip');
      }
    } else {
      console.log('pass');
    }
  }
}

function getProductsWithTags(
  tagToProductSet: Map<string, Set<Product>>,
  tags: string[]
): Set<Product> {
  const result = new Set<Product>();
  for (const tag of tags) {
    const products = tagToProductSet.get(tag);
    if (products) {
      for (const product of products) {
        result.add(product);
      }
    }
  }
  return result;
}

function applyRule(
  tagToProductSet: Map<string, Set<Product>>,
  parentTags: string[],
  childTags: string[],
  f: (parent: Product, child: Product) => void
) {
  const parentProducts = getProductsWithTags(tagToProductSet, parentTags);
  const childProducts = getProductsWithTags(tagToProductSet, childTags);

  for (const parent of parentProducts) {
    for (const child of childProducts) {
      f(parent, child);
    }
  }
}

function generateTypeScript(): {
  catalog: CatalogSpec;
  nameToProduct: Map<string, Product>;
} {
  const dataPath = 'samples/menu';
  const catalog = loadCatalogFile(path.join(dataPath, 'menu.yaml'));

  // Build map from product name to product.
  const nameToProduct = new Map<string, Product>();
  for (const product of generateProducts(catalog, catalog.catalog)) {
    if (nameToProduct.has(product.name)) {
      throw new Error(`Duplicate product name "${product.name}".`);
    }
    nameToProduct.set(product.name, product);
  }

  // Build map from tag to set of Products with the tag.
  const tagToProductSet = new Map<string, Set<Product>>();
  for (const product of nameToProduct.values()) {
    for (const tag of product.tags) {
      const items = tagToProductSet.get(tag);
      if (items) {
        items.add(product);
      } else {
        tagToProductSet.set(tag, new Set([product]));
      }
    }
  }

  // Apply exclusivity rules
  for (const rule of catalog.rules) {
    if ('exclusive' in rule) {
      applyRule(
        tagToProductSet,
        rule.parents,
        rule.exclusive,
        (parent, child) => {
          parent.exclusives.push(child.name);
        }
      );
    }
  }

  // Apply parent-child rules
  for (const rule of catalog.rules) {
    if ('children' in rule) {
      applyRule(
        tagToProductSet,
        rule.parents,
        rule.children,
        (parent, child) => {
          parent.options.push(child.name);
        }
      );
    }
  }

  return {catalog, nameToProduct};
}

function go() {
  const {catalog, nameToProduct} = generateTypeScript();

  // runTests(nameToProduct);

  formatInterfaces(catalog, nameToProduct);

  for (const [name, product] of nameToProduct.entries()) {
    console.log(`${product.values.join(', ')} => ${product.name}`);
  }

  const table = [...nameToProduct.entries()].map(([name, product]) => [
    product.name,
    product.values,
  ]);
  console.log(JSON.stringify(table, null, 2));
  //   const lines: string[] = [];

  //   // Boilerplate definition of Cart and ItemInstance.
  //   lines.push(formatOrder());
  //   lines.push('');

  //   // type Product = A | B | ... ;
  //   const topLevel = toTypeUnion(
  //     [...nameToProduct.values()].filter(p => !p.isOption).map(p => p.name)
  //   );
  //   lines.push(`type Product = ${topLevel}`);
  //   lines.push('');

  //   // Interfaces for each Product and Option.
  //   for (const product of nameToProduct.values()) {
  //     lines.push(formatProduct2(catalog, product));
  //     lines.push('');
  //   }

  //   // Type aliases for configuration dimensions.
  //   lines.push(formatDimensions(catalog));

  //   // Create source code and format.
  //   const text = lines.join('\n');
  //   const formatted = prettier.format(text, {
  //     parser: 'typescript',
  //     singleQuote: true,
  //   });
  //   console.log(formatted);
  // }
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

go();
