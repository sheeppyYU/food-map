const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 設定路徑
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'extension-backup');
const IOS_DIR = path.join(ROOT_DIR, 'ios');

// 確保備份目錄存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 要備份的文件和目錄
const filesToBackup = [
  'ShareExtension',
  'ShareExtension-Info.plist',
  'ShareViewController.swift',
  'ShareViewController.h',
  'ShareViewController.m'
];

// Xcode 專案相關文件
const xcodeFiles = [
  'foodmap.xcodeproj/project.pbxproj',
  'foodmap.xcodeproj/project.xcworkspace',
  'foodmap.xcodeproj/xcshareddata/xcschemes/ShareExtension.xcscheme'
];

console.log('開始備份 Share Extension...');

try {
  // 備份 ShareExtension 目錄
  const extensionDir = path.join(IOS_DIR, 'ShareExtension');
  if (fs.existsSync(extensionDir)) {
    const backupExtensionDir = path.join(BACKUP_DIR, 'ShareExtension');
    if (fs.existsSync(backupExtensionDir)) {
      fs.rmSync(backupExtensionDir, { recursive: true, force: true });
    }
    fs.cpSync(extensionDir, backupExtensionDir, { recursive: true });
    console.log('✓ 已備份 ShareExtension 目錄');
  }

  // 備份其他文件
  filesToBackup.forEach(file => {
    const sourcePath = path.join(IOS_DIR, file);
    const backupPath = path.join(BACKUP_DIR, file);
    
    if (fs.existsSync(sourcePath)) {
      if (fs.lstatSync(sourcePath).isDirectory()) {
        if (fs.existsSync(backupPath)) {
          fs.rmSync(backupPath, { recursive: true, force: true });
        }
        fs.cpSync(sourcePath, backupPath, { recursive: true });
      } else {
        fs.copyFileSync(sourcePath, backupPath);
      }
      console.log(`✓ 已備份 ${file}`);
    }
  });

  // 備份 Xcode 專案文件
  xcodeFiles.forEach(file => {
    const sourcePath = path.join(IOS_DIR, file);
    const backupPath = path.join(BACKUP_DIR, 'xcode', file);
    
    if (fs.existsSync(sourcePath)) {
      // 確保目標目錄存在
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      if (fs.lstatSync(sourcePath).isDirectory()) {
        if (fs.existsSync(backupPath)) {
          fs.rmSync(backupPath, { recursive: true, force: true });
        }
        fs.cpSync(sourcePath, backupPath, { recursive: true });
      } else {
        fs.copyFileSync(sourcePath, backupPath);
      }
      console.log(`✓ 已備份 ${file}`);
    }
  });

  // 備份 project.pbxproj 中的 extension 相關設定
  const pbxprojPath = path.join(IOS_DIR, 'foodmap.xcodeproj', 'project.pbxproj');
  if (fs.existsSync(pbxprojPath)) {
    const backupPbxprojPath = path.join(BACKUP_DIR, 'xcode', 'foodmap.xcodeproj', 'project.pbxproj');
    // 確保目標目錄存在
    const backupDir = path.dirname(backupPbxprojPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.copyFileSync(pbxprojPath, backupPbxprojPath);
    console.log('✓ 已備份 project.pbxproj');
  }

  console.log('\n✅ 備份完成！所有文件已保存到 extension-backup 目錄');
} catch (error) {
  console.error('❌ 備份過程中發生錯誤：', error);
  process.exit(1);
} 