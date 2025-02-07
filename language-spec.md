# Leziscript Language Specification  

This document provides a detailed breakdown of the syntax, semantics, and structure of the **Leziscript (LZS)** esolang.  

---

## Table of Contents  
1. [Introduction](#introduction)  
2. [Working Principle](#working-principle)  
   - [Basic](#basic)  
   - [Advanced](#advanced)  
     - [Loops](#loops)  
     - [Delete](#delete)  
     - [Copy and Next](#copy-and-next)  
     - [Run Another File](#run-another-file)  
3. [Code Examples](#code-examples)  

---

## Introduction  

**Leziscript (LZS)** is a minimalist esoteric programming language designed for simplicity and fun. It can either be interpreted directly or transpiled to JavaScript for execution.  

The language operates on an array of bits and a pointer that navigates and manipulates them. It shares some similarities with Brainf**k but is more focused on binary manipulation and unique control structures.  

---

## Working Principle  

### Basic  

- Leziscript uses **binary representations** of ASCII characters.  
- Symbols `[]` and `[[]]` represent binary `0` and `1`, respectively:  
  - `[]` is `0`  
  - `[[]]` is `1`  
- For example:  
  - `[[]][][[]][[]]` represents the binary string `1011`.  
  - The letter **H** in binary (`1001000`) would be represented as `[[]][][][[]][][][]`.  
- The pointer can be moved using `>` or `<`.  
- The current character (the bit at the pointer's position) can be printed using `.`.  

#### Example: Print "Hi"  
```
[[]][][][[]][][][].>[[]][[]][][[]][][][[]].  
```

---

### Advanced  

#### Loops  

Loops allow you to repeat commands and shorten your code.  
- A loop runs command **m** for **n** times.  
  - Syntax: `[n]m` or `[n](m)`  
  - Example: `[??!][[]]`  
    - `n` is the value inside the first set of brackets (`??!`)  
    - `m` is the command after the brackets (`[[]]`)  
- **n** is represented using a combination of `?` and `!`:  
  - `?` = 2  
  - `!` = 1  
- To parse **n**, sum the values of all `?` and `!`.  
  - Example: `??!` = `2 + 2 + 1 = 5`  
- Thus, `[??!][[]]` repeats `[[]]` five times, resulting in `[[]][[]][[]][[]][[]]`, or `11111` in binary.  

---

#### Delete  

Deletes a bit at the current pointer position.  
- Syntax: `!`  
- Example:  
  ```
  [[]][][[]]![][[]]  // Equivalent to [[]][][][[]]  
  ```
  In binary terms: `101!01` becomes `1001`.  

---

#### Copy and Next  

Copies the value at the current pointer and sets it at the next pointer position.  
- Syntax: `:`  
- Example:  
  ```
  [[]][]:[]  // Equivalent to [[]][]>[[]][][]
  ```

---

#### Run Another File  

Includes and runs another Leziscript file.  
- Syntax: `@(filename)`  
- Example:  
  ```
  @(helloWorld.lzs)
  ```
  You can use `#` at the beginning of the filename to refer to the current working directory (similar to `process.cwd()` in JavaScript).  

---

## Code Examples  

You can find more examples in the [`scripts`](https://github.com/user-lezi/leziscript-esolang/tree/main/scripts) folder.  
