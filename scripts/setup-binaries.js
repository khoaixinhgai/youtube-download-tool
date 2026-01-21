/* eslint-disable */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const https = require('https')

const binDir = path.join(__dirname, '../resources/bin')

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true })
}

const downloadFile = (url, dest) => {
  if (fs.existsSync(dest)) {
    console.log(`File already exists: ${path.basename(dest)}`)
    return Promise.resolve()
  }
  console.log(`Downloading ${path.basename(dest)}...`)
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          downloadFile(response.headers.location, dest).then(resolve).catch(reject)
          return
        }
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })
  })
}

const main = async () => {
  try {
    // 1. Download yt-dlp
    await downloadFile(
      'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
      path.join(binDir, 'yt-dlp_macos')
    )
    await downloadFile(
      'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
      path.join(binDir, 'yt-dlp.exe')
    )

    // 2. Download ffmpeg (Use curl/tar for simplicity in node script or just download zips)
    // For simplicity, let's use the CLI curl commands if available, or just instruct user?
    // User wants AUTOMATIC. Check if we can use existing zip handling or curl.
    // Node.js unzip is complex without libraries. Let's use system curl/tar/unzip which exists on Mac/CI.

    console.log('Downloading ffmpeg for Mac...')
    if (!fs.existsSync(path.join(binDir, 'ffmpeg'))) {
      execSync(
        `curl -L https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip -o "${path.join(binDir, 'ffmpeg_mac.zip')}"`
      )
      execSync(`unzip -o "${path.join(binDir, 'ffmpeg_mac.zip')}" -d "${binDir}"`)
      execSync(`rm "${path.join(binDir, 'ffmpeg_mac.zip')}"`)
    }

    console.log('Downloading ffmpeg for Windows...')
    if (!fs.existsSync(path.join(binDir, 'ffmpeg.exe'))) {
      execSync(
        `curl -L https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip -o "${path.join(binDir, 'ffmpeg_win.zip')}"`
      )
      execSync(
        `unzip -o -j "${path.join(binDir, 'ffmpeg_win.zip')}" "*/bin/ffmpeg.exe" -d "${binDir}"`
      )
      execSync(`rm "${path.join(binDir, 'ffmpeg_win.zip')}"`)
    }

    // 3. Set permissions
    console.log('Setting permissions...')
    if (process.platform !== 'win32') {
      execSync(`chmod +x "${path.join(binDir, 'yt-dlp_macos')}"`)
      execSync(`chmod +x "${path.join(binDir, 'ffmpeg')}"`)
    }

    console.log('Binaries setup complete!')
  } catch (error) {
    console.error('Error setting up binaries:', error)
    process.exit(1)
  }
}

main()
