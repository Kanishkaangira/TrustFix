const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const voiceAndroidDir = path.join(
  projectRoot,
  'node_modules',
  '@react-native-voice',
  'voice',
  'android',
);

const buildGradlePath = path.join(voiceAndroidDir, 'build.gradle');
const voiceModulePath = path.join(
  voiceAndroidDir,
  'src',
  'main',
  'java',
  'com',
  'wenkesj',
  'voice',
  'VoiceModule.java',
);

const modernBuildGradle = `apply plugin: 'com.android.library'

repositories {
    google()
    mavenCentral()
}

android {
    namespace "com.wenkesj.voice"
    compileSdk rootProject.ext.compileSdkVersion

    defaultConfig {
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    implementation("androidx.appcompat:appcompat:1.7.0")
}
`;

try {
  if (fs.existsSync(buildGradlePath)) {
    fs.writeFileSync(buildGradlePath, modernBuildGradle, 'utf8');
  }

  if (fs.existsSync(voiceModulePath)) {
    const voiceModule = fs.readFileSync(voiceModulePath, 'utf8');
    const patchedModule = voiceModule.replace('return "RCTVoice";', 'return "Voice";');
    fs.writeFileSync(voiceModulePath, patchedModule, 'utf8');
  }

  console.log('react-native-voice patched for modern React Native Android builds.');
} catch (error) {
  console.warn('Failed to patch react-native-voice:', error.message);
}
