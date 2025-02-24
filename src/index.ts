import {
  Transpiler,
  ITranspilerOptions,
  IInterpreterOptions,
  Interpreter,
} from "./core";

export * from "./core";

/**
 * Executes code in either "transpile" or "interpreter" mode.
 *
 * @template T - The mode of execution, either "transpile" or "interpreter".
 * @param code - The source code to be processed.
 * @param mode - Specifies the execution mode:
 *  - `"transpile"`: Transpiles the code and returns the generated output.
 *  - `"interpreter"`: Interprets the code and returns the execution result.
 * @param opts - Optional configuration object:
 *  - For `"transpile"`, accepts `Partial<ITranspilerOptions>`.
 *  - For `"interpreter"`, accepts `Partial<IInterpreterOptions>`.
 *
 * @returns Depending on the `mode` parameter:
 *  - `"transpile"`: Returns an object containing the transpiled code and execution time.
 *  - `"interpreter"`: Returns an object containing the internal state and output of the interpreter.
 *
 * @throws {TypeError} If the `mode` is neither `"transpile"` nor `"interpreter"`.
 */
export default function run<T extends "transpile" | "interpreter">(
  code: string,
  mode: T,
  opts?: Partial<
    T extends "transpile" ? ITranspilerOptions : IInterpreterOptions
  >,
): T extends "transpile"
  ? ReturnType<Transpiler["run"]>
  : T extends "interpreter"
    ? ReturnType<Interpreter["run"]>
    : never {
  if (mode === "transpile") {
    // Transpile the code using the Transpiler class and run it
    return Transpiler.Transpile(
      code,
      opts as Partial<ITranspilerOptions>,
    ).run() as any;
  } else if (mode === "interpreter") {
    // Interpret the code using the Interpreter class and run it
    return Interpreter.Interpret(
      code,
      opts as Partial<IInterpreterOptions>,
    ).run() as any;
  } else {
    // Throw an error for an invalid execution mode
    throw new TypeError(`Invalid Mode`);
  }
}
