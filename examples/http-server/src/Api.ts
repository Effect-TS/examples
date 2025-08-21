import { HttpApi, OpenApi } from "@effect/platform"
import { AccountsApi } from "./Accounts/Api.js"
import { GroupsApi } from "./Groups/Api.js"
import { PeopleApi } from "./People/Api.js"

export class Api extends HttpApi.make("api")
  .add(AccountsApi)
  .add(GroupsApi)
  .add(PeopleApi)
  .annotate(OpenApi.Title, "Groups API")
{}
