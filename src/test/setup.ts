import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import React from 'react'

// Mock react-resizable-panels for tests (JSDOM doesn't support it well)
vi.mock('react-resizable-panels', () => {
  const Group = ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className, 'data-testid': 'panel-group' }, children)

  const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className, 'data-testid': 'panel' }, children)

  const Separator = ({ className }: { className?: string }) =>
    React.createElement('div', { className, 'data-testid': 'panel-separator' })

  const usePanelRef = () => {
    return React.createRef<{
      getSize: () => { asPercentage: number; inPixels: number }
      resize: (size: number | string) => void
      collapse: () => void
      expand: () => void
      isCollapsed: () => boolean
    }>()
  }

  return { Group, Panel, Separator, usePanelRef }
})
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup()
})

if (!document.elementFromPoint) {
  document.elementFromPoint = () => null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emptyRects = () => [] as any

if (!HTMLElement.prototype.getClientRects) {
  HTMLElement.prototype.getClientRects = emptyRects
}

if (!Element.prototype.getClientRects) {
  Element.prototype.getClientRects = emptyRects
}

const nodeProto = Node.prototype as unknown as { getClientRects?: () => DOMRectList }
if (!nodeProto.getClientRects) {
  ;(Node.prototype as any).getClientRects = emptyRects
}

if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = emptyRects
}

const emptyRect = () =>
  ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    toJSON: () => '',
  }) as DOMRect

if (!HTMLElement.prototype.getBoundingClientRect) {
  HTMLElement.prototype.getBoundingClientRect = emptyRect
}

if (!Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = emptyRect
}

const nodeRectProto = Node.prototype as unknown as { getBoundingClientRect?: () => DOMRect }
if (!nodeRectProto.getBoundingClientRect) {
  ;(Node.prototype as any).getBoundingClientRect = emptyRect
}

if (typeof Range !== 'undefined' && !Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = emptyRect
}

if (!Text.prototype.getClientRects) {
  Text.prototype.getClientRects = emptyRects
}

if (!Text.prototype.getBoundingClientRect) {
  Text.prototype.getBoundingClientRect = emptyRect
}

// Mock @dnd-kit for tests
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  DragOverlay: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  closestCenter: vi.fn(),
  PointerSensor: class PointerSensor {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: (node: HTMLElement | null) => node,
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}))
