import pf from 'prix-fixe';

import {Cart, LineItem} from './menu';

const attributeNames = new Map<string, string[]>([
  ['BakeryProducts', []],
  ['BakeryOptions', ['amount']],
  ['BakeryPreparations', []],
  ['LatteDrinks', ['temperature', 'size']],
  ['EspressoDrinks', ['temperature', 'size']],
  ['CoffeeDrinks', ['temperature', 'size']],
  ['Syrups', ['amount']],
  ['Caffeinnes', []],
  ['Milks', []],
  ['Creamers', []],
  ['Toppings', ['amount']],
  ['LattePreparations', []],
  ['Sweeteners', ['amount']],
]);

export class PrixFixeToLLM {
  constructor(catalog: pf.ICatalog) {
    // this.catalog = catalog;
    this.convertItemInstance.bind(this);
    // this.convertOption.bind(this);
  }

  convertCart(cart: pf.Cart): Cart {
    return {items: cart.items.map(this.convertItemInstance)};
  }

  convertItemInstance(item: pf.ItemInstance): LineItem {
    // Use tensor name to get LineItem name.
    // Get attribute values.
    // use attributeNames to attach attribute values to fields.
  }
}

export class LLMToPrixFixe {
  private catalog: pf.ICatalog;

  private idGenerator = new pf.IdGenerator();

  constructor(catalog: pf.ICatalog) {
    this.catalog = catalog;
    this.convertLineItem.bind(this);
    this.convertOption.bind(this);
  }

  convertCart(cart: Cart): pf.Cart {
    return {items: cart.items.map(this.convertLineItem)};
  }

  private convertLineItem(item: LineItem): pf.ItemInstance {
    const uid = this.idGenerator.next();
    const children = item.product.options.map(this.convertOption);
    const key = this.convertSpecific(item.product);
    return {children, key, quantity: item.quantity, uid};
  }

  private convertOption(option: {type: string; name: string}): pf.ItemInstance {
    const uid = this.idGenerator.next();
    const key = this.convertSpecific(option);
    return {children: [], key, quantity: 1, uid};
  }

  private convertSpecific(product: {type: string; name: string}): string {
    const attributes = attributeNames.get(product.type);
    if (!attributes) {
      throw `${product.type}: attributes not found`;
    }
    const specificName = [...attributes, product.name].join(' ');
    const specific = getSpecific(this.catalog, specificName);
    if (specific === undefined) {
      throw new Error(`Cannot find "${specificName}"`);
    }
    return specific.key;
  }
}

function getSpecific(
  catalog: pf.ICatalog,
  name: string
): pf.SpecificTypedEntity | undefined {
  for (const entity of catalog.specificEntities()) {
    if (name === entity.name) {
      return entity;
    }
  }

  return undefined;
}
