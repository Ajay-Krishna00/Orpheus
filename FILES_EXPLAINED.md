# 📁 Project Files Overview - Visual Guide

## 🗂️ Complete File Structure

```
Orpheus/
│
├── 📱 YOUR DAILY WORK (Use These)
│   ├── src/                          ← Your React Native code
│   ├── android/                      ← Android native code
│   ├── package.json                  ← Dependencies
│   └── App.tsx                       ← Main app file
│
├── 🐳 DOCKER SYSTEM (For Others/CI)
│   ├── Dockerfile.dev                ← Dev environment setup
│   ├── Dockerfile.ci                 ← CI/CD build setup
│   ├── docker-compose.yml            ← Easy Docker management
│   └── .dockerignore                 ← What Docker ignores
│
├── 📖 DOCUMENTATION (Reference)
│   ├── README.md                     ← Start here (updated!)
│   ├── BUILD_REFERENCE.md            ← ⭐ Quick version lookup
│   ├── DOCKER_BUILD.md               ← Complete Docker guide
│   └── DOCKER_SUMMARY.md             ← Docker system overview
│
├── 🔍 VERIFICATION TOOLS (Use When Needed)
│   ├── check-environment.ps1         ← ⭐ Windows checker
│   └── check-environment.sh          ← Linux/Mac checker
│
└── 🤖 CI/CD (Automatic)
    └── .github/
        └── workflows/
            └── android-build.yml     ← Auto-builds on GitHub
```

## 🎯 What You Actually Need

### Working Alone (Physical Device)

```
✅ src/                    ← Your code
✅ android/                ← Build config
✅ package.json            ← Dependencies
✅ BUILD_REFERENCE.md      ← When you forget versions
✅ check-environment.ps1   ← Verify setup

❌ Dockerfile.*            ← Don't need these
❌ docker-compose.yml      ← Don't need this
❌ DOCKER_BUILD.md         ← Don't need this now
```

### Sharing with Team

```
✅ All of the above
✅ DOCKER_BUILD.md         ← Give this to teammates
✅ Dockerfile.dev          ← They'll use this
✅ docker-compose.yml      ← Easy setup for them
```

### Setting up CI/CD

```
✅ All of the above
✅ .github/workflows/      ← Already configured
✅ Dockerfile.ci           ← Used by GitHub Actions
```

## 📊 Information Flow

### Scenario 1: You Working Locally

```
YOU
 │
 ├─→ Write code in src/
 │
 ├─→ Run: npm run android
 │
 ├─→ Android builds using:
 │    • android/build.gradle (Gradle 8.8, AGP 8.5.2)
 │    • android/app/build.gradle (androidx.core forced)
 │    • package.json (RN 0.74.5)
 │
 └─→ APK installs on your phone ✅
```

### Scenario 2: Teammate Using Docker

```
TEAMMATE
 │
 ├─→ Reads DOCKER_BUILD.md
 │
 ├─→ Runs: docker-compose up -d dev
 │
 ├─→ Docker reads:
 │    • Dockerfile.dev (creates environment)
 │    • .dockerignore (skips unnecessary files)
 │
 ├─→ Inside container runs: ./gradlew assembleDebug
 │
 └─→ APK built successfully ✅
```

### Scenario 3: GitHub Actions (Automatic)

```
YOU PUSH CODE TO GITHUB
 │
 ├─→ GitHub reads: .github/workflows/android-build.yml
 │
 ├─→ Workflow builds:
 │    • Dockerfile.ci (creates build environment)
 │    • Runs gradle build
 │
 ├─→ Uploads APK as artifact
 │
 └─→ You download APK from GitHub ✅
```

## 🎓 Learning Path

### Day 1 (You - Right Now)

```
1. Keep using: npm run android
2. Bookmark: BUILD_REFERENCE.md
3. Ignore: All Docker files
```

### Week 1 (Understanding)

```
1. Read: BUILD_REFERENCE.md (understand versions)
2. Run: check-environment.ps1 (verify setup)
3. Optional: Skim DOCKER_BUILD.md (future reference)
```

### Month 1 (Sharing)

```
1. Push to GitHub (auto-builds start)
2. Share DOCKER_BUILD.md with teammates
3. Help others use docker-compose
```

## 🔄 Quick Commands Cheat Sheet

### For You (Daily)

```powershell
# Build and run on device
npm run android

# Check if environment is still good
powershell -ExecutionPolicy Bypass -File .\check-environment.ps1

# Clean build (if issues)
cd android
.\gradlew clean
cd ..
npm run android
```

### For Teammates (First Time)

```bash
# Quick start with Docker
docker-compose up -d dev
docker-compose exec dev bash
cd android && ./gradlew assembleDebug

# Or verify local setup
./check-environment.sh  # Mac/Linux
# or
check-environment.ps1   # Windows
```

### For CI/CD (Automatic)

```bash
# Just push code
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions runs automatically
# Download APK from GitHub Actions tab
```

## 🆘 "Which File Do I Open?"

| Your Question                   | Open This File                        |
| ------------------------------- | ------------------------------------- |
| "What Java version do I need?"  | `BUILD_REFERENCE.md`                  |
| "How do I verify my setup?"     | Run `check-environment.ps1`           |
| "How do teammates get started?" | `DOCKER_BUILD.md`                     |
| "What are all these files?"     | `README.md` (you're here!)            |
| "Why was Docker added?"         | `DOCKER_SUMMARY.md`                   |
| "How do I use Docker?"          | `DOCKER_BUILD.md`                     |
| "What if build fails?"          | `BUILD_REFERENCE.md`                  |
| "How do I share with GitHub?"   | `.github/workflows/android-build.yml` |

## 💡 The Big Picture

```
┌─────────────────────────────────────────────────────────┐
│                  ORPHEUS PROJECT                        │
│                                                         │
│  ┌──────────────┐                                      │
│  │  YOUR CODE   │  ← What you work on daily            │
│  │  (src/, etc) │                                      │
│  └──────┬───────┘                                      │
│         │                                               │
│         ├─→ LOCAL BUILD (npm run android)              │
│         │   • Fast ✅                                   │
│         │   • Physical device ✅                        │
│         │   • Your machine only ⚠️                      │
│         │                                               │
│         ├─→ DOCKER BUILD (docker-compose)              │
│         │   • Consistent ✅                             │
│         │   • Works everywhere ✅                       │
│         │   • No physical device ⚠️                     │
│         │                                               │
│         └─→ CI/CD BUILD (GitHub Actions)               │
│             • Automatic ✅                              │
│             • Always fresh ✅                           │
│             • Share APKs ✅                             │
│                                                         │
│  All paths lead to: APK file! 🎉                       │
└─────────────────────────────────────────────────────────┘
```

## ✅ Final Checklist

- [ ] I understand `npm run android` still works for me
- [ ] I know `BUILD_REFERENCE.md` has all the versions
- [ ] I can run `check-environment.ps1` to verify my setup
- [ ] I know Docker files are for teammates/CI, not daily use
- [ ] I've bookmarked the files I'll actually use
- [ ] I know where to find help (README.md)

**You're all set! Keep building! 🚀**
