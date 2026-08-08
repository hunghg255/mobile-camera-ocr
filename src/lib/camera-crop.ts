export interface RectLike {
  left: number
  top: number
  width: number
  height: number
}

export interface SourceCrop {
  x: number
  y: number
  width: number
  height: number
}

const DEFAULT_GUIDE = { left: 0.12, top: 0.18, width: 0.76, height: 0.56 }

export function calculateObjectCoverCrop(
  sourceWidth: number,
  sourceHeight: number,
  viewport: RectLike,
  guide: RectLike,
): SourceCrop {
  if (sourceWidth <= 0 || sourceHeight <= 0) return { x: 0, y: 0, width: 0, height: 0 }

  if (viewport.width <= 0 || viewport.height <= 0 || guide.width <= 0 || guide.height <= 0) {
    return {
      x: Math.round(sourceWidth * DEFAULT_GUIDE.left),
      y: Math.round(sourceHeight * DEFAULT_GUIDE.top),
      width: Math.round(sourceWidth * DEFAULT_GUIDE.width),
      height: Math.round(sourceHeight * DEFAULT_GUIDE.height),
    }
  }

  const scale = Math.max(viewport.width / sourceWidth, viewport.height / sourceHeight)
  const renderedWidth = sourceWidth * scale
  const renderedHeight = sourceHeight * scale
  const overflowX = (renderedWidth - viewport.width) / 2
  const overflowY = (renderedHeight - viewport.height) / 2

  const rawLeft = (guide.left - viewport.left + overflowX) / scale
  const rawTop = (guide.top - viewport.top + overflowY) / scale
  const rawRight = (guide.left - viewport.left + guide.width + overflowX) / scale
  const rawBottom = (guide.top - viewport.top + guide.height + overflowY) / scale

  const left = Math.max(0, Math.min(sourceWidth, rawLeft))
  const top = Math.max(0, Math.min(sourceHeight, rawTop))
  const right = Math.max(left, Math.min(sourceWidth, rawRight))
  const bottom = Math.max(top, Math.min(sourceHeight, rawBottom))

  return {
    x: Math.round(left),
    y: Math.round(top),
    width: Math.max(1, Math.round(right - left)),
    height: Math.max(1, Math.round(bottom - top)),
  }
}
