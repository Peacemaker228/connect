import type { MemberWithProfileDto } from '@app-core/contracts'

export const MAX_MENTION_PICKER_SUGGESTIONS = 8

export type MentionSuggestion =
  | {
      id: 'all'
      type: 'all'
      visibleText: '@all'
      stableToken: '<@all>'
      label: 'all'
      searchText: string
    }
  | {
      id: string
      type: 'member'
      member: MemberWithProfileDto
      visibleText: string
      stableToken: string
      label: string
      searchText: string
    }

export interface MentionTrigger {
  start: number
  end: number
  query: string
}

export interface SelectedMentionRange {
  id: string
  start: number
  end: number
  visibleText: string
  stableToken: string
}

const MENTION_QUERY_BOUNDARY = /[\s()[\]{}'"`,;:]/

const normalizeSearchText = (value: string) => value.trim().toLowerCase()

const getMemberLabel = (member: MemberWithProfileDto) => {
  return member.profile.name?.trim() || member.profile.email?.trim() || 'member'
}

export const createMentionSuggestions = (members: MemberWithProfileDto[] = []): MentionSuggestion[] => {
  const allSuggestion: MentionSuggestion = {
    id: 'all',
    type: 'all',
    visibleText: '@all',
    stableToken: '<@all>',
    label: 'all',
    searchText: 'all everyone everybody',
  }

  const memberSuggestions = members
    .map<MentionSuggestion>((member) => {
      const label = getMemberLabel(member)

      return {
        id: member.id,
        type: 'member',
        member,
        visibleText: `@${label}`,
        stableToken: `<@${member.id}>`,
        label,
        searchText: normalizeSearchText(`${label} ${member.profile.email ?? ''}`),
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

  return [...memberSuggestions, allSuggestion]
}

export const filterMentionSuggestions = (suggestions: MentionSuggestion[], query: string) => {
  const normalizedQuery = normalizeSearchText(query)
  const allSuggestion = suggestions.find((suggestion) => suggestion.type === 'all')
  const memberSuggestions = suggestions.filter((suggestion) => suggestion.type === 'member')

  if (!normalizedQuery) {
    return [
      ...memberSuggestions.slice(0, MAX_MENTION_PICKER_SUGGESTIONS),
      ...(allSuggestion ? [allSuggestion] : []),
    ]
  }

  const filteredMembers = memberSuggestions
    .filter((suggestion) => suggestion.searchText.includes(normalizedQuery))
    .slice(0, MAX_MENTION_PICKER_SUGGESTIONS)
  const shouldShowAll = allSuggestion?.searchText.includes(normalizedQuery)

  return [...filteredMembers, ...(shouldShowAll && allSuggestion ? [allSuggestion] : [])]
}

export const getMentionTrigger = (value: string, caretPosition: number): MentionTrigger | null => {
  if (caretPosition < 1 || caretPosition > value.length) {
    return null
  }

  let start = caretPosition - 1

  while (start >= 0 && !MENTION_QUERY_BOUNDARY.test(value[start])) {
    start -= 1
  }

  start += 1

  if (value[start] !== '@') {
    return null
  }

  const query = value.slice(start + 1, caretPosition)

  if (query.includes('@') || query.includes('<') || query.includes('>')) {
    return null
  }

  return {
    start,
    end: caretPosition,
    query,
  }
}

export const updateMentionRangesForTextChange = (
  ranges: SelectedMentionRange[],
  previousValue: string,
  nextValue: string,
): SelectedMentionRange[] => {
  if (previousValue === nextValue || ranges.length === 0) {
    return ranges
  }

  let start = 0

  while (start < previousValue.length && start < nextValue.length && previousValue[start] === nextValue[start]) {
    start += 1
  }

  let previousEnd = previousValue.length
  let nextEnd = nextValue.length

  while (previousEnd > start && nextEnd > start && previousValue[previousEnd - 1] === nextValue[nextEnd - 1]) {
    previousEnd -= 1
    nextEnd -= 1
  }

  const delta = nextEnd - previousEnd

  return ranges.flatMap((range) => {
    if (previousEnd <= range.start) {
      return [{ ...range, start: range.start + delta, end: range.end + delta }]
    }

    if (start >= range.end) {
      return [range]
    }

    return []
  })
}

export const applyMentionSuggestionToText = (
  value: string,
  trigger: MentionTrigger,
  suggestion: MentionSuggestion,
  currentRanges: SelectedMentionRange[],
) => {
  const before = value.slice(0, trigger.start)
  const after = value.slice(trigger.end)
  const needsTrailingSpace = after.length === 0 || !/^\s/.test(after)
  const insertedText = `${suggestion.visibleText}${needsTrailingSpace ? ' ' : ''}`
  const nextValue = `${before}${insertedText}${after}`
  const mentionStart = trigger.start
  const mentionEnd = mentionStart + suggestion.visibleText.length
  const delta = insertedText.length - (trigger.end - trigger.start)
  const nextRange: SelectedMentionRange = {
    id: `${suggestion.type}:${suggestion.id}:${mentionStart}:${Date.now()}`,
    start: mentionStart,
    end: mentionEnd,
    visibleText: suggestion.visibleText,
    stableToken: suggestion.stableToken,
  }
  const shiftedRanges = currentRanges.flatMap((range) => {
    if (range.end <= trigger.start) {
      return [range]
    }

    if (range.start >= trigger.end) {
      return [{ ...range, start: range.start + delta, end: range.end + delta }]
    }

    return []
  })

  return {
    nextValue,
    nextCaretPosition: trigger.start + insertedText.length,
    nextRanges: [...shiftedRanges, nextRange].sort((a, b) => a.start - b.start),
  }
}

export const serializeSelectedMentionsForSubmit = (value: string, ranges: SelectedMentionRange[]) => {
  return [...ranges]
    .sort((a, b) => b.start - a.start)
    .reduce((content, range) => {
      if (value.slice(range.start, range.end) !== range.visibleText) {
        return content
      }

      return `${content.slice(0, range.start)}${range.stableToken}${content.slice(range.end)}`
    }, value)
}
