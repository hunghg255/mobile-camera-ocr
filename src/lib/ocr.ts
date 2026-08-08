import { createWorker } from "tesseract.js"

export interface OcrProgress {
  status: string
  progress: number
}

type OcrWorker = Awaited<ReturnType<typeof createWorker>>

let worker: OcrWorker | null = null
let workerPromise: Promise<OcrWorker> | null = null
let workerLanguageKey = ""
let progressListener: ((progress: OcrProgress) => void) | undefined

function normalizeText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

async function getWorker(languages: string[]): Promise<OcrWorker> {
  const key = [...languages].sort().join("+")
  if (worker && workerLanguageKey === key) return worker
  if (workerPromise && workerLanguageKey === key) return workerPromise

  if (worker) {
    await worker.terminate()
    worker = null
  }

  workerLanguageKey = key
  workerPromise = createWorker(languages, undefined, {
    logger: (message) => {
      progressListener?.({ status: message.status, progress: message.progress })
    },
  })

  try {
    worker = await workerPromise
    return worker
  } catch (error) {
    workerLanguageKey = ""
    throw error
  } finally {
    workerPromise = null
  }
}

export async function recognizeCanvas(
  canvas: HTMLCanvasElement,
  languages: string[],
  onProgress?: (progress: OcrProgress) => void,
) {
  if (!languages.length) throw new Error("Hãy chọn ít nhất một ngôn ngữ.")
  progressListener = onProgress
  try {
    const activeWorker = await getWorker(languages)
    const result = await activeWorker.recognize(canvas, { rotateAuto: true })
    return normalizeText(result.data.text)
  } finally {
    progressListener = undefined
  }
}

export async function terminateOcrWorker() {
  if (worker) await worker.terminate()
  worker = null
  workerPromise = null
  workerLanguageKey = ""
}
