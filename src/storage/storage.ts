export type Page = {
  id: string
  title: string
  contentMarkdown: string
  updatedAt: string
  createdAt: string
  trashed: boolean
  favorited: boolean
  parentId: string | null
  order: number
  favoriteOrder: number | null
}

export interface StorageAdapter {
  listPages(): Promise<Page[]>
  getPage(id: string): Promise<Page | null>
  upsertPage(page: Page): Promise<void>
  deletePage(id: string): Promise<void>
}
