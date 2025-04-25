import slug from 'limax'

export function getQuestionFullName(no: number, difficulty: string, title: string) {
  return `${String(no).padStart(5, '0')}-${difficulty}-${slug(
    title.replace(/\./g, '-').replace(/<.*>/g, ''),
    { tone: false },
  )}`
}
