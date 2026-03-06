let s2t: ((text: string) => string) | null = null
let t2s: ((text: string) => string) | null = null

async function ensureConverters() {
  if (s2t && t2s) return
  const OpenCC = await import('opencc-js')
  s2t = OpenCC.Converter({ from: 'cn', to: 'twp' })
  t2s = OpenCC.Converter({ from: 'twp', to: 'cn' })
}

export async function toTraditional(text: string): Promise<string> {
  await ensureConverters()
  return s2t!(text)
}

export async function toSimplified(text: string): Promise<string> {
  await ensureConverters()
  return t2s!(text)
}
