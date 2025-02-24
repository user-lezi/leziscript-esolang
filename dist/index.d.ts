import { Transpiler, ITranspilerOptions, IInterpreterOptions, Interpreter } from "./core";
export * from "./core";
export default function run<T extends "transpile" | "interpreter">(code: string, mode: T, opts?: Partial<T extends "transpile" ? ITranspilerOptions : IInterpreterOptions>): T extends "transpile" ? ReturnType<Transpiler["run"]> : T extends "interpreter" ? ReturnType<Interpreter["run"]> : never;
//# sourceMappingURL=index.d.ts.map