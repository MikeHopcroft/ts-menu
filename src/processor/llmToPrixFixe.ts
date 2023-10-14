import pf, {TensorDescription} from 'prix-fixe';

import {Cart, LineItem, Product} from './menu';

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

type Item = {
  type: string;
  name: string;
  options?: Item[];
};

export class PrixFixeToLLM {
  attributeInfo: pf.AttributeInfo;
  catalog: pf.ICatalog;
  world: pf.World;

  constructor(world: pf.World) {
    this.world = world;
    this.attributeInfo = world.attributeInfo;
    this.catalog = world.catalog;
    this.convertLineItem = this.convertLineItem.bind(this);
    // this.convertProduct = this.convertProduct.bind(this);
    this.convertOption = this.convertOption.bind(this);
    // this.convertOption.bind(this);
  }

  convertCart(cart: pf.Cart): Cart {
    console.log('===============================');
    return {items: cart.items.map(this.convertLineItem)};
  }

  convertLineItem(item: pf.ItemInstance): LineItem {
    const product = this.convertProduct(item);
    return {product, quantity: item.quantity};
  }

  convertProduct(item: pf.ItemInstance): Product {
    return this.convertItem(item, false) as Product;
  }

  convertOption(item: pf.ItemInstance): Item {
    return this.convertItem(item, true);
  }

  convertItem(item: pf.ItemInstance, isOption: boolean): Item {
    // Use tensor name to get LineItem name.
    // Get attribute values.
    // Use attributeNames to attach attribute values to fields.
    const specific = this.catalog.getSpecific(item.key);
    const generic = this.catalog.getGenericForKey(item.key);

    // Need to get tensor name from TID.
    //   This will be converted to the product's type name
    const tensor = this.getTensor(
      this.world.attributes.tensors,
      generic.tensor
    );
    const type = toTypeName(tensor.name);
    const name = generic.name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItem: {[key: string]: any} = {type, name};

    const aids = this.world.attributeInfo.getAttributes(item.key);
    for (const aid of aids) {
      const coordinates = this.world.attributeInfo.getAttributeCoordinates(aid);
      const attributeName = coordinates.dimension.name.split('_').slice(-1)[0];
      const attributeValue =
        coordinates.dimension.attributes[coordinates.position].name;
      lineItem[attributeName] = attributeValue;
      // console.log(
      //   `xxx  ${attributeName}: ${
      //     coordinates.dimension.attributes[coordinates.position].name
      //   }`
      // );
    }
    // const typeName = tensor.

    if (!isOption) {
      const options = item.children.map(this.convertOption);
      lineItem.options = options;
    }
    // for (const option of item.children) {

    // }

    console.log('---');
    // console.log(JSON.stringify(specific));
    // console.log(JSON.stringify(generic));
    // console.log(`type: ${type}`);
    console.log(JSON.stringify(lineItem));

    // specific.
    // return {
    //   product: {
    //     type: 'BakeryProducts',
    //     name: 'apple bran muffin',
    //     options: [],
    //   },
    //   quantity: 1,
    // };
    return lineItem as Item;
    // return {product: lineItem as Product, quantity: item.quantity};
  }

  getTensor(tensors: pf.TensorDescription[], tid: pf.TID): TensorDescription {
    for (const t of tensors) {
      if (t.tid === tid) {
        return t;
      }
    }
    throw new Error(`TID ${tid} not found.`);
  }
}

// function toPropertyName(name: string) {
//   return name
//     .split(/[-_]/)
//     .map((x, i) => (i === 0 ? x[0] : x[0].toUpperCase()) + x.slice(1))
//     .join('');
// }

function toTypeName(name: string) {
  return name
    .split(/[-_]/)
    .map(x => x[0].toUpperCase() + x.slice(1))
    .join('');
}

export class LLMToPrixFixe {
  private catalog: pf.ICatalog;

  private idGenerator = new pf.IdGenerator();

  constructor(catalog: pf.ICatalog) {
    this.catalog = catalog;
    this.convertLineItem = this.convertLineItem.bind(this);
    this.convertOption = this.convertOption.bind(this);
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
      throw new Error(`${product.type}: attributes not found`);
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
