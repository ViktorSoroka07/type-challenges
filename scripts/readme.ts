import path from 'node:path'
import process from 'node:process'
import fs from 'fs-extra'
import { f, locale, t } from './locales'
import { loadQuizes, resolveInfo } from './loader'
import { toNearborREADME, toPlayShort, toQuizREADME } from './toUrl'
import type { Quiz } from './types'

const DifficultyColors: Record<string, string> = {
  warm: 'teal',
  easy: '7aad0c',
  medium: 'd9901a',
  hard: 'de3d37',
  extreme: 'b11b8d',
}

const DifficultyRank = [
  'warm',
  'easy',
  'medium',
  'hard',
  'extreme',
]

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function toBadgeURL(label: string, text: string, color: string, args = '') {
  return `https://img.shields.io/badge/${encodeURIComponent(label.replace(/-/g, '--'))}-${encodeURIComponent(text.replace(/-/g, '--'))}-${color}${args}`
}

function toBadge(label: string, text: string, color: string, args = '') {
  return `<img src="${toBadgeURL(label, text, color, args)}" alt="${text}"/>`
}

export function toBadgeLink(url: string, label: string, text: string, color: string, args = '') {
  return `<a href="${url}" target="_blank">${toBadge(label, text, color, args)}</a> `
}

export function toPlanTextLink(url: string, _label: string, text: string, _color: string, _args = '') {
  return `<a href="${url}" target="_blank">${text}</a> `
}

function toDifficultyBadge(difficulty: string) {
  return toBadge('', t(`difficulty.${difficulty}`), DifficultyColors[difficulty])
}

function toDifficultyBadgeInverted(difficulty: string, count: number) {
  return toBadge(t(`difficulty.${difficulty}`), count.toString(), DifficultyColors[difficulty])
}

function toDifficultyPlainText(difficulty: string, count: number) {
  return `${t(`difficulty.${difficulty}`)} (${count.toString()})`
}

function toDetailsInnerText(text: string) {
  return `${t(`details.${text}`)}`
}

function quizToBadge(quiz: Quiz, absolute = false, badge = true) {
  const fn = badge ? toBadgeLink : toPlanTextLink
  return fn(
    toQuizREADME(quiz, absolute),
    '',
    `${quiz.no}・${quiz.info[locale]?.title}`,
    DifficultyColors[quiz.difficulty],
  )
}

function quizNoToBadges(ids: (string | number)[], quizes: Quiz[], absolute = false) {
  return ids
    .map(i => quizes.find(q => q.no === Number(i)))
    .filter(Boolean)
    .map(i => quizToBadge(i!, absolute))
    .join(' ')
}

function getAllTags(quizes: Quiz[]) {
  const set = new Set<string>()
  for (const quiz of quizes) {
    const info = resolveInfo(quiz)
    for (const tag of (info?.tags || []))
      set.add(tag as string)
  }
  return Array.from(set).sort()
}

function getQuizesByTag(quizes: Quiz[], tag: string) {
  return quizes.filter((quiz) => {
    const info = resolveInfo(quiz)
    return !!info.tags?.includes(tag)
  })
}

async function insertInfoReadme(filepath: string, quiz: Quiz) {
  if (!fs.existsSync(filepath))
    return
  let text = await fs.readFile(filepath, 'utf-8')
  /* eslint-disable prefer-template */

  if (!text.match(/<!--info-header-start-->[\s\S]*<!--info-header-end-->/))
    text = `<!--info-header-start--><!--info-header-end-->\n\n${text}`
  if (!text.match(/<!--info-footer-start-->[\s\S]*<!--info-footer-end-->/))
    text = `${text}\n\n<!--info-footer-start--><!--info-footer-end-->`

  const info = resolveInfo(quiz)

  text = text
    .replace(
      /<!--info-header-start-->[\s\S]*<!--info-header-end-->/,
      '<!--info-header-start-->'
      + `<h1>${escapeHtml(info.title || '')} ${toDifficultyBadge(quiz.difficulty)} ${(info.tags || []).map(i => toBadge('', `#${i}`, '999')).join(' ')}</h1>`
      + '<p>'
      + toBadgeLink(toPlayShort(quiz.no), '', t('badge.take-the-challenge'), '3178c6', '?logo=typescript&logoColor=white')
      + ('&nbsp;&nbsp;&nbsp;' + toBadgeLink(toNearborREADME(), '', t('display'), 'gray'))
      + '</p>'
      + '<!--info-header-end-->',
    )

  /* eslint-enable prefer-template */

  await fs.writeFile(filepath, text, 'utf-8')
}

