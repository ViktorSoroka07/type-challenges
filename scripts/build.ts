import path from 'node:path'
import fs from 'fs-extra'
import { loadQuizes, resolveInfo } from './loader'
import { toPlaygroundUrl, toQuestionsRawREADME, toQuizREADME, toRawREADME, toShareAnswerFull, toSolutionsFull } from './toUrl'
import { locale } from './locales'
import { formatToCode } from './actions/utils/formatToCode'

export async function build() {
  const quizes = await loadQuizes()
  const redirects: [string, string, number][] = []

  redirects.push([`/raw/${locale}`, toQuestionsRawREADME(), 302])

  for (const quiz of quizes) {
    const info = resolveInfo(quiz)
    const code = formatToCode(quiz)
    const url = toPlaygroundUrl(code, info.tsconfig || {})

    redirects.push([`/${quiz.no}`, toQuizREADME(quiz, true), 302])
    redirects.push([`/${quiz.no}/raw`, toRawREADME(quiz), 302])
    redirects.push([`/${quiz.no}/play`, url, 302])
    redirects.push([`/${quiz.no}/answer`, toShareAnswerFull(quiz), 302])

    redirects.push([`/${quiz.no}/solutions`, toSolutionsFull(quiz.no), 302])
  }

  const dist = path.resolve(__dirname, 'dist')

  await fs.remove(dist)
  await fs.ensureDir(dist)

  await fs.writeFileSync(path.join(dist, '_redirects'), redirects.map(i => i.join('\t')).join('\n'), 'utf-8')
}

build()
