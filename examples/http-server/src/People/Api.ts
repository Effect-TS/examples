import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Schema } from "effect"
import { Authentication } from "../Accounts/Api.js"
import { GroupIdFromString, GroupNotFound } from "../Domain/Group.js"
import { Person, PersonIdFromString, PersonNotFound } from "../Domain/Person.js"

export class PeopleApi extends HttpApiGroup.make("people")
  .prefix("/people")
  .add(
    HttpApiEndpoint.post("create", "/groups/:groupId/people")
      .setPath(Schema.Struct({ groupId: GroupIdFromString }))
      .addSuccess(Person.json)
      .setPayload(Person.jsonCreate)
      .addError(GroupNotFound)
  )
  .add(
    HttpApiEndpoint.get("findById", "/people/:id")
      .setPath(Schema.Struct({ id: PersonIdFromString }))
      .addSuccess(Person.json)
      .addError(PersonNotFound)
  )
  .middleware(Authentication)
  .annotate(OpenApi.Title, "People")
  .annotate(OpenApi.Description, "Manage people")
{}
