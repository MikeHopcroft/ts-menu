interface Cart {
  items: ItemInstance[];
}

interface ItemInstance {
  item: Product;
  quantity: number;
}

type Product = BakeryProducts | LatteDrinks | EspressoDrinks | CoffeeDrinks;

interface BakeryProducts {
  name: 'apple bran muffin' | 'blueberry muffin' | 'lemon poppyseed muffin';
  options: (BakeryOptions | BakeryPreparations)[];
}

interface BakeryOptions {
  name: 'butter' | 'strawberry jam';
  optionQuantity?: OptionQuantity;
}

interface BakeryPreparations {
  name: 'warmed' | 'cut in half';
}

interface LatteDrinks {
  name:
    | 'cappuccino'
    | 'flat white'
    | 'latte'
    | 'latte macchiato'
    | 'mocha'
    | 'chai latte';
  coffeeTemperature?: CoffeeTemperature;
  coffeeSize?: CoffeeSize;
  milks?: Milks;
  caffeines?: Caffeines;
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
  name: 'espresso' | 'lungo' | 'ristretto' | 'macchiato';
  coffeeTemperature?: CoffeeTemperature;
  espressoSize?: EspressoSize;
  milks?: Milks;
  caffeines?: Caffeines;
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
  name: 'americano' | 'dark roast coffee';
  coffeeTemperature?: CoffeeTemperature;
  coffeeSize?: CoffeeSize;
  milks?: Milks;
  caffeines?: Caffeines;
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
  optionQuantity?: OptionQuantity;
}

interface Caffeines {
  name: 'regular' | 'two thirds caf' | 'half caf' | 'one third caf' | 'decaf';
}

interface Milks {
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
  name: 'cinnamon' | 'foam' | 'ice' | 'nutmeg' | 'whipped cream' | 'water';
  optionQuantity?: OptionQuantity;
}

interface LattePreparations {
  name: 'for here cup' | 'lid' | 'with room' | 'to go' | 'dry' | 'wet';
}

interface Sweeteners {
  name:
    | 'equal'
    | 'honey'
    | 'splenda'
    | 'sugar'
    | 'sugar in the raw'
    | 'sweet n low'
    | 'espresso shot';
  optionQuantity?: OptionQuantity;
}

type CoffeeTemperature = 'hot' | 'iced';

type CoffeeSize = 'short' | 'tall' | 'grande' | 'venti';

type EspressoSize = 'solo' | 'doppio' | 'triple' | 'quad';

type OptionQuantity = 'no' | 'light' | 'regular' | 'extra';

