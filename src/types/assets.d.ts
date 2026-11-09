declare module '*.webp' {
  const source: string
  export default source
}

declare module '*.jpg' {
  const source: string
  export default source
}

declare module '*.svg' {
  const source: string
  export default source
}

declare module '*.css'

declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
