import toc from '../data/tableOfContents.json'

interface TocItem {
  number?: number
  title: string
  page: number
}

interface TocSection {
  title: string
  items: TocItem[]
}

export interface MaterialTopic {
  sectionIndex: number
  itemNumber: number
  title: string
}

export const sections = toc.sections as TocSection[]
export const sectionTitles = sections.map((s) => s.title)

export const materialTopics: MaterialTopic[] = sections.flatMap((section, sectionIndex) =>
  section.items
    .filter((item): item is TocItem & { number: number } => item.number !== undefined)
    .map((item) => ({ sectionIndex, itemNumber: item.number, title: item.title })),
)

export const SECTION_COUNT = sections.length

export function materialTopicId(sectionIndex: number, itemNumber: number) {
  return `s${sectionIndex}-${itemNumber}`
}

export function sectionTopicIds(sectionIndex: number): string[] {
  return sections[sectionIndex].items
    .filter((item): item is TocItem & { number: number } => item.number !== undefined)
    .map((item) => materialTopicId(sectionIndex, item.number))
}
