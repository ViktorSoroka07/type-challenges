import type { Quiz } from '../../types'
import { locale, t } from '../../locales'
import { toCommentBlock } from './toCommentBlock'
import { toInfoHeader } from './toInfoHeader'
import { toDivider } from './toDivider'
import { toFooter } from './toFooter'

export function formatToCode(quiz: Quiz) {
  return `${toCommentBlock(
    toInfoHeader(quiz)
    + (quiz.readme[locale]),
  )
  + toDivider(t('divider.code-start'))
  }\n${
    (quiz.template || '').trim()
  }\n${
    toDivider(t('divider.test-cases'))
  }${
    (quiz.tests || '').trim()
  }\n${toCommentBlock(toFooter())}`
}
