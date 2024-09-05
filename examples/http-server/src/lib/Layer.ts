import type { Context } from "effect"
import { Effect, Layer } from "effect"

const makeUnimplemented = (id: string, prop: PropertyKey) => {
  const dead = Effect.die(`${id}: Unimplemented method "${prop.toString()}"`)
  function unimplemented() {
    return dead
  }
  Object.assign(unimplemented, dead)
  Object.setPrototypeOf(unimplemented, Object.getPrototypeOf(dead))
  return unimplemented
}

const makeUnimplementedProxy = <A extends object>(
  service: string,
  impl: Partial<A>
): A =>
  new Proxy({ ...impl } as A, {
    get(target, prop, _receiver) {
      if (prop in target) {
        return target[prop as keyof A]
      }
      return ((target as any)[prop] = makeUnimplemented(service, prop))
    },
    has: () => true
  })

export const makeTestLayer = <I, S extends object>(tag: Context.Tag<I, S>) => (service: Partial<S>): Layer.Layer<I> =>
  Layer.succeed(tag, makeUnimplementedProxy(tag.key, service))
