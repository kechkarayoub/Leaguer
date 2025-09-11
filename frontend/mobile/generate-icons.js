#!/usr/bin/env node

/**
 * Icon Generator Script for React Native
 * This script converts SVG logo to various app icon sizes
 * Usage: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Required packages check
const requiredPackages = ['sharp'];
let canGenerate = true;

requiredPackages.forEach(pkg => {
  try {
    require(pkg);
  } catch (e) {
    console.log(`❌ Missing package: ${pkg}`);
    console.log(`   Install with: npm install ${pkg}`);
    canGenerate = false;
  }
});

if (!canGenerate) {
  console.log('\n🔧 Install missing packages first, then run this script again.');
  process.exit(1);
}

const sharp = require('sharp');

// Icon sizes for Android
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Icon sizes for iOS
const iosSizes = {
  '20x20': 20,
  '29x29': 29,
  '40x40': 40,
  '58x58': 58,
  '60x60': 60,
  '80x80': 80,
  '87x87': 87,
  '120x120': 120,
  '180x180': 180,
  '1024x1024': 1024
};

async function generateIcons() {
  const logoPath = path.join(__dirname, 'assets', 'logo.svg');
  
  if (!fs.existsSync(logoPath)) {
    console.log('❌ Logo file not found at assets/logo.svg');
    return;
  }

  console.log('🎨 Generating app icons...');

  try {
    // Generate Android icons
    console.log('📱 Generating Android icons...');
    for (const [folder, size] of Object.entries(androidSizes)) {
      const outputDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', folder);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate normal and round icons
      await sharp(logoPath)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, 'ic_launcher.png'));

      await sharp(logoPath)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, 'ic_launcher_round.png'));

      console.log(`  ✅ Generated ${folder}/ic_launcher.png (${size}x${size})`);
    }

    // Generate iOS icons
    console.log('🍎 Generating iOS icons...');
    const iosIconDir = path.join(__dirname, 'ios', 'leaguer', 'Images.xcassets', 'AppIcon.appiconset');
    
    if (!fs.existsSync(iosIconDir)) {
      fs.mkdirSync(iosIconDir, { recursive: true });
    }

    for (const [name, size] of Object.entries(iosSizes)) {
      await sharp(logoPath)
        .resize(size, size)
        .png()
        .toFile(path.join(iosIconDir, `Icon-${name}.png`));

      console.log(`  ✅ Generated iOS Icon-${name}.png (${size}x${size})`);
    }

    // Generate Contents.json for iOS
    const contentsJson = {
      images: [
        { idiom: "iphone", scale: "2x", size: "20x20", filename: "Icon-40x40.png" },
        { idiom: "iphone", scale: "3x", size: "20x20", filename: "Icon-60x60.png" },
        { idiom: "iphone", scale: "2x", size: "29x29", filename: "Icon-58x58.png" },
        { idiom: "iphone", scale: "3x", size: "29x29", filename: "Icon-87x87.png" },
        { idiom: "iphone", scale: "2x", size: "40x40", filename: "Icon-80x80.png" },
        { idiom: "iphone", scale: "3x", size: "40x40", filename: "Icon-120x120.png" },
        { idiom: "iphone", scale: "2x", size: "60x60", filename: "Icon-120x120.png" },
        { idiom: "iphone", scale: "3x", size: "60x60", filename: "Icon-180x180.png" },
        { idiom: "ios-marketing", scale: "1x", size: "1024x1024", filename: "Icon-1024x1024.png" }
      ],
      info: { version: 1, author: "xcode" }
    };

    fs.writeFileSync(
      path.join(iosIconDir, 'Contents.json'),
      JSON.stringify(contentsJson, null, 2)
    );

    console.log('  ✅ Generated Contents.json for iOS');
    console.log('\n🎉 All icons generated successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Clean and rebuild your app');
    console.log('   2. Run: npx react-native run-android');
    console.log('   3. Run: npx react-native run-ios');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
  }
}

if (require.main === module) {
  generateIcons();
}

module.exports = generateIcons;
