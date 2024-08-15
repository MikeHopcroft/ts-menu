export interface PythonTestSuite {
  cases: PythonTestCase[];
}

export interface PythonTestCase {
  turns: PythonTestTurn[];
}

interface PythonTestTurn {
  query: string;
  expected: PythonCart;
}

export interface PythonCart {
  items: PythonItem[];
}

export type PythonItem = {
  name: string;
  quantity: number;
  options?: PythonItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>;
