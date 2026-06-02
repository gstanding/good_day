const ci = require('miniprogram-ci')
const path = require('path')

const APPID = 'wx9e1378f0c62cb385'
const ACTION = process.env.ACTION
const VERSION = process.env.VERSION || '1.0.0'
const DESC = process.env.DESC || `${ACTION} at ${new Date().toISOString()}`

if (!ACTION) {
  console.error('Usage: ACTION=preview|upload [VERSION=x.x.x] npm run preview/upload')
  process.exit(1)
}

const project = new ci.Project({
  appid: APPID,
  type: 'miniProgram',
  projectPath: path.join(__dirname, '..'),
  privateKeyPath: path.join(__dirname, '..', `private.${APPID}.key`),
  ignores: ['node_modules/**/*'],
})

async function run() {
  if (ACTION === 'preview') {
    await ci.preview({
      project,
      desc: DESC,
      setting: { es6: true, minify: false },
      qrcodeFormat: 'image',
      qrcodeOutputDest: path.join(__dirname, '..', 'preview-qr.jpg'),
    })
    console.log('预览二维码已生成，用手机扫码调试')
  } else if (ACTION === 'upload') {
    await ci.upload({
      project,
      version: VERSION,
      desc: DESC,
      setting: { es6: true, minify: true },
      onProgressUpdate: console.log,
    })
    console.log(`上传成功：v${VERSION}`)
  } else {
    console.error(`未知 ACTION: ${ACTION}，只支持 preview 或 upload`)
    process.exit(1)
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
