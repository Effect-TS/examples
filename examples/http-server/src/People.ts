import { Effect, Layer, pipe } from "effect"
import { PeopleRepo } from "./People/Repo.js"
import { Person } from "./Domain/Person.js"
import { policyRequire } from "./Domain/Policy.js"
import { GroupId } from "./Domain/Group.js"

const make = Effect.gen(function* () {
  const repo = yield* PeopleRepo

  const create = (groupId: GroupId, person: typeof Person.jsonCreate.Type) =>
    pipe(
      repo.insert(
        Person.insert.make({
          ...person,
          groupId,
        }),
      ),
      Effect.withSpan("People.create", { attributes: { person, groupId } }),
      policyRequire("Person", "create"),
    )

  return { create } as const
})

export class People extends Effect.Tag("People")<
  People,
  Effect.Effect.Success<typeof make>
>() {
  static layer = Layer.effect(People, make)
  static Live = this.layer.pipe(Layer.provide(PeopleRepo.Live))
}
