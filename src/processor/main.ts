import {
  TestProcessors,
  testRunnerMain,
  State,
  World,
  loadLogicalTestSuite,
  TextTurn,
  LogicalTestSuite,
  LogicalValidationSuite,
  cartFromlogicalCart,
  CatalogSpec,
  ICatalog,
  createWorld,
  loadLogicalValidationSuite,
} from 'prix-fixe';

import {Cart as LLMCart} from './menu';

// This sample application demonstrates how to configure the test runner
// with a set of Processors.

// This example processor does nothing. Replace it with code that processes the
// text utterance to produce a new State.
let counter = 0;
async function nopProcessor(text: string, state: State): Promise<State> {
  return state;
}

// This example processor always throws.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function throwProcessor(text: string, state: State): Promise<State> {
  throw Error('hi');
}

// This example processor alternates between doing nothing and throwing.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function nopThrowProcessor(text: string, state: State): Promise<State> {
  counter++;
  if (counter % 2 === 0) {
    throw Error('hi');
  } else {
    return state;
  }
}

function createCheatProcessorFactory(suite: LogicalValidationSuite<TextTurn>) {
  return (w: World, d: string) => {
    const states = expectedStates(w.catalog, suite);
    return async (text: string, state: State): Promise<State> => {
      const expected = states.next();
      if (expected.done) {
        throw new Error('Ran out of states');
      }
      return expected.value;
    };
  };
}

function* expectedStates(
  catalog: ICatalog,
  suite: LogicalValidationSuite<TextTurn>
): Generator<State> {
  for (const test of suite.tests) {
    if ('id' in test) {
      for (const step of test.steps) {
        yield {cart: cartFromlogicalCart(step.cart, catalog)};
      }
    }
  }
}

function prixFixeCartToLLM(cart: Cart): LLMCart {

}

function LLMCartToPrixFixe(cart: LLMCart): Cart {

}

async function go() {
  // const world = createWorld('samples/menu');
  const suite = loadLogicalValidationSuite<TextTurn>(
    'samples/tests/baseline.yaml'
  );
  const cheatProcessorFactory = createCheatProcessorFactory(suite);

  // Define the processor factory.
  const processorFactory = new TestProcessors([
    {
      name: 'cheat',
      description: 'always returns the expected',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      create: cheatProcessorFactory,
    },
    {
      name: 'nop',
      description: 'does nothing',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      create: (w: World, d: string) => nopProcessor,
    },
    {
      name: 'throw',
      description: 'always throws',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      create: (w: World, d: string) => throwProcessor,
    },
    {
      name: 'both',
      description: 'alternates between doing nothing and throwing.',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      create: (w: World, d: string) => nopThrowProcessor,
    },
  ]);

  testRunnerMain('Demo', processorFactory);
}

go();
