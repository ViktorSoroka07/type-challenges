import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import slug from 'limax'
import fs from 'fs-extra'
import c from 'ansis'
import prompts from 'prompts'
import { formatToCode } from './actions/utils/formatToCode'
import { loadQuizes, resolveInfo } from './loader'
import type { QuizMetaInfo } from './types'
import { locale } from './locales'

type Snapshot = Record<string, string>

function getQuestionFullName(no: number, difficulty: string, title: string) {
  return `${String(no).padStart(5, '0')}-${difficulty}-${slug(
    title.replace(/\./g, '-').replace(/<.*>/g, ''),
    { tone: false },
  )}`
}

function calculateFileHash(filePathFull: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1')
    const fileStream = fs.createReadStream(filePathFull)

    fileStream.on('data', (data) => {
      hash.update(data)
    })

    fileStream.on('end', () => {
      hash.update(filePathFull)
      resolve(hash.digest('hex'))
    })

    fileStream.on('error', (err) => {
      reject(err)
    })
  })
}

async function takeSnapshot(quizesPath: string) {
  let snapshot: Snapshot = {}

  const files = fs.readdirSync(quizesPath)

  for (const file of files) {
    // Might be a file, or a folder
    const fPath = path.join(quizesPath, file)
    const fStats = fs.statSync(fPath)

    if (fStats.isDirectory()) {
      snapshot = {
        ...snapshot,
        ...(await takeSnapshot(fPath)),
      }
    }
    else {
      snapshot[file] = await calculateFileHash(fPath)
    }
  }

  return snapshot
}

function readPlaygroundCache(playgroundCachePath: string): Snapshot {
  if (!fs.existsSync(playgroundCachePath))
    return {}

  try {
    const rawCacheContent = fs.readFileSync(playgroundCachePath)
    return JSON.parse(rawCacheContent.toString())
  }
  catch (err) {
    console.log(c.red('Playground cache corrupted. '
    + 'Cannot generate playground without keeping your changes intact'))
    console.log(c.cyan('Please ensure you have run this: "pnpm generate"'))
    process.exit(1)
  }
}

function calculateOverridableFiles(cache: Snapshot, snapshot: Snapshot) {
  const result: Snapshot = {}

  for (const quizName in snapshot) {
    if (snapshot[quizName] === cache[quizName])
      result[quizName] = snapshot[quizName]
  }

  return result
}

function isQuizWritable(quizFileName: string, overridableFiles: Snapshot, playgroundSnapshot: Snapshot): boolean {
  return !!(
    overridableFiles[quizFileName]
    || (!overridableFiles[quizFileName] && !playgroundSnapshot[quizFileName])
  )
}

async function generatePlayground() {
  const playgroundPath = path.join(__dirname, '../playground')
  const playgroundCachePath = path.join(__dirname, '../.playgroundcache')

  console.log(c.bold.cyan('Generating local playground...\n'))

  let overridableFiles: Snapshot
  let keepChanges = false
  const currentPlaygroundCache = readPlaygroundCache(playgroundCachePath)
  let playgroundSnapshot: Snapshot

  if (process.argv.length === 3 && (process.argv[2] === '--keep-changes' || process.argv[2] === '-K')) {
    console.log(c.bold.cyan('We will keep your changes while generating.\n'))
    keepChanges = true

    playgroundSnapshot = await takeSnapshot(playgroundPath)

    overridableFiles = calculateOverridableFiles(currentPlaygroundCache, playgroundSnapshot)
  }
  else if (fs.existsSync(playgroundPath)) {
    const result = await prompts([{
      name: 'confirm',
      type: 'confirm',
      initial: false,
      message: 'The playground directory already exists, it may contains the answers you did. Do you want to override it?',
    }])
    if (!result?.confirm)
      return console.log(c.yellow('Skipped.'))
  }

  if (!keepChanges) {
    await fs.remove(playgroundPath)
    await fs.ensureDir(playgroundPath)
  }

  const quizes = await loadQuizes()
  const incomingQuizesCache: Snapshot = {}

  for (const quiz of quizes) {
    const { difficulty, title } = resolveInfo(quiz) as QuizMetaInfo & { difficulty: string }
    const code = formatToCode(quiz)

    if (difficulty === undefined || title === undefined) {
      console.log(c.yellow`${quiz.no} has no ${locale.toUpperCase()} version. Skipping`)
      continue
    }

    const quizesPathByDifficulty = path.join(playgroundPath, difficulty)

    const quizFileName = `${getQuestionFullName(quiz.no, difficulty, title)}.ts`
    const quizPathFull = path.join(quizesPathByDifficulty, quizFileName)

    if (!keepChanges || (keepChanges && isQuizWritable(quizFileName, overridableFiles!, playgroundSnapshot!))) {
      if (!fs.existsSync(quizesPathByDifficulty))
        fs.mkdirSync(quizesPathByDifficulty)
      await fs.writeFile(quizPathFull, code, 'utf-8')
      incomingQuizesCache[quizFileName] = await calculateFileHash(quizPathFull)
    }
  }

  fs.writeFile(playgroundCachePath, JSON.stringify({
    ...currentPlaygroundCache,
    ...incomingQuizesCache,
  }))

  console.log()
  console.log(c.bold.green('Local playground generated at: ') + c.dim(playgroundPath))
  console.log()
}

generatePlayground()
