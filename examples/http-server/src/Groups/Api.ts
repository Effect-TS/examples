import { Group, GroupIdFromString, GroupNotFound } from "../Domain/Group.js"
import { Schema } from "@effect/schema"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Unauthorized } from "../Domain/Policy.js"
import { security } from "../Api/Security.js"

export class GroupsApi extends HttpApiGroup.make("groups").pipe(
  HttpApiGroup.add(
    HttpApiEndpoint.post("create", "/").pipe(
      HttpApiEndpoint.setSuccess(Group.json),
      HttpApiEndpoint.setPayload(Group.jsonCreate),
    ),
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.patch("update", "/:id").pipe(
      HttpApiEndpoint.setPath(Schema.Struct({ id: GroupIdFromString })),
      HttpApiEndpoint.setSuccess(Group.json),
      HttpApiEndpoint.setPayload(Group.jsonUpdate),
      HttpApiEndpoint.addError(GroupNotFound),
    ),
  ),
  HttpApiGroup.prefix("/groups"),
  HttpApiGroup.addError(Unauthorized),
  OpenApi.annotate({
    title: "Groups",
    description: "Manage groups",
    security,
  }),
) {}
