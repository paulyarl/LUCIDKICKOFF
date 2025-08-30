/*
Local-first persistence for learning progress and authoring drafts.
- Uses localStorage under namespaced keys.
- Safe to run in SSR: all functions no-op when window is undefined.
- Can be swapped later to Supabase without changing callers.
*/

export type LessonProgress = {
  lessonId: string
  stepIndex: number
  stars: number
  passedSteps: number
  updatedAt: number
}

export type TutorialProgress = {
  tutorialId: string
  stepIndex: number
  stars: number
  passedSteps: number
  updatedAt: number
}

export type AuthorDraft = {
  id: string
  kind: 'stroke-path'
  title?: string
  guide?: { x: number; y: number }[]
  rubric?: unknown
  hints?: { tier: 1 | 2 | 3; text: string }[]
  updatedAt: number
}

const LS_KEYS = {
  lessons: 'lk_progress_lessons_v1',
  tutorials: 'lk_progress_tutorials_v1',
  drafts: 'lk_author_drafts_v1',
  templateWork: 'lk_template_work_v1',
}

type Dict<T> = Record<string, T>
type LessonMap = Record<string, LessonProgress>
type TutorialMap = Record<string, TutorialProgress>
type DraftMap = Record<string, AuthorDraft>
type TemplateWorkMap = Record<string, TemplateWork>
type UserLessonMap = Record<string, LessonMap>
type UserTutorialMap = Record<string, TutorialMap>
type UserTemplateWorkMap = Record<string, Record<string, Record<string, TemplateWork>>> // user -> packId -> templateId -> work

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function readDict<T>(key: string): T {
  if (!isBrowser()) return {} as T
  try {
    const raw = localStorage.getItem(key)
    return (raw ? JSON.parse(raw) : {}) as T
  } catch {
    return {} as T
  }
}

function writeDict<T>(key: string, value: T) {
  if (!isBrowser()) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}

// Lesson
export function saveLessonProgress(userKey: string | undefined, p: LessonProgress) {
  const key = LS_KEYS.lessons
  const dict = readDict<UserLessonMap>(key)
  const u = userKey ?? 'anon'
  const userDict: LessonMap = dict[u] ?? {}
  userDict[p.lessonId] = p
  dict[u] = userDict
  writeDict(key, dict)
}

export function loadLessonProgress(userKey: string | undefined, lessonId: string): LessonProgress | undefined {
  const dict = readDict<UserLessonMap>(LS_KEYS.lessons)
  const u = userKey ?? 'anon'
  return dict[u]?.[lessonId]
}

// Tutorial
export function saveTutorialProgress(userKey: string | undefined, p: TutorialProgress) {
  const key = LS_KEYS.tutorials
  const dict = readDict<UserTutorialMap>(key)
  const u = userKey ?? 'anon'
  const userDict: TutorialMap = dict[u] ?? {}
  userDict[p.tutorialId] = p
  dict[u] = userDict
  writeDict(key, dict)
}

export function loadTutorialProgress(userKey: string | undefined, tutorialId: string): TutorialProgress | undefined {
  const dict = readDict<UserTutorialMap>(LS_KEYS.tutorials)
  const u = userKey ?? 'anon'
  return dict[u]?.[tutorialId]
}

// Drafts
export function saveAuthorDraft(d: AuthorDraft) {
  const dict = readDict<DraftMap>(LS_KEYS.drafts)
  dict[d.id] = { ...d, updatedAt: Date.now() }
  writeDict(LS_KEYS.drafts, dict)
}

export function loadAuthorDraft(id: string): AuthorDraft | undefined {
  const dict = readDict<DraftMap>(LS_KEYS.drafts)
  return dict[id]
}

export function listAuthorDrafts(): AuthorDraft[] {
  const dict = readDict<DraftMap>(LS_KEYS.drafts)
  return Object.values(dict).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function deleteAuthorDraft(id: string) {
  const dict = readDict<DraftMap>(LS_KEYS.drafts)
  delete dict[id]
  writeDict(LS_KEYS.drafts, dict)
}

// Template Work (per user -> pack -> template)
// Stored shape: { [userKey]: { [packId]: { [templateId]: TemplateWork } } }
export type TemplateCanvasStateV2 = { version: 2; lines: any[]; texts: any[] }
export type TemplateWork = {
  packId: string
  templateId: string
  status: 'in_progress' | 'completed'
  startedAt: number
  updatedAt: number
  canvasState?: TemplateCanvasStateV2
}

export function saveTemplateWork(userKey: string | undefined, work: TemplateWork) {
  const key = LS_KEYS.templateWork
  const dict = readDict<UserTemplateWorkMap>(key)
  const u = userKey ?? 'anon'
  const byPack = dict[u] ?? {}
  const byTemplate = byPack[work.packId] ?? {}
  byTemplate[work.templateId] = { ...work, updatedAt: Date.now() }
  byPack[work.packId] = byTemplate
  dict[u] = byPack
  writeDict(key, dict)
}

export function loadTemplateWork(userKey: string | undefined, packId: string, templateId: string): TemplateWork | undefined {
  const dict = readDict<UserTemplateWorkMap>(LS_KEYS.templateWork)
  const u = userKey ?? 'anon'
  return dict[u]?.[packId]?.[templateId]
}

export function listTemplateWorkForPack(userKey: string | undefined, packId: string): TemplateWork[] {
  const dict = readDict<UserTemplateWorkMap>(LS_KEYS.templateWork)
  const u = userKey ?? 'anon'
  const byTemplate = dict[u]?.[packId] ?? {}
  return Object.values(byTemplate).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function deleteTemplateWork(userKey: string | undefined, packId: string, templateId: string) {
  const key = LS_KEYS.templateWork
  const dict = readDict<UserTemplateWorkMap>(key)
  const u = userKey ?? 'anon'
  if (dict[u]?.[packId]?.[templateId]) {
    delete dict[u][packId][templateId]
    // Clean up empty maps to keep storage small
    if (Object.keys(dict[u][packId]).length === 0) delete dict[u][packId]
    if (Object.keys(dict[u]).length === 0) delete dict[u]
    writeDict(key, dict)
  }
}
