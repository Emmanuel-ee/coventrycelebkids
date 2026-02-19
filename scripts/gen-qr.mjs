import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'

const URL = 'https://emmanuel-ee.github.io/coventrycelebkids/'

const outDir = path.resolve('public')
fs.mkdirSync(outDir, { recursive: true })

await QRCode.toFile(path.join(outDir, 'qr-coventrycelebkids.png'), URL, {
  width: 768,
  margin: 2,
  errorCorrectionLevel: 'M',
})

const svg = await QRCode.toString(URL, {
  type: 'svg',
  margin: 2,
  errorCorrectionLevel: 'M',
})
fs.writeFileSync(path.join(outDir, 'qr-coventrycelebkids.svg'), svg)

console.log('Generated: public/qr-coventrycelebkids.png')
console.log('Generated: public/qr-coventrycelebkids.svg')
console.log('URL:', URL)
