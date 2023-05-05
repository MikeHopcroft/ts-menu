import path from 'path';
import {
  CatalogSpec,
  DimensionSpec,
  GroupSpec,
  ItemSpec,
  loadCatalogFile,
} from 'prix-fixe';

interface GroupInfo {
  tag: string;
  parent: GroupSpec;
  children: ItemSpec[];
  isOption: boolean;
}

interface Product {
  name: string;
  values: string[];
  dimensions: string[];
  exclusives: string[];
  options: string[];
}

function getDimension(
  catalog: CatalogSpec,
  name: string | undefined
): DimensionSpec | undefined {
  for (const d of catalog.dimensions) {
    if (d.name === name) {
      return d;
    }
  }
  return undefined;
}

function getTensor(catalog: CatalogSpec, name: string | undefined) {
  for (const t of catalog.tensors) {
    if (t.name === name) {
      return t;
    }
  }
  return undefined;
}

function toTypeName(name: string) {
  return name
    .split(/[-_]/)
    .map(x => x[0].toUpperCase() + x.slice(1))
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

function formatDimensions(catalog: CatalogSpec) {
  for (const d of catalog.dimensions) {
    console.log(formatDimension(d));
    console.log();
  }
}

function formatProduct(catalog: CatalogSpec, product: Product) {
  console.log(`interface ${toTypeName(product.name)} {`);
  console.log(
    `  name: ${product.values.map(x => JSON.stringify(x)).join(' | ')};`
  );
  if (product.dimensions.length > 0) {
    for (const dimensionName of product.dimensions) {
      console.log(`  ${dimensionName}: ${toTypeName(dimensionName)};`);
    }
  }
  if (product.options.length > 0) {
    console.log(`  options: (${toTypeUnion(product.options)})[]`);
  }
  console.log('}\n');
}

function formatGroupInfo(catalog: CatalogSpec, info: GroupInfo) {
  console.log(`interface ${toTypeName(info.tag)} {`);
  console.log(
    `  name: ${info.children.map(x => JSON.stringify(x.name)).join(' | ')};`
  );
  if (info.parent.tensor && info.parent.tensor !== 'none') {
    // console.log(`  dimensions: ${JSON.stringify(info.parent.tensor)}`);

    const tensor = getTensor(catalog, info.parent.tensor);
    if (tensor) {
      for (const dimensionName of tensor.dimensions) {
        console.log(`  ${dimensionName}: ${toTypeName(dimensionName)};`);
        // const dimension = getDimension(catalog, dimensionName);
        // if (dimension) {
        //   const values = dimension.attributes
        //     .map(a => JSON.stringify(a.name))
        //     .join(' | ');
        //   console.log(`    ${dimensionName}: ${values}`);
        // }
      }
    }
  }

  // const tensorName = info.parent.tensor;
  // if (tensorName) {
  //   for (const t of catalog.tensors) {
  //     if (t.name === tensorName) {
  //       for (const dimensionName of t.dimensions) {
  //         console.log(`    ${dimensionName}:`);
  //       }
  //     }
  //   }
  // }
  console.log('}\n');
}

function toProduct(catalog: CatalogSpec, group: GroupSpec): Product {
  if (!group.tags || group.tags.length !== 1) {
    throw new Error('Expect exactly one tag.');
  }

  // if (!group.tensor) {
  //   throw new Error('Missing tensor.');
  // }

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
  return {name, values, dimensions, exclusives, options};
}

function* generateProducts(
  catalog: CatalogSpec,
  groups: GroupSpec[]
): Generator<Product> {
  for (const group of groups) {
    if (group.type === 'option') {
      if ('items' in group) {
        yield* generateProducts(catalog, group.items);
      }
    } else if ('items' in group) {
      if (group.tags) {
        yield toProduct(catalog, group);
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
    if ('children' in rule) {
      for (const parent of rule.parents) {
        const product = products.get(parent);
        if (!product) {
          throw new Error(`Unknown product "${parent}".`);
        }
        for (const child of rule.children) {
          product.options.push(child);
        }
      }
    }
  }

  formatDimensions(catalog);

  for (const product of products.values()) {
    formatProduct(catalog, product);
  }

  //   const world = createWorld(dataPath);
  //   console.log(JSON.stringify(world, null, 2));
}

go();
