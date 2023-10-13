Here is a set of TypeScript data types that define the structure of an object of type Cart that represents a latte stand order:

interface Cart {
  items: ItemInstance[];
}

interface ItemInstance {
  item: Product;
  quantity: number;
}

type Product = BakeryProducts | LatteDrinks | EspressoDrinks | CoffeeDrinks;

interface BakeryProducts {
  type: 'BakeryProducts';
  name: 'apple bran muffin' | 'blueberry muffin' | 'lemon poppyseed muffin';
  options: (BakeryOptions | BakeryPreparations)[];
}

interface BakeryOptions {
  type: 'BakeryOptions';
  name: 'butter' | 'strawberry jam';
  configuration: {
    optionQuantity?: OptionQuantity;
  };
}

interface BakeryPreparations {
  type: 'BakeryPreparations';
  name: 'warmed' | 'cut in half';
}

interface LatteDrinks {
  type: 'LatteDrinks';
  name:
    | 'cappuccino'
    | 'flat white'
    | 'latte'
    | 'latte macchiato'
    | 'mocha'
    | 'chai latte';
  configuration: {
    coffeeTemperature?: CoffeeTemperature;
    coffeeSize?: CoffeeSize;
  };
  options: (
    | Milks
    | Sweeteners
    | Syrups
    | Toppings
    | Caffeines
    | LattePreparations
  )[];
}

interface EspressoDrinks {
  type: 'EspressoDrinks';
  name: 'espresso' | 'lungo' | 'ristretto' | 'macchiato';
  configuration: {
    coffeeTemperature?: CoffeeTemperature;
    espressoSize?: EspressoSize;
  };
  options: (
    | Caffeines
    | LattePreparations
    | Creamers
    | Sweeteners
    | Syrups
    | Toppings
  )[];
}

interface CoffeeDrinks {
  type: 'CoffeeDrinks';
  name: 'americano' | 'dark roast coffee';
  configuration: {
    coffeeTemperature?: CoffeeTemperature;
    coffeeSize?: CoffeeSize;
  };
  options: (
    | Caffeines
    | LattePreparations
    | Creamers
    | Sweeteners
    | Syrups
    | Toppings
  )[];
}

interface Syrups {
  type: 'Syrups';
  name:
    | 'almond syrup'
    | 'buttered rum syrup'
    | 'caramel syrup'
    | 'cinnamon syrup'
    | 'hazelnut syrup'
    | 'orange syrup'
    | 'peppermint syrup'
    | 'raspberry syrup'
    | 'toffee syrup'
    | 'vanilla syrup';
  configuration: {
    optionQuantity?: OptionQuantity;
  };
}

interface Caffeines {
  type: 'Caffeines';
  name: 'regular' | 'two thirds caf' | 'half caf' | 'one third caf' | 'decaf';
}

interface Milks {
  type: 'Milks';
  name:
    | 'whole milk'
    | 'two percent milk'
    | 'one percent milk'
    | 'nonfat milk'
    | 'coconut milk'
    | 'soy milk'
    | 'almond milk'
    | 'oat milk'
    | 'eggnog';
}

interface Creamers {
  type: 'Creamers';
  name:
    | 'whole milk creamer'
    | 'two percent milk creamer'
    | 'one percent milk creamer'
    | 'nonfat milk creamer'
    | 'coconut milk creamer'
    | 'soy milk creamer'
    | 'almond milk creamer'
    | 'oat milk creamer'
    | 'eggnog creamer'
    | 'half and half'
    | 'heavy cream';
}

interface Toppings {
  type: 'Toppings';
  name: 'cinnamon' | 'foam' | 'ice' | 'nutmeg' | 'whipped cream' | 'water';
  configuration: {
    optionQuantity?: OptionQuantity;
  };
}

interface LattePreparations {
  type: 'LattePreparations';
  name: 'for here cup' | 'lid' | 'with room' | 'to go' | 'dry' | 'wet';
}

interface Sweeteners {
  type: 'Sweeteners';
  name:
    | 'equal'
    | 'honey'
    | 'splenda'
    | 'sugar'
    | 'sugar in the raw'
    | 'sweet n low'
    | 'espresso shot';
  configuration: {
    optionQuantity?: OptionQuantity;
  };
}

type CoffeeTemperature = 'hot' | 'iced';

type CoffeeSize = 'short' | 'tall' | 'grande' | 'venti';

type EspressoSize = 'solo' | 'doppio' | 'triple' | 'quad';

type OptionQuantity = 'no' | 'light' | 'regular' | 'extra';

In the following paragraph a person is ordering from a latte stand. Write out the person's requests as a **single** JSON object of type Cart. Never write null or undefined as values in the JSON object. **Do not** add comments when writing out the JSON object because some JSON parsers can't understand comments.

Customer: two lattes, one tall decaf and the other grande with vanilla syrup

