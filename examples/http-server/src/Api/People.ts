import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Schema } from "@effect/schema"
import { GroupIdFromString, GroupNotFound } from "../Domain/Group.js"
import { Person } from "../Domain/Person.js"
import { Unauthorized } from "../Domain/Policy.js"
import { security } from "./Security.js"

export class PeopleApi extends HttpApiGroup.make("people").pipe(
  HttpApiGroup.prefix("/people"),
  HttpApiGroup.add(
    HttpApiEndpoint.post("create", "/groups/:groupId/people").pipe(
      HttpApiEndpoint.setPath(Schema.Struct({ groupId: GroupIdFromString })),
      HttpApiEndpoint.setSuccess(Person.json),
      HttpApiEndpoint.setPayload(Person.jsonCreate),
      HttpApiEndpoint.addError(GroupNotFound)
    )
  ),
  HttpApiGroup.addError(Unauthorized),
  OpenApi.annotate({
    title: "People",
    description: "Manage people",
    security
  })
) {}
