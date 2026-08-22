/**
 * Prepare Python Embedded Package for Production Build
 * 
 * This script downloads Python embeddable package and prepares it for bundling
 * into the NSIS installer (via electron-builder).
 * 
 * Run: node scripts/prepare-python.js
 */

const https = require('https')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PYTHON_VERSION = '3.11.9'
const PYTHON_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`
const RESOURCES_DIR = path.join(__dirname, '..', 'resources')
const PYTHON_DIR = path.join(RESOURCES_DIR, 'python')
const PYTHON_ZIP = path.join(RESOURCES_DIR, 'python-embed.zip')

console.log('🐍 Preparing Python Embedded Package for Sub 4.0...\n')

// Step 1: Create directories
if (!fs.existsSync(RESOURCES_DIR)) {
  fs.mkdirSync(RESOURCES_DIR, { recursive: true })
}

if (!fs.existsSync(PYTHON_DIR)) {
  fs.mkdirSync(PYTHON_DIR, { recursive: true })
}

// Step 2: Download Python Embedded (if not exists)
async function downloadPython() {
  if (fs.existsSync(PYTHON_ZIP)) {
    console.log('✓ Python embedded package already downloaded')
    return
  }

  console.log(`📥 Downloading Python ${PYTHON_VERSION} embedded...`)
  console.log(`   URL: ${PYTHON_URL}`)

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(PYTHON_ZIP)
    https.get(PYTHON_URL, (response) => {
      const totalBytes = parseInt(response.headers['content-length'] || '0', 10)
      let downloadedBytes = 0

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1)
        process.stdout.write(`\r   Progress: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(1)}MB)`)
      })

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        console.log('\n✓ Download complete!\n')
        resolve()
      })
    }).on('error', (err) => {
      fs.unlinkSync(PYTHON_ZIP)
      reject(err)
    })
  })
}

// Step 3: Extract Python
function extractPython() {
  console.log('📦 Extracting Python...')
  
  // Check if already extracted
  if (fs.existsSync(path.join(PYTHON_DIR, 'python.exe'))) {
    console.log('✓ Python already extracted\n')
    return
  }

  // Use PowerShell to extract (built-in on Windows)
  try {
    execSync(
      `powershell -command "Expand-Archive -Path '${PYTHON_ZIP}' -DestinationPath '${PYTHON_DIR}' -Force"`,
      { stdio: 'inherit' }
    )
    console.log('✓ Extraction complete!\n')
  } catch (error) {
    console.error('❌ Failed to extract Python:', error.message)
    process.exit(1)
  }
}

// Step 4: Enable pip in embedded Python
function enablePip() {
  console.log('🔧 Configuring Python for pip...')
  
  const pthFile = path.join(PYTHON_DIR, `python${PYTHON_VERSION.split('.').slice(0, 2).join('')}._pth`)
  
  if (fs.existsSync(pthFile)) {
    let content = fs.readFileSync(pthFile, 'utf-8')
    // Uncomment import site
    content = content.replace('#import site', 'import site')
    // Add Lib/site-packages to path
    if (!content.includes('Lib\\site-packages')) {
      content += '\nLib\\site-packages\n'
    }
    fs.writeFileSync(pthFile, content)
    console.log('✓ Python configured for pip\n')
  }
}

// Step 5: Install pip
function installPip() {
  console.log('📦 Installing pip...')
  
  const pipCheck = path.join(PYTHON_DIR, 'Scripts', 'pip.exe')
  if (fs.existsSync(pipCheck)) {
    console.log('✓ pip already installed\n')
    return
  }

  // Download get-pip.py
  const getPipPath = path.join(PYTHON_DIR, 'get-pip.py')
  
  if (!fs.existsSync(getPipPath)) {
    console.log('📥 Downloading get-pip.py...')
    execSync(`curl -o "${getPipPath}" https://bootstrap.pypa.io/get-pip.py`, { stdio: 'inherit' })
  }

  // Install pip
  const pythonExe = path.join(PYTHON_DIR, 'python.exe')
  try {
    execSync(`"${pythonExe}" "${getPipPath}"`, { stdio: 'inherit' })
    console.log('✓ pip installed!\n')
  } catch (error) {
    console.error('❌ Failed to install pip:', error.message)
    process.exit(1)
  }
}

// Step 6: Install Python dependencies
function installDependencies() {
  console.log('📦 Installing Python dependencies...')
  
  const pipExe = path.join(PYTHON_DIR, 'Scripts', 'pip.exe')
  const requirementsPath = path.join(__dirname, '..', 'python_modules', 'requirements.txt')
  
  if (!fs.existsSync(requirementsPath)) {
    console.error('❌ requirements.txt not found at:', requirementsPath)
    process.exit(1)
  }

  try {
    execSync(`"${pipExe}" install -r "${requirementsPath}"`, { stdio: 'inherit' })
    console.log('✓ Dependencies installed!\n')
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message)
    console.error('\n⚠️  This is expected if CUDA packages fail.')
    console.error('   Users can still use CPU mode.')
  }
}

// Step 7: Copy python_modules
function copyPythonModules() {
  console.log('📁 Copying python_modules...')
  
  const srcDir = path.join(__dirname, '..', 'python_modules')
  const destDir = path.join(RESOURCES_DIR, 'python_modules')
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  // Copy files
  const files = ['whisper_transcribe.py', 'requirements.txt', 'README.md']
  files.forEach(file => {
    const src = path.join(srcDir, file)
    const dest = path.join(destDir, file)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest)
      console.log(`  ✓ ${file}`)
    }
  })
  
  console.log('✓ python_modules copied!\n')
}

// Main execution
async function main() {
  try {
    await downloadPython()
    extractPython()
    enablePip()
    installPip()
    installDependencies()
    copyPythonModules()
    
    console.log('\n✅ Python embedded package ready!')
    console.log(`📂 Location: ${PYTHON_DIR}`)
    console.log('\n🚀 You can now run: npm run build:win')
  } catch (error) {
    console.error('\n❌ Failed to prepare Python:', error.message)
    process.exit(1)
  }
}

main()
