import path from 'path';
import {
  CatalogSpec,
  DimensionSpec,
  GroupSpec,
  ItemSpec,
  loadCatalogFile,
} from 'prix-fixe';

interface GroupInfo {
  tag: string;
  parent: GroupSpec;
  children: ItemSpec[];
  isOption: boolean;
}

interface Product {
  name: string;
  dimensions: string[];
  exclusives: string[];
  options: string[];
}

function getDimension(
  catalog: CatalogSpec,
  name: string | undefined
): DimensionSpec | undefined {
  for (const d of catalog.dimensions) {
    if (d.name === name) {
      return d;
    }
  }
  return undefined;
}

function getTensor(catalog: CatalogSpec, name: string | undefined) {
  for (const t of catalog.tensors) {
    if (t.name === name) {
      return t;
    }
  }
  return undefined;
}

function toTypeName(name: string) {
  return name
    .split('_')
    .map(x => x[0].toUpperCase() + x.slice(1))
    .join('');
}

function toStringLiteralUnion(names: string[]) {
  return names.map(n => JSON.stringify(n)).join(' | ');
}

function formatDimension(dimension: DimensionSpec) {
  return `type ${toTypeName(dimension.name)} = ${toStringLiteralUnion(
    dimension.attributes.map(a => a.name)
  )}`;
}

function formatDimensions(catalog: CatalogSpec) {
  for (const d of catalog.dimensions) {
    console.log(formatDimension(d));
    console.log();
  }
}

function formatGroupInfo(catalog: CatalogSpec, info: GroupInfo) {
  console.log(`interface ${toTypeName(info.tag)} {`);
  console.log(
    `  name: ${info.children.map(x => JSON.stringify(x.name)).join(' | ')};`
  );
  if (info.parent.tensor && info.parent.tensor !== 'none') {
    // console.log(`  dimensions: ${JSON.stringify(info.parent.tensor)}`);

    const tensor = getTensor(catalog, info.parent.tensor);
    if (tensor) {
      for (const dimensionName of tensor.dimensions) {
        console.log(`  ${dimensionName}: ${toTypeName(dimensionName)};`);
        // const dimension = getDimension(catalog, dimensionName);
        // if (dimension) {
        //   const values = dimension.attributes
        //     .map(a => JSON.stringify(a.name))
        //     .join(' | ');
        //   console.log(`    ${dimensionName}: ${values}`);
        // }
      }
    }
  }

  // const tensorName = info.parent.tensor;
  // if (tensorName) {
  //   for (const t of catalog.tensors) {
  //     if (t.name === tensorName) {
  //       for (const dimensionName of t.dimensions) {
  //         console.log(`    ${dimensionName}:`);
  //       }
  //     }
  //   }
  // }
  console.log('}\n');
}

function* generateGroups3(
  groups: GroupSpec[],
  isOption = false
): Generator<GroupInfo> {
  for (const group of groups) {
    if (group.type === 'option') {
      if ('items' in group) {
        yield* generateGroups3(group.items, true);
      }
    } else if ('items' in group) {
      if (group.tags) {
        yield {
          tag: group.tags[0],
          parent: group,
          children: group.items as ItemSpec[],
          isOption: false,
        };
      } else {
        console.log('skip');
      }
    } else {
      console.log('pass');
    }
  }
}

// function* generateGroups2(groups: GroupSpec[]): Generator<GroupInfo> {
//   for (const group of groups) {
//     if ('items' in group) {
//       if (group.tags) {
//         yield {tag: group.tags[0], parent: group, children: group.items};
//       } else if (group.type === 'option') {
//         yield* generateGroups2(group.items);
//       } else {
//         console.log('skip');
//       }
//     } else {
//       console.log('pass');
//     }
//   }
// }

// function* generateGroups(groups: GroupSpec[]): Generator<GroupSpec> {
//   for (const group of groups) {
//     if ('items' in group) {
//       if (group.tags) {
//         yield group;
//         yield* generateGroups(group.items);
//       } else if (group.type === 'option') {
//         yield* generateGroups(group.items);
//       } else {
//         console.log('skip');
//       }
//     } else {
//       yield group;
//     }
//   }
// }

function go() {
  const dataPath = 'samples/menu';
  const catalog = loadCatalogFile(path.join(dataPath, 'menu.yaml'));
  for (const info of generateGroups3(catalog.catalog)) {
    formatGroupInfo(catalog, info);
    // console.log(`${info.tag}${info.isOption ? ' (option)' : ''}`);
    // for (const child of info.children) {
    //   console.log('  ' + child.name);
    // }

    // if ('name' in group) {
    //   console.log(`name: ${group.name}`);
    // } else if (group.tags && group.tags.length > 0) {
    //   console.log(`tag: ${group.tags[0]}`);
    // } else {
    //   console.log('other');
    // }
  }

  formatDimensions(catalog);
  // for (const group of catalog.catalog) {
  //   if (group.tags) {
  //     console.log(group.tags![0]);
  //   } else if (group.type === 'option') {
  //     console.log('type is option');
  //     console.log(JSON.stringify(group, null, 2));
  //   } else {
  //     console.log('undefined tags');
  //   }
  //   if ('items' in group) {
  //     for (const item of group.items) {
  //       if ('name' in item) {
  //         console.log('  ' + item.name);
  //       } else {
  //         // console.log(item.tags![0]);
  //       }
  //     }
  //   }
  // }

  //   const world = createWorld(dataPath);
  //   console.log(JSON.stringify(world, null, 2));
}

go();
