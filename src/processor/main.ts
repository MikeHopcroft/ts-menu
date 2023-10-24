import {
  cartFromlogicalCart,
  // CatalogSpec,
  ICatalog,
  // createWorld,
  // loadLogicalTestSuite,
  loadLogicalValidationSuite,
  // LogicalTestSuite,
  LogicalValidationSuite,
  NopLogger,
  State,
  TestProcessors,
  TestRunnerApplication,
  testRunnerMain,
  TextTurn,
  World,
} from 'prix-fixe';

import {LLMToPrixFixe, PrixFixeToLLM} from './llmToPrixFixe';
import {createLLMProducts} from './llmCatalog';
// import {Cart as LLMCart} from './menu';

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

function createCheatProcessorFactory(
  suite: LogicalValidationSuite<TextTurn>,
  genericNameToTag: Map<string, string>
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (w: World, d: string) => {
    console.log('===============================');
    console.log(d);
    const converter = new PrixFixeToLLM(w, genericNameToTag);
    const converter2 = new LLMToPrixFixe(w);
    const states = expectedStates(w.catalog, suite);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return async (text: string, state: State): Promise<State> => {
      console.log(text);
      const expected = states.next();
      if (expected.done) {
        throw new Error('Ran out of states');
      }
      const s = expected.value;
      const llmCart = converter.convertCart(s.cart);
      const pfCart = converter2.convertCart(llmCart);

      return {cart: pfCart};
      // return expected.value;
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

// function prixFixeCartToLLM(cart: Cart): LLMCart {

// }

// function LLMCartToPrixFixe(cart: LLMCart): Cart {

// }

async function go() {
  // const world = createWorld('samples/menu');
  const config = getConfig();
  const {genericNameToTag} = createLLMProducts(config.dataPath);
  // console.log(JSON.stringify([...genericNameToTag.entries()], null, 2));
  // console.log(JSON.stringify([...products.nameToProduct.entries()], null, 2));

  const suite = loadLogicalValidationSuite<TextTurn>(
    'samples/tests/baseline.yaml'
  );
  const cheatProcessorFactory = createCheatProcessorFactory(
    suite,
    genericNameToTag
  );

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

function getConfig(): {dataPath: string} {
  const processorFactory = new TestProcessors([
    {
      name: 'nop',
      description: 'does nothing',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      create: (w: World, d: string) => nopProcessor,
    },
  ]);
  const logger = new NopLogger();
  const app = new TestRunnerApplication('tempory', processorFactory, logger);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (app as any).processArguments(process.argv);
  return config;
}

go();
