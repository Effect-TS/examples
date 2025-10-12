# Effect Monorepo Template - Server Package

Run the `dev` script in `@template/server` package to start the server

The server will start on `http://localhost:3000` by default.

## TODOs API Endpoints

The server provides few endpoints

### Create a new TODO

```sh
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"text": "my first effect todo"}'
```

### List all TODOs

```sh
curl -X GET http://localhost:3000/todos
```

### Get a specific TODO by ID

```sh
curl -X GET http://localhost:3000/todos/0
```

### Mark TODO completed

```sh
curl -X PATCH http://localhost:3000/todos/0
```

### Delete a specific TODO by ID

```sh
curl -X DELETE http://localhost:3000/todos/0
```
