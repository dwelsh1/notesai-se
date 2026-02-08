import '@testing-library/jest-dom/vitest'

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

if (!Node.prototype.getClientRects) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

if (!Node.prototype.getBoundingClientRect) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
