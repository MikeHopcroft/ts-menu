// Investigation of motivation for type tag in menu items

// interface A {
//   // tag: 'A';
//   names: 'abc' | 'apple';
//   a: number;
// }

// interface B {
//   // tag: 'B';
//   names: 'bag' | 'butterfly';
//   b: number;
// }

// type X = A | B;

// const y = {tag: 'A', names: 'abc', a: 1} as const;
// const x: X = y;

// function processA(a: A): void {}

// function processB(b: B): void {}

// function processX(x: A | B) {
//   if (x.names === 'bag' || x.names === 'butterfly') {
//     x.b = 1;
//     x.names;
//     processB(x);
//   } else {
//     x.names;

//     // Error: TypeScript can not narrow (A|B) to A
//     x.a = 1;
//     processA(x);
//   }
// }
