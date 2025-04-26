export const locale = 'en'

// eslint-disable-next-line ts/no-var-requires
export const messages = require('./locales/en.json')

export function t(key: string): string {
  const result = messages[key]

  if (!result)
    throw new Error(`Missing message for key "${key}"`)

  return result
}

export function f(name: string, ext: string) {
  return `${name}.${ext}`
}
