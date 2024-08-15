import prettier from 'prettier';
import {CatalogSpec, DimensionSpec} from 'prix-fixe';

import {Product} from './llmCatalog';

export class PrixFixeToTS {
  catalogSpec: CatalogSpec;
  friendlyAttributeNames: Map<string, string>;
  nameToProduct: Map<string, Product>;

  constructor(
    catalogSpec: CatalogSpec,
    nameToProduct: Map<string, Product>,
    friendlyAttributeNames: Map<string, string>
  ) {
    this.catalogSpec = catalogSpec;
    this.friendlyAttributeNames = friendlyAttributeNames;
    this.nameToProduct = nameToProduct;
  }

  generateTypescriptTypes(): string {
    const lines: string[] = [];

    // Boilerplate definition of Cart and ItemInstance.
    lines.push(formatOrder());
    lines.push('');

    // type Product = A | B | ... ;
    const topLevel = toTypeUnion(
      [...this.nameToProduct.values()].filter(p => !p.isOption).map(p => p.name)
    );
    lines.push(`type Item = ${topLevel}`);
    lines.push('');

    // Interfaces for each Product and Option.
    for (const product of this.nameToProduct.values()) {
      lines.push(this.formatProduct(product));
      lines.push('');
    }

    // Type aliases for configuration dimensions.
    lines.push(formatDimensions(this.catalogSpec));

    // Create source code and format.
    const text = lines.join('\n');
    const formatted = prettier.format(text, {
      parser: 'typescript',
      singleQuote: true,
    });
    return formatted;
  }

  formatProduct(product: Product): string {
    const lines: string[] = [];
    lines.push(`interface ${toTypeName(product.name)} {`);
    lines.push(
      `  quantity: number;
         name: ${product.values.map(x => JSON.stringify(x)).join(' | ')};`
    );

    for (const dimensionName of product.dimensions) {
      lines.push(
        `    ${this.toFriendlyName(dimensionName)}?: ${toTypeName(
          dimensionName
        )};`
      );
    }

    if (product.options.length > 0) {
      lines.push(`  options: (${toTypeUnion(product.options)})[];`);
    }
    lines.push('}');
    return lines.join('\n');
  }

  toFriendlyName(dimensionName: string) {
    const name = this.friendlyAttributeNames.get(dimensionName);
    return name || toPropertyName(dimensionName);
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// Typescript formatting utility functions.
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

function formatOrder(): string {
  return `interface Cart { items: Item[]; }
         `;
}
