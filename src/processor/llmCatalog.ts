import path from 'path';
import {
  CatalogSpec,
  DimensionSpec,
  GroupSpec,
  ItemSpec,
  loadCatalogFile,
} from 'prix-fixe';

interface Product {
  pid: number;
  name: string;
  values: string[];
  dimensions: string[];
  exclusives: string[];
  options: string[];
  tags: string[];
  isOption: boolean;
}

export function createLLMProducts(dataPath: string): {
  catalog: CatalogSpec;
  nameToProduct: Map<string, Product>;
} {
  // const dataPath = 'samples/menu';
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

let pid = 0;

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
    pid: pid++,
    name,
    values,
    dimensions,
    exclusives,
    options,
    tags: [...group.tags, ...tags],
    isOption,
  };
}

function getTensor(catalog: CatalogSpec, name: string | undefined) {
  for (const t of catalog.tensors) {
    if (t.name === name) {
      return t;
    }
  }
  return undefined;
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
