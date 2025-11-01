# 🎵 Orpheus - Music Streaming App

A music streaming application built with React Native, featuring offline playback capabilities, playlist management, and integration with MusicBrainz for metadata.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x
- Java/JDK 17
- Android Studio with SDK 35
- Physical Android device or emulator

### Running the App

1. **Install dependencies**
```bash
npm install
```

2. **Start Metro bundler**
```bash
npm start
```

3. **Run on Android** (in a new terminal)
```bash
npm run android
```

That's it! The app should build and launch on your connected device.

### If You Encounter Build Issues

**Quick Fix**: Verify your environment matches our tested configuration:
```powershell
# Run the environment checker
powershell -ExecutionPolicy Bypass -File .\check-environment.ps1
```

**Required versions** (must match exactly!):
- React Native: `0.74.5`
- Java/JDK: `17`
- Node.js: `18.x`
- Gradle: `8.8`
- Android Gradle Plugin: `8.5.2`
- Android SDK: `35` (compileSdk)
- NDK: `25.1.8937393`

📖 **Detailed version info**: See [BUILD_REFERENCE.md](./BUILD_REFERENCE.md)

---

# 🐳 Docker Setup (For Team Sharing & CI/CD)

> **Note**: If you're working alone and the app builds successfully with `npm run android`, you can skip this section. Docker is for sharing with teammates or setting up automated builds.

This project includes Docker support to ensure everyone gets the exact same working build environment. This eliminates the "works on my machine" problem.

## When to Use Docker

✅ **Use Docker if:**
- You're sharing this project with teammates
- Setting up CI/CD (GitHub Actions)
- Want guaranteed reproducible builds
- Testing on a new machine

❌ **Don't need Docker if:**
- Working alone on your local machine
- App builds successfully with `npm run android`
- You're actively developing (local is faster)

## Quick Docker Start

```bash
# Start development container
docker-compose up -d dev

# Enter the container
docker-compose exec dev bash

# Inside container: build the app
cd android && ./gradlew assembleDebug
```

📖 **Complete Docker guide**: See [DOCKER_BUILD.md](./DOCKER_BUILD.md)

---

# Getting Started (Standard React Native Setup)

# Getting Started (Standard React Native Setup)

This section contains the standard React Native setup instructions for reference.

## Step 1: Start the Metro Server

Metro is the JavaScript bundler that ships with React Native.

```bash
npm start
```

## Step 2: Start your Application

Open a new terminal and run:

### For Android
```bash
npm run android
```

### For iOS
```bash
npm run ios
```

## Step 3: Modifying the App

1. Open `App.tsx` in your text editor and edit some lines.
2. For **Android**: Press <kbd>R</kbd> twice or select **"Reload"** from the Developer Menu (<kbd>Ctrl</kbd> + <kbd>M</kbd>)
3. For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator

---

# 📚 Documentation Files Explained

This project includes comprehensive documentation to help you and others build successfully. Here's what each file does:

## 🐳 Docker Files (For Sharing & CI/CD)

### `Dockerfile.dev`
**What it is**: A complete development environment in a container  
**What it contains**: Ubuntu 22.04 + Java 17 + Node 18 + Android SDK 35 + NDK 25.1.8937393 + Gradle 8.8  
**Why it exists**: So others don't waste 2 days setting up their environment  
**How to use it**:
```bash
docker build -f Dockerfile.dev -t orpheus-dev .
docker run -it -v ${PWD}:/app orpheus-dev bash
# Inside container: cd android && ./gradlew assembleDebug
```
**When to use**: When onboarding new developers, or testing builds in a clean environment

### `Dockerfile.ci`
**What it is**: Optimized Docker image for automated builds  
**What it contains**: Same as Dockerfile.dev but optimized for CI/CD (smaller, faster)  
**Why it exists**: For GitHub Actions, GitLab CI, or other automated build systems  
**How to use it**: Automatically used by `.github/workflows/android-build.yml`  
**When to use**: In CI/CD pipelines (runs automatically on git push)

