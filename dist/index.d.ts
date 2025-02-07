import { Compiler, ICompilerOptions, IInterpreterOptions, Interpreter } from "./core";
export * from "./core";
export default function run<T extends "compile" | "interpreter">(code: string, mode: T, opts?: Partial<T extends "compile" ? ICompilerOptions : IInterpreterOptions>): T extends "compile" ? ReturnType<Compiler["run"]> : T extends "interpreter" ? ReturnType<Interpreter["run"]> : never;
//# sourceMappingURL=index.d.ts.map