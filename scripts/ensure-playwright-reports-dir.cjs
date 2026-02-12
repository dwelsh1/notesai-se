const fs = require('fs')
const path = require('path')

const dir = path.join(process.cwd(), 'playwright-reports')
fs.mkdirSync(dir, { recursive: true })
