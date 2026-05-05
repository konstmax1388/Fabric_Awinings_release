import { Fragment } from 'react'

/** Литералы `<br>`, `<br/>`, `<br />` в тексте из админки → перенос строки. Прочий HTML не разбирается (остаётся обычным текстом или экранируется React). */
export function TextWithBr({ children, text }: { children?: string; text?: string }) {
  const content = text ?? children ?? ''
  const parts = content.split(/<br\s*\/?>/gi)
  if (parts.length === 1) {
    return <>{parts[0]}</>
  }
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {part}
        </Fragment>
      ))}
    </>
  )
}