async function updateIndexREADME(quizes: Quiz[]) {
  // update index README
  const filepath = path.resolve(__dirname, '..', f('README', 'md'))

  let challengesREADME = ''
  let prev = ''

  // difficulty
  const quizesByDifficulty = [...quizes].sort((a, b) => DifficultyRank.indexOf(a.difficulty) - DifficultyRank.indexOf(b.difficulty))

  for (const quiz of quizesByDifficulty) {
    if (prev !== quiz.difficulty)
      challengesREADME += `${prev ? '<br><br>' : ''}${toDifficultyBadgeInverted(quiz.difficulty, quizesByDifficulty.filter(q => q.difficulty === quiz.difficulty).length)}<br>`

    challengesREADME += quizToBadge(quiz)

    prev = quiz.difficulty
  }

  // by tags
  challengesREADME += `<br><details><summary>${toDetailsInnerText('by-tags')}</summary><br><table><tbody>`
  const tags = getAllTags(quizes)
  for (const tag of tags) {
    challengesREADME += `<tr><td>${toBadge('', `#${tag}`, '999')}</td><td>`
    getQuizesByTag(quizesByDifficulty, tag)
      .forEach((quiz) => {
        challengesREADME += quizToBadge(quiz)
      })
    challengesREADME += '</td></tr>'
  }
  challengesREADME += '<tr><td><code>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</code></td><td></td></tr>'
  challengesREADME += '</tbody></table></details>'

  // by plain text
  prev = ''
  challengesREADME += `<br><details><summary>${toDetailsInnerText('by-plain-text')}</summary><br>`
  for (const quiz of quizesByDifficulty) {
    if (prev !== quiz.difficulty)
      challengesREADME += `${prev ? '</ul>' : ''}<h3>${toDifficultyPlainText(quiz.difficulty, quizesByDifficulty.filter(q => q.difficulty === quiz.difficulty).length)}</h3><ul>`
    challengesREADME += `<li>${quizToBadge(quiz, false, false)}</li>`
    prev = quiz.difficulty
  }
  challengesREADME += '</ul></details><br>'

  let readme = await fs.readFile(filepath, 'utf-8')
  readme = readme.replace(
    /<!--challenges-start-->[\s\S]*<!--challenges-end-->/m,
      `<!--challenges-start-->\n${challengesREADME}\n<!--challenges-end-->`,
  )
  await fs.writeFile(filepath, readme, 'utf-8')
}

async function updateQuestionsREADME(quizes: Quiz[]) {
  const questionsDir = path.resolve(__dirname, '../questions')

  // update each questions' readme
  for (const quiz of quizes) {
    await insertInfoReadme(
      path.join(
        questionsDir,
        quiz.path,
        f('README', 'md'),
      ),
      quiz,
    )
  }
}

export async function updateREADMEs(type?: 'quiz' | 'index') {
  const quizes = await loadQuizes()
  quizes.sort((a, b) => a.no - b.no)

  if (type === 'quiz') {
    await updateQuestionsREADME(quizes)
  }
  else if (type === 'index') {
    await updateIndexREADME(quizes)
  }
  else {
    await Promise.all([
      updateIndexREADME(quizes),
      updateQuestionsREADME(quizes),
    ])
  }
}

updateREADMEs(process.argv.slice(2)[0] as any)
