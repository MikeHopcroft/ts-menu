import pf, {
  IdGenerator,
  TensorDescription,
  TensorEntityBuilder,
} from 'prix-fixe';

import {Cart, LineItem, Product} from './menu';

const attributeNames = new Map<string, string[]>([
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

type Item = {
  type: string;
  name: string;
  options?: Item[];
};

export class PrixFixeToLLM {
  attributeInfo: pf.AttributeInfo;
  catalog: pf.ICatalog;
  world: pf.World;
  genericNameToTag: Map<string, string>;
  counter = 0;

  constructor(world: pf.World, genericNameToTag: Map<string, string>) {
    this.world = world;
    this.attributeInfo = world.attributeInfo;
    this.catalog = world.catalog;
    this.genericNameToTag = genericNameToTag;
    this.convertLineItem = this.convertLineItem.bind(this);
    // this.convertProduct = this.convertProduct.bind(this);
    this.convertOption = this.convertOption.bind(this);
    // this.convertOption.bind(this);
  }

  convertCart(cart: pf.Cart): Cart {
    // console.log('===============================');
    if (this.counter === 17) {
      console.log('here');
    }
    console.log(`${this.counter++}: ===============================`);
    console.log(JSON.stringify(cart, null, 2));
    console.log('+++++');
    const cart2 = {items: cart.items.map(this.convertLineItem)};
    console.log(JSON.stringify(cart2, null, 2));
    return cart2;
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
    // const specific = this.catalog.getSpecific(item.key);
    const generic = this.catalog.getGenericForKey(item.key);

    // Need to get tensor name from TID.
    //   This will be converted to the product's type name
    // const tensor = this.getTensor(
    //   this.world.attributes.tensors,
    //   generic.tensor
    // );
    // const type = toTypeName(tensor.name);
    const type = this.genericNameToTag.get(generic.name);
    if (type === undefined) {
      throw new Error();
    }
    const name = generic.name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItem: {[key: string]: any} = {
      type,
      name,
      quantity: item.quantity,
    };

    const tensor = this.attributeInfo.getTensorForEntity(generic.pid);
    const fields = item.key.split(':').map(parseBase10Int);
    fields.shift();
    const properties = attributeNames.get(type);
    if (properties === undefined) {
      throw new Error();
    }
    for (const [i, field] of fields.entries()) {
      const property = properties[i];
      const value = tensor.dimensions[i].attributes[field].name;
      lineItem[property] = value;
    }

    // const aids = this.world.attributeInfo.getAttributes(item.key);
    // for (const aid of aids) {
    //   const coordinates = this.world.attributeInfo.getAttributeCoordinates(aid);
    //   // The following line is wrong. Breaks on 17/19 light nutmeg
    //   // Writes light to quantity instead of amounts
    //   const attributeName = coordinates.dimension.name.split('_').slice(-1)[0];
    //   const attributeValue =
    //     coordinates.dimension.attributes[coordinates.position].name;
    //   lineItem[attributeName] = attributeValue;
    //   // console.log(
    //   //   `xxx  ${attributeName}: ${
    //   //     coordinates.dimension.attributes[coordinates.position].name
    //   //   }`
    //   // );
    // }
    // // const typeName = tensor.

    if (!isOption) {
      const options = item.children.map(this.convertOption);
      lineItem.options = options;
    }
    // for (const option of item.children) {

    // }

    // console.log('---');
    // console.log(JSON.stringify(specific));
    // console.log(JSON.stringify(generic));
    // console.log(`type: ${type}`);
    // console.log(JSON.stringify(lineItem));

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

// Borrowed from prix-fixe
function parseBase10Int(text: string): number {
  const n = Number.parseInt(text, 10);
  if (isNaN(n)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const message = `Invalid number ${text}.`;
  }
  return n;
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

/*
Map from generic name to pid
(generic_name: string) => PID
(PID, field_name, field_value) => AID
(field_name) => dimension_name
*/
export class LLMToPrixFixe {
  // private catalog: pf.ICatalog;
  private world: pf.World;

  private idGenerator = new IdGenerator();
  private pidFromName = new Map<string, number>();

  constructor(world: pf.World) {
    // this.catalog = world.catalog;
    this.world = world;
    this.convertLineItem = this.convertLineItem.bind(this);
    this.convertOption = this.convertOption.bind(this);

    for (const g of world.catalog.genericEntities()) {
      if (this.pidFromName.has(g.name)) {
        throw new Error(`Duplicate generic name ${g.name}.`);
      }
      this.pidFromName.set(g.name, g.pid);
    }
  }

  convertCart(cart: Cart): pf.Cart {
    console.log('---------');
    const cart2 = {items: cart.items.map(this.convertLineItem)};

    console.log(JSON.stringify(cart2, null, 2));

    return cart2;
  }

  private convertLineItem(item: LineItem): pf.ItemInstance {
    const uid = this.idGenerator.next();
    const children = item.product.options.map(this.convertOption);
    const key = this.convertSpecific2(item.product);
    return {children, key, quantity: item.quantity, uid};
  }

  private convertOption(option: {
    type: string;
    name: string;
    // quantity: number | undefined;
  }): pf.ItemInstance {
    const uid = this.idGenerator.next();
    const key = this.convertSpecific2(option);
    // Issue here is that syrups use quantity for number of pumps
    // vs no, light, regular, extra
    const quantity = (option as any).quantity;
    return {children: [], key, quantity: quantity, uid};
  }

  // private convertSpecific(product: {type: string; name: string}): string {
  //   // This code looks wrong - it is suplying the attribute names, instead of values.
  //   const attributes = attributeNames.get(product.type);
  //   if (!attributes) {
  //     throw new Error(`${product.type}: attributes not found`);
  //   }
  //   const values = attributes.map(a => (product as {[key: string]: string})[a]);
  //   const specificName = [...values, product.name].join(' ');
  //   const specific = getSpecific(this.catalog, specificName);
  //   if (specific === undefined) {
  //     throw new Error(`Cannot find "${specificName}"`);
  //   }
  //   return specific.key;
  // }

  private convertSpecific2(product: {type: string; name: string}): string {
    const pid = this.pidFromName.get(product.name);
    if (pid === undefined) {
      throw new Error(`Unknown generic ${product.name}.`);
    }
    const builder = new TensorEntityBuilder(this.world.attributeInfo);
    builder.setPID(pid);

    const tensor = this.world.attributeInfo.getTensorForEntity(pid);
    const properties = attributeNames.get(product.type);
    if (properties === undefined) {
      throw new Error(`Unknown type ${product.type}.`);
    }
    for (const [i, property] of properties.entries()) {
      const value = (product as any)[property];
      if (value === undefined) {
        throw new Error();
      }
      for (const attribute of tensor.dimensions[i].attributes) {
        if (attribute.name === value) {
          builder.addAttribute(attribute.aid);
          break;
        }
      }
    }
    const key = builder.getKey(false);
    return key;
    // // This code looks wrong - it is suplying the attribute names, instead of values.
    // const attributes = attributeNames.get(product.type);
    // if (!attributes) {
    //   throw new Error(`${product.type}: attributes not found`);
    // }
    // const values = attributes.map(a => (product as {[key: string]: string})[a]);
    // const specificName = [...values, product.name].join(' ');
    // const specific = getSpecific(this.catalog, specificName);
    // if (specific === undefined) {
    //   throw new Error(`Cannot find "${specificName}"`);
    // }
    // return specific.key;
  }

  // private pidFromName(name: string): pf.PID {
  //   throw new Error('no implemented');
  // }
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
