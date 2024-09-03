import { Schema } from "@effect/schema"
import {
  User,
  UserIdFromString,
  UserNotFound,
  UserWithSensitive,
} from "../Domain/User.js"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Unauthorized } from "../Domain/Policy.js"
import { security } from "./Security.js"

export class AccountsApi extends HttpApiGroup.make("accounts").pipe(
  HttpApiGroup.add(
    HttpApiEndpoint.patch("updateUser", "/users/:id").pipe(
      HttpApiEndpoint.setPath(Schema.Struct({ id: UserIdFromString })),
      HttpApiEndpoint.setSuccess(User.json),
      HttpApiEndpoint.addError(UserNotFound),
      HttpApiEndpoint.setPayload(
        Schema.partialWith(User.jsonUpdate, { exact: true }),
      ),
    ),
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.get("getUserMe", "/users/me").pipe(
      HttpApiEndpoint.setSuccess(UserWithSensitive.json),
    ),
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.get("getUser", "/users/:id").pipe(
      HttpApiEndpoint.setPath(Schema.Struct({ id: UserIdFromString })),
      HttpApiEndpoint.setSuccess(User.json),
      HttpApiEndpoint.addError(UserNotFound),
    ),
  ),
  HttpApiGroup.annotateEndpoints(OpenApi.Security, security),
  HttpApiGroup.addError(Unauthorized),
  // unauthenticated
  HttpApiGroup.add(
    HttpApiEndpoint.post("createUser", "/users").pipe(
      HttpApiEndpoint.setSuccess(UserWithSensitive.json),
      HttpApiEndpoint.setPayload(User.jsonCreate),
    ),
  ),
  OpenApi.annotate({
    title: "Accounts",
    description: "Manage user accounts",
  }),
) {}
