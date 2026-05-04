const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to inject signing configuration into the Android build.
 * This allows 'npx expo prebuild' to generate a signed project automatically.
 */
const withAndroidSigning = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setSigningConfig(config.modResults.contents);
    }
    return config;
  });
};

function setSigningConfig(buildGradle) {
  // 1. Add our release signing credentials into the signingConfigs block
  if (buildGradle.includes('signingConfigs {') && !buildGradle.includes('signingConfig signingConfigs.release')) {
    const releaseSigning = `
        release {
            storeFile file("../../saily-release.keystore")
            storePassword "Sathwik@29"
            keyAlias "saily-alias"
            keyPassword "Sathwik@29"
        }
    `;
    buildGradle = buildGradle.replace(/signingConfigs\s*\{/, (match) => {
      return match + releaseSigning;
    });
  }

  // 2. Enable Universal APK support for all device architectures
  if (buildGradle.includes('android {') && !buildGradle.includes('universalApk true')) {
    const splitsBlock = `
    splits {
        abi {
            reset()
            enable true
            universalApk true
        }
    }
    `;
    buildGradle = buildGradle.replace(/android\s*\{/, (match) => {
      return match + splitsBlock;
    });
  }

  // 3. Point the release build type to our new signing configuration
  if (buildGradle.includes('buildTypes {')) {
    buildGradle = buildGradle.replace(/release\s*\{[\s\S]*?signingConfig signingConfigs\.debug/, (match) => {
      return match.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release');
    });
  }

  return buildGradle;
}

module.exports = withAndroidSigning;
