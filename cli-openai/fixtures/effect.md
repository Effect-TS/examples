---
title: Introduction to Effect's Control Flow Operators
navTitle: Control Flow
excerpt: Effect is a powerful TypeScript library designed to help developers easily create complex, synchronous, and asynchronous programs.
bottomNavigation: pagination
---

Even though JavaScript provides built-in control flow structures, Effect offers additional control flow functions that are useful in Effect applications. In this section, we will introduce different ways to control the flow of execution.

## if Expression

When working with Effect values, we can use the standard JavaScript if-then-else expressions:

```ts twoslash
import { Effect, Option } from "effect"

const validateWeightOption = (
  weight: number
): Effect.Effect<Option.Option<number>> => {
  if (weight >= 0) {
    return Effect.succeed(Option.some(weight))
  } else {
    return Effect.succeed(Option.none())
  }
}
```

Here we are using the [`Option`](./data-types/option.mdx) data type to represent the absence of a valid value.

We can also handle invalid inputs by using the error channel:

```ts twoslash
import { Effect } from "effect"

const validateWeightOrFail = (
  weight: number
): Effect.Effect<number, string> => {
  if (weight >= 0) {
    return Effect.succeed(weight)
  } else {
    return Effect.fail(`negative input: ${weight}`)
  }
}
```

## Conditional Operators

### when

Instead of using `if (condition) expression`, we can use the `Effect.when` function:

```ts twoslash
import { Effect, Option } from "effect"

const validateWeightOption = (
  weight: number
): Effect.Effect<Option.Option<number>> =>
  Effect.succeed(weight).pipe(Effect.when(() => weight >= 0))
```

Here we are using the [`Option`](./data-types/option.mdx) data type to represent the absence of a valid value.

If the condition evaluates to `true`, the effect inside the `Effect.when` will be executed and the result will be wrapped in a `Some`, otherwise it returns `None`:

```ts twoslash
import { Effect, Option } from "effect"

const validateWeightOption = (
  weight: number
): Effect.Effect<Option.Option<number>> =>
  Effect.succeed(weight).pipe(Effect.when(() => weight >= 0))

// ---cut---
Effect.runPromise(validateWeightOption(100)).then(console.log)
/*
Output:
{
  _id: "Option",
  _tag: "Some",
  value: 100
}
*/

Effect.runPromise(validateWeightOption(-5)).then(console.log)
/*
Output:
{
  _id: "Option",
  _tag: "None"
}
*/
```

If the condition itself involves an effect, we can use `Effect.whenEffect`.

For example, the following function creates a random option of an integer value:

```ts twoslash
import { Effect, Random } from "effect"

const randomIntOption = Random.nextInt.pipe(
  Effect.whenEffect(Random.nextBoolean)
)
```

### unless

The `Effect.unless` and `Effect.unlessEffect` functions are similar to the `when*` functions, but they are equivalent to the `if (!condition) expression` construct.

### if

The `Effect.if` function allows you to provide an effectful predicate. If the predicate evaluates to `true`, the `onTrue` effect will be executed. Otherwise, the `onFalse` effect will be executed.

Let's use this function to create a simple virtual coin flip function:

```ts twoslash
import { Effect, Random, Console } from "effect"

const flipTheCoin = Effect.if(Random.nextBoolean, {
  onTrue: Console.log("Head"),
  onFalse: Console.log("Tail")
})

Effect.runPromise(flipTheCoin)
```

In this example, we generate a random boolean value using `Random.nextBoolean`. If the value is `true`, the effect `onTrue` will be executed, which logs "Head". Otherwise, if the value is `false`, the effect `onFalse` will be executed, logging "Tail".

## Loop Operators

### loop

The `Effect.loop` function allows you to repeatedly change the state based on an `step` function until a condition given by the `while` function is evaluated to `true`:

```ts
Effect.loop(initial, options: { while, step, body })
```

It collects all intermediate states in an array and returns it as the final result.

We can think of `Effect.loop` as equivalent to a `while` loop in JavaScript:

```ts
let state = initial
const result = []

while (options.while(state)) {
  result.push(options.body(state))
  state = options.step(state)
}

return result
```

**Example**

```ts twoslash
import { Effect } from "effect"

const result = Effect.loop(
  1, // Initial state
  {
    while: (state) => state <= 5, // Condition to continue looping
    step: (state) => state + 1, // State update function
    body: (state) => Effect.succeed(state) // Effect to be performed on each iteration
  }
)

Effect.runPromise(result).then(console.log) // Output: [1, 2, 3, 4, 5]
```

In this example, the loop starts with an initial state of `1`. The loop continues as long as the condition `n <= 5` is `true`, and in each iteration, the state `n` is incremented by `1`. The effect `Effect.succeed(n)` is performed on each iteration, collecting all intermediate states in an array.

