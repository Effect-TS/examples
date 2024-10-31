import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Schema } from "effect"
import { Authentication } from "../Accounts/Api.js"
import { Group, GroupIdFromString, GroupNotFound } from "../Domain/Group.js"

export class GroupsApi extends HttpApiGroup.make("groups")
  .add(
    HttpApiEndpoint.post("create", "/")
      .addSuccess(Group.json)
      .setPayload(Group.jsonCreate)
  )
  .add(
    HttpApiEndpoint.patch("update", "/:id")
      .setPath(Schema.Struct({ id: GroupIdFromString }))
      .addSuccess(Group.json)
      .setPayload(Group.jsonUpdate)
      .addError(GroupNotFound)
  )
  .middleware(Authentication)
  .prefix("/groups")
  .annotate(OpenApi.Title, "Groups")
  .annotate(OpenApi.Description, "Manage groups")
{}
