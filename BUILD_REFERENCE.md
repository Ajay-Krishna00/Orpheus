# 🚀 ORPHEUS BUILD - QUICK REFERENCE CARD

## ✅ WORKING CONFIGURATION (TESTED & VERIFIED)

```yaml
React Native:     0.74.5
React:            18.2.0
Java/JDK:         OpenJDK 17
Node.js:          18.x
Gradle:           8.8
AGP:              8.5.2
compileSdk:       35
targetSdk:        35
Build Tools:      34.0.0
NDK:              25.1.8937393
androidx.core:    1.13.1 (FORCED!)
gesture-handler:  2.14.1
screens:          3.31.1
safe-area:        4.10.5
```

## 🏃 QUICKSTART COMMANDS

### Build with Docker (Recommended for CI/CD)
```bash
docker-compose up -d dev
docker-compose exec dev bash
# Inside container:
cd android && ./gradlew assembleDebug
```

### Build Locally (What We Just Configured)
```bash
npm install --legacy-peer-deps
npm run android
```

### Clean Build (When Things Break)
```bash
# Local
cd android
./gradlew clean
rm -rf build app/build .gradle
cd ..
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Docker
docker-compose down -v
docker-compose build --no-cache dev
```

## 🔑 CRITICAL FILES

### android/build.gradle
```gradle
compileSdkVersion = 35
targetSdkVersion = 35
ndkVersion = "25.1.8937393"
classpath("com.android.tools.build:gradle:8.5.2")
```

### android/app/build.gradle
```gradle
configurations.all {
    resolutionStrategy {
        force 'androidx.core:core:1.13.1'
        force 'androidx.core:core-ktx:1.13.1'
    }
}
```

### android/gradle.properties
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.daemon=true
org.gradle.parallel=false
```

### android/gradle/wrapper/gradle-wrapper.properties
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.8-all.zip
```

## ⚠️ KNOWN LANDMINES

❌ **DON'T** use React Native 0.75.x (library incompatibilities)  
❌ **DON'T** use Gradle 8.9+ (breaks RN 0.74.5)  
❌ **DON'T** use AGP 8.6+ without Gradle 8.9+  
❌ **DON'T** allow androidx.core:1.16.0 (requires AGP 8.6+)  
❌ **DON'T** use gesture-handler 2.16.x (needs newer APIs)  
❌ **DON'T** enable parallel builds on <8GB RAM  
❌ **DON'T** allocate >2GB to Gradle on 7GB RAM systems  

## 🆘 EMERGENCY FIXES

### "Could not read workspace metadata"
```bash
pkill -f java
rm -rf ~/.gradle/caches/transforms-*
```

### "JVM crash" / "Out of memory"
```bash
# Edit android/gradle.properties:
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=false
```

### "AAR metadata check failed"
```bash
# Already fixed with force resolution in app/build.gradle
# If broken, verify androidx.core is forced to 1.13.1
```

### "Cannot access ViewManagerWithGeneratedInterface"
```bash
npm install react-native-gesture-handler@2.14.1
```

## 📊 BUILD TIMES

- **First build**: 5-10 minutes (downloading dependencies)
- **Clean build**: 2-3 minutes
- **Incremental**: 30-60 seconds
- **Docker first build**: 15-20 minutes (includes environment setup)

## 💾 DISK SPACE REQUIREMENTS

- **Android SDK**: ~15 GB
- **Gradle cache**: ~2-5 GB
- **node_modules**: ~800 MB
- **Build artifacts**: ~500 MB
- **Total**: ~20-25 GB

## 🎯 VERSION COMPATIBILITY MATRIX

| RN Version | Gradle | AGP   | compileSdk | Java | Status |
|------------|--------|-------|------------|------|--------|
| 0.75.3     | 8.8    | 8.2.1 | 34         | 17   | ❌ Broken |
| 0.74.5     | 8.8    | 8.5.2 | 35         | 17   | ✅ **WORKS** |
| 0.74.5     | 8.9+   | 8.7+  | 35         | 17   | ❌ serviceOf error |
| 0.74.5     | 8.8    | 8.6+  | 34         | 17   | ❌ Gradle version conflict |

## 📞 SUPPORT CHECKLIST

Before asking for help:
- [ ] Using exact versions from this card?
- [ ] Cleaned Gradle cache?
- [ ] Have 8GB+ RAM available?
- [ ] Gradle settings match (2GB max)?
- [ ] NDK version is exactly 25.1.8937393?
- [ ] androidx.core forced to 1.13.1?
- [ ] Tried clean build?

## 🎓 THE HARD-EARNED WISDOM

> "The pain of 2 days of debugging, distilled into a single configuration that Just Works™"

Remember:
1. Newer ≠ Better (RN 0.74 > 0.75 for stability)
2. Version compatibility > Latest features
3. Memory constraints are real (7GB is tight!)
4. Force dependencies when necessary
5. Document everything for your future self

---

**Created**: After 2 days of build hell  
**Last Updated**: November 2, 2025  
**Status**: ✅ VERIFIED WORKING  
**Casualties**: 1 corrupted Gradle cache, multiple JVM crashes, countless build failures  
**Victory**: APK successfully built and deployed to device d1122fe8
