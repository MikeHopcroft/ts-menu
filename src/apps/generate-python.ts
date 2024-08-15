import fs from 'fs';
import path from 'path';
import {loadLogicalValidationSuite, TextTurn} from 'prix-fixe';

import {Converter} from '../for-python/converter';

///////////////////////////////////////////////////////////////////////////////
//
// Converter application below
//
///////////////////////////////////////////////////////////////////////////////

const dataPath = 'samples/menu';
const suitePath = 'samples/tests/baseline.yaml';
const outPath = 'output';

const friendlyAttributeNames = new Map<string, string>([
  ['coffee_temperature', 'temperature'],
  ['coffee_size', 'size'],
  ['espresso_size', 'size'],
  ['option_quantity', 'amount'],
  ['', ''],
]);

function go(dataPath: string, suitePath: string, outPath: string) {
  const converter = new Converter(dataPath, friendlyAttributeNames);

  const pfSuite = loadLogicalValidationSuite<TextTurn>(suitePath);

  write(
    outPath,
    'defaults.json',
    JSON.stringify(converter.createDefaults(), null, 2)
  );
  write(
    outPath,
    'suite.json',
    JSON.stringify(converter.convertTestSuite(pfSuite), null, 2)
  );
  write(outPath, 'menu.ts', converter.createTypeScriptMenu());

  // console.log(JSON.stringify(converter.createDefaults(), null, 2));
  // console.log(JSON.stringify(converter.convertTestSuite(pfSuite), null, 2));
  // console.log(converter.createTypeScriptMenu());
}

function write(outPath: string, name: string, data: string) {
  const filename = path.join(outPath, name);
  // console.log('=====================================');
  console.log(`Writing to ${filename}`);
  fs.writeFileSync(filename, data, 'utf-8');
  // console.log(data);
  
}

go(dataPath, suitePath, outPath);

// https://stackoverflow.com/questions/37040026/typescript-compilation-extremely-slow-12s
// https://github.com/microsoft/TypeScript/wiki/Performance
