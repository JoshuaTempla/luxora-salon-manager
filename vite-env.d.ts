interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Add more env variables as needed
  // readonly VITE_ANOTHER_VARIABLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}