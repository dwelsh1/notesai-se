import { execSync } from 'node:child_process'

export default async function globalSetup() {
  execSync('npm run build:electron:main', { stdio: 'inherit' })
}
