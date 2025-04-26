import type { Quiz } from '../../types'
import { t } from '../../locales'
import { resolveInfo } from '../../loader'

export const toInfoHeader = function toInfoHeader(quiz: Quiz) {
  const info = resolveInfo(quiz)

  return `${quiz.no} - ${info.title || ''}\n`
    + '-------\n'
    + `#${t(`difficulty.${quiz.difficulty}`)} ${info?.tags?.map(i => `#${i}`).join(' ') || ''}\n\n`
    + `### ${t('title.question')}\n\n`
}
