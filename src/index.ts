import {
  Compiler,
  ICompilerOptions,
  IInterpreterOptions,
  Interpreter,
} from "./core";

export * from "./core";

/**
 * Executes code in either "compile" or "interpreter" mode.
 *
 * @template T - The mode of execution, either "compile" or "interpreter".
 * @param code - The source code to be processed.
 * @param mode - Specifies the execution mode:
 *  - `"compile"`: Compiles the code and returns the generated output.
 *  - `"interpreter"`: Interprets the code and returns the execution result.
 * @param opts - Optional configuration object:
 *  - For `"compile"`, accepts `Partial<ICompilerOptions>`.
 *  - For `"interpreter"`, accepts `Partial<IInterpreterOptions>`.
 *
 * @returns Depending on the `mode` parameter:
 *  - `"compile"`: Returns an object containing the compiled code and execution time.
 *  - `"interpreter"`: Returns an object containing the internal state and output of the interpreter.
 *
 * @throws {TypeError} If the `mode` is neither `"compile"` nor `"interpreter"`.
 */
export default function run<T extends "compile" | "interpreter">(
  code: string,
  mode: T,
  opts?: Partial<T extends "compile" ? ICompilerOptions : IInterpreterOptions>,
): T extends "compile"
  ? ReturnType<Compiler["run"]>
  : T extends "interpreter"
    ? ReturnType<Interpreter["run"]>
    : never {
  if (mode === "compile") {
    // Compile the code using the Compiler class and run it
    return Compiler.Compile(
      code,
      opts as Partial<ICompilerOptions>,
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
