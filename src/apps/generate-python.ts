interface PythonTestSuite {
  cases: PythonTestCase[];
}

interface PythonTestCase {
  turns: PythonTestTurn[];
}

interface PythonTestTurn {
  query: string;
  expected: PythonCart;
}

interface PythonCart {
  items: PythonItem[];
}

type PythonItem = {
  name: string;
  quantity: number;
  options?: PythonItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>;
