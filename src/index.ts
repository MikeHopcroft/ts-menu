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
  isOption: boolean;
}

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

function formatCart(): string {
  return `interface Cart { items: ItemInstance[]; }

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
  return {name, values, dimensions, exclusives, options, isOption};
}

function* generateProducts(
  catalog: CatalogSpec,
  groups: GroupSpec[],
  isOption = false
): Generator<Product> {
  for (const group of groups) {
    if (group.type === 'option') {
      if ('items' in group) {
        yield* generateProducts(catalog, group.items, true);
      }
    } else if ('items' in group) {
      if (group.tags) {
        yield toProduct(catalog, group, isOption);
      } else {
        console.log('skip');
      }
    } else {
      console.log('pass');
    }
  }
}

function go() {
  const dataPath = 'samples/menu';
  const catalog = loadCatalogFile(path.join(dataPath, 'menu.yaml'));

  const products = new Map<string, Product>();
  for (const product of generateProducts(catalog, catalog.catalog)) {
    if (products.has(product.name)) {
      throw new Error(`Duplicate product name "${product.name}".`);
    }
    products.set(product.name, product);
  }

  for (const rule of catalog.rules) {
    if ('exclusive' in rule) {
      for (const parent of rule.parents) {
        const product = products.get(parent);
        if (!product) {
          throw new Error(`Unknown product "${parent}".`);
        }
        for (const child of rule.exclusive) {
          product.exclusives.push(child);
        }
      }
    }
  }

  for (const rule of catalog.rules) {
    if ('children' in rule) {
      for (const parent of rule.parents) {
        const product = products.get(parent);
        if (!product) {
          throw new Error(`Unknown product "${parent}".`);
        }
        for (const child of rule.children) {
          if (!product.exclusives.includes(child)) {
            product.options.push(child);
          }
        }
      }
    }
  }

  const lines: string[] = [];

  lines.push(formatCart());
  lines.push('');

  const topLevel = toTypeUnion(
    [...products.values()].filter(p => !p.isOption).map(p => p.name)
  );
  lines.push(`type Product = ${topLevel}`);
  lines.push('');

  for (const product of products.values()) {
    lines.push(formatProduct(catalog, product));
    lines.push('');
  }

  lines.push(formatDimensions(catalog));

  const text = lines.join('\n');
  const formatted = prettier.format(text, {parser: 'babel', singleQuote: true});
  console.log(formatted);
}

go();
