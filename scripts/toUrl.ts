import lzs from 'lz-string'
import type { Quiz } from './types'
import { locale } from './locales'
import { resolveInfo } from './loader'

export const REPO = 'https://github.com/type-challenges/type-challenges'
export const DOMAIN = 'https://tsch.js.org'
export const TYPESCRIPT_PLAYGROUND = 'https://www.typescriptlang.org/play'

// https://github.com/microsoft/TypeScript-Website/tree/v2/packages/playground
export function toPlaygroundUrl(
  code: string,
  config: Object = {},
  site = TYPESCRIPT_PLAYGROUND,
) {
  return `${site}?${Object.entries(config).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}#code/${lzs.compressToEncodedURIComponent(code)}`
}

export function toSolutionsFull(no: number) {
  return `${REPO}/issues?q=label%3A${no}+label%3Aanswer+sort%3Areactions-%2B1-desc`
}

export function toQuizREADME(quiz: Quiz, absolute = false) {
  const prefix = absolute ? `${REPO}/blob/main` : '.'
  return `${prefix}/questions/${quiz.path}/README.md`
}

export function toRawREADME(quiz: Quiz) {
  const provider = 'https://cdn.jsdelivr.net/gh/type-challenges/type-challenges'
  return `${provider}/questions/${quiz.path}/README.md`
}

export function toQuestionsRawREADME() {
  const provider = 'https://cdn.jsdelivr.net/gh/type-challenges/type-challenges'
  return `${provider}/README.md`
}

export function toNearborREADME() {
  return './README.md'
}

export function toShareAnswerFull(quiz: Quiz) {
  const info = resolveInfo(quiz)

  return `https://github.com/type-challenges/type-challenges/issues/new?labels=answer,${encodeURIComponent(locale)}&template=0-answer.md&title=${encodeURIComponent(`${quiz.no} - ${info.title}`)}`
}

// Short

export function toReadmeShort(no: number) {
  return `${DOMAIN}/${no}`
}

export function toPlayShort(no: number) {
  return `${DOMAIN}/${no}/play`
}

export function toHomepageShort() {
  return `${DOMAIN}`
}
