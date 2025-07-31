import { every, object, Parser } from "./index";
import { saferStringify } from "../utils";
import { IParser, OnParse } from "./interfaces";
import { ShapeParser } from "./shape-parser";

export type DeepPartial<T> =
  T extends [infer A, ...infer Rest] ? [DeepPartial<A>, ...DeepPartial<Rest>]
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// /**
//  * Given that we have a Parser, we want to convert recursively all the types into
//  * a partial
//  * @param testShape
//  * @returns
//  */
// export function deepPartial<A, B>(
//   testShape: IParser<A, B>,
// ): Parser<A, DeepPartial<B>> {
//   if (testShape.description.name === "Shape") {
//     const { children, extras } = testShape.description;
//     return {description: {}
//       name: "Partial",
//       children: children.map((child) => deepPartial(child)),
//       extras: extras,
//     };
//   }

//   const entries = Object.entries(testShape || {}) as Array<
//     [keyof A, Parser<unknown, A[keyof A]>]
//   >;
//   const [full, partials] = entries.reduce(
//     ([full, partials], [key, parser]) =>
//       parser.retryable() ?
//         [full, [...partials, [key, parser]] as typeof entries]
//       : [[...full, [key, parser]] as typeof entries, partials],
//     [[] as typeof entries, [] as typeof entries],
//   );
//   if (!partials.length) {
//     return isShape(testShape || {}) as any as Parser<
//       unknown,
//       WithOptionalKeys<A>
//     >;
//   } else {
//     const partialParser = partial(Object.fromEntries(partials)).map((ret) => {
//       for (const [key, parser] of partials) {
//         const keyAny = key as any;
//         if (!(keyAny in ret)) {
//           const newValue = parser.unsafeCast(undefined);
//           if (newValue !== undefined) {
//             ret[keyAny] = newValue;
//           }
//         }
//       }
//       return ret;
//     });
//     if (!full.length) {
//       return partialParser as any as Parser<unknown, WithOptionalKeys<A>>;
//     } else {
//       return every(
//         partialParser,
//         isShape(Object.fromEntries(full)),
//       ) as any as Parser<unknown, WithOptionalKeys<A>>;
//     }
//   }
// }