You can also use the `discard` option if you're not interested in collecting the intermediate results. It discards all intermediate states and returns `undefined` as the final result.

**Example** (`discard: true`)

```ts twoslash
import { Effect, Console } from "effect"

const result = Effect.loop(
  1, // Initial state
  {
    while: (state) => state <= 5, // Condition to continue looping,
    step: (state) => state + 1, // State update function,
    body: (state) => Console.log(`Currently at state ${state}`), // Effect to be performed on each iteration,
    discard: true
  }
)

Effect.runPromise(result).then(console.log)
/*
Output:
Currently at state 1
Currently at state 2
Currently at state 3
Currently at state 4
Currently at state 5
undefined
*/
```

In this example, the loop performs a side effect of logging the current index on each iteration, but it discards all intermediate results. The final result is `undefined`.

### iterate

The `Effect.iterate` function allows you to iterate with an effectful operation. It uses an effectful `body` operation to change the state during each iteration and continues the iteration as long as the `while` function evaluates to `true`:

```ts
Effect.iterate(initial, options: { while, body })
```

We can think of `Effect.iterate` as equivalent to a `while` loop in JavaScript:

```ts
let result = initial

while (options.while(result)) {
  result = options.body(result)
}

return result
```

Here's an example of how it works:

```ts twoslash
import { Effect } from "effect"

const result = Effect.iterate(
  1, // Initial result
  {
    while: (result) => result <= 5, // Condition to continue iterating
    body: (result) => Effect.succeed(result + 1) // Operation to change the result
  }
)

Effect.runPromise(result).then(console.log) // Output: 6
```

### forEach

The `Effect.forEach` function allows you to iterate over an `Iterable` and perform an effectful operation for each element.

The syntax for `forEach` is as follows:

```ts
import { Effect } from "effect"

const combinedEffect = Effect.forEach(iterable, operation, options)
```

It applies the given effectful operation to each element of the `Iterable`. By default, it executes each effect in **sequence** (to explore options for managing concurrency and controlling how these effects are executed, you can refer to the [Concurrency Options](./concurrency/concurrency-options.mdx) documentation).

This function returns a new effect that produces an array containing the results of each individual effect.

Let's take a look at an example:

```ts twoslash
import { Effect, Console } from "effect"

const result = Effect.forEach([1, 2, 3, 4, 5], (n, index) =>
  Console.log(`Currently at index ${index}`).pipe(Effect.as(n * 2))
)

Effect.runPromise(result).then(console.log)
/*
Output:
Currently at index 0
Currently at index 1
Currently at index 2
Currently at index 3
Currently at index 4
[ 2, 4, 6, 8, 10 ]
*/
```

In this example, we have an array `[1, 2, 3, 4, 5]`, and for each element we perform an effectful operation. The output shows that the operation is executed for each element in the array, displaying the current index.

The `Effect.forEach` combinator collects the results of each effectful operation in an array, which is why the final output is `[ 2, 4, 6, 8, 10 ]`.

We also have the `discard` option, which when set to `true` discards the results of each effectful operation:

```ts twoslash
import { Effect, Console } from "effect"

const result = Effect.forEach(
  [1, 2, 3, 4, 5],
  (n, index) =>
    Console.log(`Currently at index ${index}`).pipe(Effect.as(n * 2)),
  { discard: true }
)

Effect.runPromise(result).then(console.log)
/*
Output:
Currently at index 0
Currently at index 1
Currently at index 2
Currently at index 3
Currently at index 4
undefined
*/
```

In this case, the output is the same, but the final result is `undefined` since the results of each effectful operation are discarded.

### all

The `Effect.all` function in the Effect library is a powerful tool that allows you to merge multiple effects into a single effect, offering flexibility by working with various structured formats such as tuples, iterables, structs, and records.

The syntax for `all` is as follows:

```ts
import { Effect } from "effect"

const combinedEffect = Effect.all(effects, options)
```

where `effects` is a collection of individual effects that you wish to merge.

By default, the `all` function will execute each effect in **sequence** (to explore options for managing concurrency and controlling how these effects are executed, you can refer to the [Concurrency Options](./concurrency/concurrency-options.mdx) documentation).

It will return a new effect that produces a result with a shape that depends on the shape of the `effects` argument.

Let's explore examples for each supported shape: tuples, iterables, structs, and records.

#### Tuples

```ts twoslash
import { Effect, Console } from "effect"

const tuple = [
  Effect.succeed(42).pipe(Effect.tap(Console.log)),
  Effect.succeed("Hello").pipe(Effect.tap(Console.log))
] as const

const combinedEffect = Effect.all(tuple)

Effect.runPromise(combinedEffect).then(console.log)
/*
Output:
42
Hello
[ 42, 'Hello' ]
*/
```

#### Iterables

