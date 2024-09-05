import * as Ansi from "@effect/printer-ansi/Ansi"
import * as AnsiDoc from "@effect/printer-ansi/AnsiDoc"
import * as Array from "effect/Array"
import * as Logger from "effect/Logger"

export const AnsiDocLogger = Logger.make(({ message }) => {
  const messageArr = Array.ensure(message)
  for (let i = 0; i < messageArr.length; i++) {
    const currentMessage = messageArr[i]
    if (AnsiDoc.isDoc(currentMessage)) {
      const prefix = AnsiDoc.text("create-effect-app").pipe(
        AnsiDoc.annotate(Ansi.cyan),
        AnsiDoc.squareBracketed,
        AnsiDoc.cat(AnsiDoc.colon)
      )
      const document = AnsiDoc.catWithSpace(prefix, currentMessage as AnsiDoc.AnsiDoc)
      globalThis.console.log(AnsiDoc.render(document, { style: "pretty" }))
    }
  }
})
