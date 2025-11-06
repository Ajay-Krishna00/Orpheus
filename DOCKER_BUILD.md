# Docker Build Environment for Orpheus

## 🎯 Purpose

This Docker setup ensures **everyone** gets the exact same build environment that works, eliminating the 2-day setup nightmare you just experienced.

## 📋 What's Included

### Exact Versions That Work Together:

- **Ubuntu**: 22.04
- **Java/JDK**: OpenJDK 17
- **Node.js**: 18.x
- **React Native**: 0.74.5
- **Android Gradle Plugin**: 8.5.2
- **Gradle**: 8.8
- **Android SDK**: API 35 (compileSdk)
- **Android Build Tools**: 34.0.0
- **Android NDK**: 25.1.8937393 (exactly!)
- **androidx.core**: 1.13.1 (forced)
- **react-native-gesture-handler**: 2.14.1

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Start development environment
docker-compose up -d dev

# Enter the container
docker-compose exec dev bash

# Inside container: build the app
cd android && ./gradlew assembleDebug

# Stop when done
docker-compose down
```

### Option 2: Using Docker Directly

```bash
# Build the image
docker build -f Dockerfile.dev -t orpheus-dev .

# Run container with volume mount
docker run -it -v ${PWD}:/app -p 8081:8081 orpheus-dev bash

# Inside container: build
cd android && ./gradlew assembleDebug
```

## 🔧 Usage Scenarios

### 1. First-Time Setup (New Developer)

```bash
# Clone the repo
git clone <your-repo-url>
cd Orpheus

# Build and run with Docker
docker-compose up -d dev
docker-compose exec dev bash

# Inside container: install deps and build
npm install
cd android && ./gradlew assembleDebug
```

**Result**: APK built in `android/app/build/outputs/apk/debug/app-debug.apk`

### 2. CI/CD Pipeline (GitHub Actions Example)

```yaml
# .github/workflows/android.yml
name: Android Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build with Docker
        run: |
          docker build -f Dockerfile.ci -t orpheus-ci .
          docker run -v ${PWD}:/app orpheus-ci cd android && ./gradlew assembleRelease

      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: android/app/build/outputs/apk/release/*.apk
```

### 3. Clean Build (When Things Get Weird)

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache dev

# Start fresh
docker-compose up -d dev
docker-compose exec dev bash
```

## ⚠️ Important Notes

### What Docker DOES Help With:

✅ Consistent build environment across all machines  
✅ No need to install Android SDK, Java, Gradle manually  
✅ CI/CD automated builds  
✅ Isolation from host system issues  
✅ Version control of build tools

### What Docker DOESN'T Help With:

❌ Running the app on physical device (need USB passthrough)  
❌ Android emulator (requires nested virtualization & GUI)  
❌ Hot reload during development (Metro bundler limitations)  
❌ Initial build speed (still slow, but consistent)

### Recommended Hybrid Approach:

**For Development**: Use your local machine with properly configured environment (what we just set up)

**For CI/CD**: Use Docker to ensure builds work on servers

**For New Team Members**: Use Docker to understand exact versions needed, then install locally

## 🐛 Troubleshooting

### Build Fails with Memory Error

```bash
# Increase Docker memory allocation
# Docker Desktop → Settings → Resources → Memory: 8GB+
```

### "Gradle daemon disappeared unexpectedly"

```bash
# Add to android/gradle.properties (already done):
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.daemon=true
org.gradle.parallel=false
```

### Dependencies Not Found

```bash
# Clear npm cache and reinstall
docker-compose exec dev bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

### Android Build Hangs

```bash
# Kill gradle daemons inside container
docker-compose exec dev pkill -f gradle
docker-compose exec dev pkill -f java

# Restart container
docker-compose restart dev
```

## 📝 Configuration Files Reference

### Critical Android Gradle Files

**`android/build.gradle`** (Root)

- Android Gradle Plugin: 8.5.2
- compileSdk: 35
- targetSdk: 35
- NDK: 25.1.8937393

**`android/app/build.gradle`** (App)

- Forces androidx.core:1.13.1 (critical!)

**`android/gradle.properties`**

- JVM memory: 2GB (for low-RAM systems)
- Parallel builds: disabled

**`android/gradle/wrapper/gradle-wrapper.properties`**

- Gradle version: 8.8

### Critical Package Versions

**`package.json`**

```json
{
  "react-native": "0.74.5",
  "react": "18.2.0",
  "react-native-gesture-handler": "2.14.1",
  "react-native-screens": "3.31.1",
  "react-native-safe-area-context": "4.10.5"
}
```

## 🎓 Lessons Learned

### Why This Specific Setup?

1. **React Native 0.75.x is bleeding edge** - Too many library incompatibilities
2. **7GB RAM is minimum** - Need 2GB for Gradle alone
3. **androidx.core:1.16.0 breaks everything** - Requires AGP 8.6+ which requires Gradle 8.9+
4. **Gradle 8.9+ breaks RN 0.74.5** - `serviceOf` API removed
5. **gesture-handler 2.16.x incompatible** - Needs `ViewManagerWithGeneratedInterface`

### The Catch-22 We Solved:

- AGP 8.7.3 + compileSdk 35 → requires Gradle 8.9+
- Gradle 8.9+ → breaks RN 0.74.5 gradle plugin
- **Solution**: AGP 8.5.2 + forced androidx.core:1.13.1

## 🔄 Updating This Setup

When React Native or dependencies update:

1. Test new versions locally first
2. Document exact versions that work
3. Update Dockerfiles with those versions
4. Update this README
5. Commit changes

## 📞 Support

If you encounter issues:

1. Check the exact error message
2. Verify Docker has enough resources (8GB+ RAM, 50GB+ disk)
3. Try clean build: `docker-compose down -v && docker-compose build --no-cache`
4. Check if versions match exactly with this README

## 🙏 Acknowledgments

Created after 2 days of debugging:

- Corrupted Gradle cache
- Memory issues (7GB RAM)
- Version incompatibilities
- androidx.core nightmare
- Gradle/AGP/RN version conflicts

**Never again.**
