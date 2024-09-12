import { HttpApi, OpenApi } from "@effect/platform"
import { AccountsApi } from "./Accounts/Api.js"
import { GroupsApi } from "./Groups/Api.js"
import { PeopleApi } from "./People/Api.js"

export class Api extends HttpApi.empty.pipe(
  HttpApi.addGroup(AccountsApi),
  HttpApi.addGroup(GroupsApi),
  HttpApi.addGroup(PeopleApi),
  OpenApi.annotate({ title: "Groups API" }),
) {}
