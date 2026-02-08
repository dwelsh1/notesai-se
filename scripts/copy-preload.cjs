const fs = require('node:fs')
const path = require('node:path')

const source = path.join(process.cwd(), 'electron', 'preload.cjs')
const targetDir = path.join(process.cwd(), 'dist-electron')
const target = path.join(targetDir, 'preload.cjs')

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

fs.copyFileSync(source, target)
console.log('Copied preload.cjs to dist-electron')