### `docker-compose.yml`
**What it is**: Easy management of Docker containers  
**What it contains**: Configuration for both dev and ci containers  
**Why it exists**: Simplifies Docker commands - one command instead of many  
**How to use it**:
```bash
docker-compose up -d dev        # Start development container
docker-compose exec dev bash    # Enter the container
docker-compose down             # Stop everything
```
**When to use**: When you want to use Docker but don't remember all the commands

### `.dockerignore`
**What it is**: List of files Docker should ignore when building  
**What it contains**: node_modules, build folders, git files, etc.  
**Why it exists**: Makes Docker builds faster (doesn't copy unnecessary files)  
**How to use it**: You don't - Docker uses it automatically  
**When to use**: Automatic - no action needed

## 📖 Documentation Files

### `DOCKER_BUILD.md`
**What it is**: Complete guide to using Docker for this project  
**What it contains**: 
- Step-by-step Docker setup instructions
- Usage scenarios (first-time setup, CI/CD, clean builds)
- Troubleshooting Docker-specific issues
- What Docker helps with vs. what it doesn't
**Why it exists**: Comprehensive reference for Docker workflow  
**How to use it**: Read it when you want to use Docker or share project with others  
**When to use**: When setting up Docker, troubleshooting Docker builds, or onboarding teammates

### `BUILD_REFERENCE.md`
**What it is**: Quick reference card with all working versions  
**What it contains**:
- Exact versions that work (React Native 0.74.5, Gradle 8.8, etc.)
- Emergency fix commands
- Version compatibility matrix
- Common error solutions
**Why it exists**: Quick lookup when you forget what versions work  
**How to use it**: Keep it open when troubleshooting build issues  
**When to use**: When builds break, when setting up new machine, when someone asks "what version?"

### `DOCKER_SUMMARY.md`
**What it is**: Overview of the entire Docker system  
**What it contains**:
- What all the Docker files do
- How the build system works
- Best practices (when to use Docker vs local)
- Success metrics
**Why it exists**: Big picture explanation of the Docker setup  
**How to use it**: Read it to understand why Docker was added  
**When to use**: When you want to understand the overall system architecture

## 🔍 Environment Checker Scripts

### `check-environment.ps1` (Windows)
**What it is**: PowerShell script that verifies your build environment  
**What it contains**: Checks for correct versions of Java, Node, Gradle, Android SDK, NDK, etc.  
**Why it exists**: Quickly verify your setup matches the working configuration  
**How to use it**:
```powershell
powershell -ExecutionPolicy Bypass -File .\check-environment.ps1
```
**When to use**: 
- After installing/updating Android Studio
- When builds suddenly fail
- Before starting work on a new machine
- To verify everything is configured correctly

### `check-environment.sh` (Linux/Mac)
**What it is**: Bash script version of the environment checker  
**What it contains**: Same checks as PowerShell version  
**Why it exists**: For Linux/Mac users  
**How to use it**:
```bash
bash check-environment.sh
```
**When to use**: Same as PowerShell version, but on Linux/Mac

## 🤖 CI/CD Files

### `.github/workflows/android-build.yml`
**What it is**: GitHub Actions workflow for automatic builds  
**What it contains**: 
- Builds Docker image
- Compiles debug APK on every push
- Compiles release APK on main branch
- Uploads APK as artifact
**Why it exists**: Automatically build and test on every commit  
**How to use it**: Push code to GitHub - it runs automatically  
**When to use**: 
- Automatic on every push/PR
- Download built APKs from GitHub Actions tab
- Share APKs with testers without building locally

## 🎯 Quick Decision Guide

### "I'm working alone on my physical device"
✅ **Use**: `npm run android` (local build)  
✅ **Keep handy**: `BUILD_REFERENCE.md`, `check-environment.ps1`  
❌ **Ignore**: All Docker files, DOCKER_BUILD.md

### "I'm sharing this project with teammates"
✅ **Use**: Give them `DOCKER_BUILD.md`  
✅ **Tell them**: Run `docker-compose up -d dev` to get started  
✅ **Keep updated**: `BUILD_REFERENCE.md` with any version changes

### "I want automated builds on GitHub"
✅ **Use**: `.github/workflows/android-build.yml` (already set up)  
✅ **Check**: GitHub Actions tab after pushing code  
✅ **Download**: Built APKs from GitHub artifacts

### "Something broke and I don't know why"
✅ **Run**: `check-environment.ps1` to verify versions  
✅ **Check**: `BUILD_REFERENCE.md` for correct versions  
✅ **Try**: Docker build to see if it's your environment or the code

### "I got a new computer"
**Option 1 - Quick (Docker)**:
```bash
docker-compose up -d dev
docker-compose exec dev bash
cd android && ./gradlew assembleDebug
```

**Option 2 - Best for daily use (Local)**:
1. Read `BUILD_REFERENCE.md` for exact versions
2. Install Java 17, Node 18, Android SDK 35, NDK 25.1.8937393
3. Run `check-environment.ps1` to verify
4. Run `npm run android`

## 📊 File Summary Table

| File | Type | For You Now? | For Others? | Purpose |
|------|------|--------------|-------------|---------|
| `Dockerfile.dev` | Docker | ❌ Optional | ✅ Yes | Dev environment setup |
| `Dockerfile.ci` | Docker | ❌ Optional | ✅ Yes | CI/CD builds |
| `docker-compose.yml` | Docker | ❌ Optional | ✅ Yes | Easy Docker management |
| `.dockerignore` | Docker | ❌ Auto | ✅ Yes | Speed up Docker builds |
| `DOCKER_BUILD.md` | Docs | ❌ Later | ✅ Yes | Docker usage guide |
| `BUILD_REFERENCE.md` | Docs | ✅ **Keep handy** | ✅ Yes | Version quick reference |
| `DOCKER_SUMMARY.md` | Docs | ❌ Optional | ✅ Yes | System overview |
| `check-environment.ps1` | Script | ✅ **Use this** | ✅ Yes | Verify your setup |
| `check-environment.sh` | Script | ❌ (Windows) | ✅ Mac/Linux | Verify setup |
| `.github/workflows/android-build.yml` | CI/CD | ❌ Auto | ✅ Yes | Auto builds on push |

## 💡 Pro Tips

1. **Bookmark** `BUILD_REFERENCE.md` - You'll reference it often
2. **Run** `check-environment.ps1` monthly or when issues arise
3. **Share** `DOCKER_BUILD.md` with new team members
4. **Use** Docker for clean builds when your local environment gets messy
5. **Push to GitHub** and let Actions build APKs automatically

---

# Troubleshooting

### Build Fails with Version Errors

**Run the environment checker:**
```powershell
powershell -ExecutionPolicy Bypass -File .\check-environment.ps1
```

This will verify all your tool versions match the tested configuration.

### "Could not read workspace metadata" / Gradle Cache Issues

```bash
# Kill all Java processes
taskkill /F /IM java.exe

# Clean Gradle cache
cd android
.\gradlew clean
rm -rf .gradle
cd ..

# Rebuild
npm run android
```

### Out of Memory / JVM Crash

Already configured in `android/gradle.properties`:
- Gradle max memory: 2GB
- Parallel builds: disabled

If you have more RAM, you can increase the memory in `android/gradle.properties`.

### androidx.core Dependency Errors

Already fixed with forced resolution in `android/app/build.gradle`. If broken, verify it contains:
```gradle
configurations.all {
    resolutionStrategy {
        force 'androidx.core:core:1.13.1'
        force 'androidx.core:core-ktx:1.13.1'
    }
}
```

### More Help

- **Build Reference**: See [BUILD_REFERENCE.md](./BUILD_REFERENCE.md) for emergency fixes
- **Docker**: Try building with Docker to isolate environment issues
- **React Native Docs**: [Troubleshooting](https://reactnative.dev/docs/troubleshooting)

---

# Learn More

- [React Native Website](https://reactnative.dev)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API)

---
