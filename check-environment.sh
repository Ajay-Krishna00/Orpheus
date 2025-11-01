#!/bin/bash
# Orpheus Build Environment Verification Script
# Run this to check if your environment matches the working configuration

echo "🔍 Orpheus Build Environment Checker"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_version() {
    local name=$1
    local current=$2
    local expected=$3
    
    if [ "$current" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $name: $current"
        return 0
    else
        echo -e "${RED}✗${NC} $name: $current (expected: $expected)"
        return 1
    fi
}

check_range() {
    local name=$1
    local current=$2
    local min=$3
    
    if [ "$current" -ge "$min" ]; then
        echo -e "${GREEN}✓${NC} $name: $current GB"
        return 0
    else
        echo -e "${RED}✗${NC} $name: $current GB (minimum: $min GB)"
        return 1
    fi
}

errors=0

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    node_version=$(node -v | sed 's/v//' | cut -d'.' -f1)
    if [ "$node_version" -eq 18 ]; then
        echo -e "${GREEN}✓${NC} Node.js: v$(node -v | sed 's/v//')"
    else
        echo -e "${YELLOW}⚠${NC} Node.js: v$(node -v | sed 's/v//') (recommended: 18.x)"
    fi
else
    echo -e "${RED}✗${NC} Node.js: NOT FOUND"
    ((errors++))
fi
echo ""

# Check Java
echo "☕ Checking Java..."
if command -v java &> /dev/null; then
    java_version=$(java -version 2>&1 | grep -oP 'version "?(1\.)?\K\d+' | head -1)
    check_version "Java" "$java_version" "17" || ((errors++))
else
    echo -e "${RED}✗${NC} Java: NOT FOUND"
    ((errors++))
fi
echo ""

# Check Android SDK
echo "🤖 Checking Android SDK..."
if [ -n "$ANDROID_HOME" ]; then
    echo -e "${GREEN}✓${NC} ANDROID_HOME: $ANDROID_HOME"
    
    # Check for SDK 35
    if [ -d "$ANDROID_HOME/platforms/android-35" ]; then
        echo -e "${GREEN}✓${NC} Android SDK 35: Installed"
    else
        echo -e "${RED}✗${NC} Android SDK 35: NOT FOUND"
        ((errors++))
    fi
    
    # Check for NDK
    if [ -d "$ANDROID_HOME/ndk/25.1.8937393" ]; then
        echo -e "${GREEN}✓${NC} NDK 25.1.8937393: Installed"
    else
        echo -e "${RED}✗${NC} NDK 25.1.8937393: NOT FOUND"
        echo -e "   ${YELLOW}Found NDKs:${NC}"
        ls -1 "$ANDROID_HOME/ndk/" 2>/dev/null || echo "   None"
        ((errors++))
    fi
else
    echo -e "${RED}✗${NC} ANDROID_HOME: NOT SET"
    ((errors++))
fi
echo ""

# Check Gradle
echo "🐘 Checking Gradle..."
if [ -f "./android/gradlew" ]; then
    gradle_version=$(grep "distributionUrl" ./android/gradle/wrapper/gradle-wrapper.properties | grep -oP 'gradle-\K[0-9.]+')
    check_version "Gradle" "$gradle_version" "8.8" || ((errors++))
else
    echo -e "${RED}✗${NC} Gradle wrapper: NOT FOUND"
    ((errors++))
fi
echo ""

# Check package.json versions
echo "📦 Checking package.json..."
if [ -f "./package.json" ]; then
    rn_version=$(grep '"react-native"' package.json | grep -oP '"\K[0-9.]+')
    react_version=$(grep '"react"' package.json | grep -oP '"\K[0-9.]+' | head -1)
    gh_version=$(grep '"react-native-gesture-handler"' package.json | grep -oP '"\K[0-9.]+')
    
    check_version "React Native" "$rn_version" "0.74.5" || ((errors++))
    check_version "React" "$react_version" "18.2.0" || ((errors++))
    check_version "gesture-handler" "$gh_version" "2.14.1" || ((errors++))
else
    echo -e "${RED}✗${NC} package.json: NOT FOUND"
    ((errors++))
fi
echo ""

# Check android/build.gradle
echo "🔧 Checking android/build.gradle..."
if [ -f "./android/build.gradle" ]; then
    compile_sdk=$(grep "compileSdkVersion" android/build.gradle | grep -oP '\d+')
    ndk_version=$(grep "ndkVersion" android/build.gradle | grep -oP '"\K[^"]+')
    agp_version=$(grep "com.android.tools.build:gradle:" android/build.gradle | grep -oP ':\K[0-9.]+')
    
    check_version "compileSdk" "$compile_sdk" "35" || ((errors++))
    check_version "NDK version" "$ndk_version" "25.1.8937393" || ((errors++))
    check_version "Android Gradle Plugin" "$agp_version" "8.5.2" || ((errors++))
else
    echo -e "${RED}✗${NC} android/build.gradle: NOT FOUND"
    ((errors++))
fi
echo ""

# Check android/app/build.gradle for force resolution
echo "🔒 Checking androidx.core force resolution..."
if grep -q "force 'androidx.core:core:1.13.1'" ./android/app/build.gradle; then
    echo -e "${GREEN}✓${NC} androidx.core force resolution: CONFIGURED"
else
    echo -e "${RED}✗${NC} androidx.core force resolution: MISSING"
    echo -e "   ${YELLOW}Add this to android/app/build.gradle:${NC}"
    echo "   configurations.all {"
    echo "       resolutionStrategy {"
    echo "           force 'androidx.core:core:1.13.1'"
    echo "           force 'androidx.core:core-ktx:1.13.1'"
    echo "       }"
    echo "   }"
    ((errors++))
fi
echo ""

# Check RAM
echo "💾 Checking system resources..."
if command -v free &> /dev/null; then
    total_ram=$(free -g | grep Mem | awk '{print $2}')
    check_range "Total RAM" "$total_ram" "7" || ((errors++))
elif [[ "$OSTYPE" == "darwin"* ]]; then
    total_ram=$(sysctl hw.memsize | awk '{print int($2/1024/1024/1024)}')
    check_range "Total RAM" "$total_ram" "7" || ((errors++))
else
    echo -e "${YELLOW}⚠${NC} Cannot determine RAM (unsupported OS)"
fi
echo ""

# Check disk space
echo "💿 Checking disk space..."
if command -v df &> /dev/null; then
    free_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    check_range "Free disk space" "$free_space" "25" || ((errors++))
fi
echo ""

# Summary
echo "===================================="
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Your environment matches the working configuration."
    echo "You should be able to build successfully with:"
    echo "  npm run android"
    exit 0
else
    echo -e "${RED}❌ Found $errors issue(s)${NC}"
    echo ""
    echo "Please fix the issues above before building."
    echo ""
    echo "Quick fixes:"
    echo "  - Missing tools: See BUILD_REFERENCE.md"
    echo "  - Wrong versions: Use Docker (see DOCKER_BUILD.md)"
    echo "  - Low resources: Close other applications"
    exit 1
fi
