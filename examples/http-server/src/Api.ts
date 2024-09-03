import { HttpApi, OpenApi } from "@effect/platform"
import { AccountsApi } from "./Api/Accounts.js"
import { GroupsApi } from "./Api/Groups.js"
import { PeopleApi } from "./Api/People.js"

export class Api extends HttpApi.empty.pipe(
  HttpApi.addGroup(AccountsApi),
  HttpApi.addGroup(GroupsApi),
  HttpApi.addGroup(PeopleApi),
  OpenApi.annotate({ title: "Groups API" }),
) {}