```ts twoslash
import { Effect, Console } from "effect"

const iterable: Iterable<Effect.Effect<number>> = [1, 2, 3].map((n) =>
  Effect.succeed(n).pipe(Effect.tap(Console.log))
)

const combinedEffect = Effect.all(iterable)

Effect.runPromise(combinedEffect).then(console.log)
/*
Output:
1
2
3
[ 1, 2, 3 ]
*/
```

#### Structs

```ts twoslash
import { Effect, Console } from "effect"

const struct = {
  a: Effect.succeed(42).pipe(Effect.tap(Console.log)),
  b: Effect.succeed("Hello").pipe(Effect.tap(Console.log))
}

const combinedEffect = Effect.all(struct)

Effect.runPromise(combinedEffect).then(console.log)
/*
Output:
42
Hello
{ a: 42, b: 'Hello' }
*/
```

#### Records

```ts twoslash
import { Effect, Console } from "effect"

const record: Record<string, Effect.Effect<number>> = {
  key1: Effect.succeed(1).pipe(Effect.tap(Console.log)),
  key2: Effect.succeed(2).pipe(Effect.tap(Console.log))
}

const combinedEffect = Effect.all(record)

Effect.runPromise(combinedEffect).then(console.log)
/*
Output:
1
2
{ key1: 1, key2: 2 }
*/
```

#### The Role of Short-Circuiting

When working with the `Effect.all` API, it's important to understand how it manages errors.
This API is designed to **short-circuit the execution** upon encountering the **first error**.

What does this mean for you as a developer? Well, let's say you have a collection of effects to be executed in sequence. If any error occurs during the execution of one of these effects, the remaining computations will be skipped, and the error will be propagated to the final result.

In simpler terms, the short-circuiting behavior ensures that if something goes wrong at any step of your program it will immediately stop and return the error to let you know that something went wrong.

```ts twoslash
import { Effect, Console } from "effect"

const effects = [
  Effect.succeed("Task1").pipe(Effect.tap(Console.log)),
  Effect.fail("Task2: Oh no!").pipe(Effect.tap(Console.log)),
  Effect.succeed("Task3").pipe(Effect.tap(Console.log)) // this task won't be executed
]

const program = Effect.all(effects)

Effect.runPromiseExit(program).then(console.log)
/*
Output:
Task1
{
  _id: 'Exit',
  _tag: 'Failure',
  cause: { _id: 'Cause', _tag: 'Fail', failure: 'Task2: Oh no!' }
}
*/
```

You can override this behavior by using the `mode` option.

#### The mode option

When you use the `{ mode: "either" }` option with `Effect.all`, it modifies the behavior of the API to handle errors differently. Instead of short-circuiting the entire computation on the first error, it continues to execute all effects, collecting both successes and failures. The result is an array of `Either` instances, representing either a successful outcome (`Right`) or a failure (`Left`) for each individual effect.

Here's a breakdown:

```ts twoslash
import { Effect, Console } from "effect"

const effects = [
  Effect.succeed("Task1").pipe(Effect.tap(Console.log)),
  Effect.fail("Task2: Oh no!").pipe(Effect.tap(Console.log)),
  Effect.succeed("Task3").pipe(Effect.tap(Console.log))
]

const program = Effect.all(effects, { mode: "either" })

Effect.runPromiseExit(program).then(console.log)
/*
Output:
Task1
Task3
{
  _id: 'Exit',
  _tag: 'Success',
  value: [
    { _id: 'Either', _tag: 'Right', right: 'Task1' },
    { _id: 'Either', _tag: 'Left', left: 'Task2: Oh no!' },
    { _id: 'Either', _tag: 'Right', right: 'Task3' }
  ]
}
*/
```

On the other hand, when you use the `{ mode: "validate" }` option with `Effect.all`, it takes a similar approach to `{ mode: "either" }` but uses the `Option` type to represent the success or failure of each effect. The resulting array will contain `None` for successful effects and `Some` with the associated error message for failed effects.

Here's an illustration:

```ts twoslash
import { Effect, Console } from "effect"

const effects = [
  Effect.succeed("Task1").pipe(Effect.tap(Console.log)),
  Effect.fail("Task2: Oh no!").pipe(Effect.tap(Console.log)),
  Effect.succeed("Task3").pipe(Effect.tap(Console.log))
]

const program = Effect.all(effects, { mode: "validate" })

Effect.runPromiseExit(program).then((result) => console.log("%o", result))
/*
Output:
Task1
Task3
{
  _id: 'Exit',
  _tag: 'Failure',
  cause: {
    _id: 'Cause',
    _tag: 'Fail',
    failure: [
      { _id: 'Option', _tag: 'None' },
      { _id: 'Option', _tag: 'Some', value: 'Task2: Oh no!' },
      { _id: 'Option', _tag: 'None' }
    ]
  }
}
*/
```
