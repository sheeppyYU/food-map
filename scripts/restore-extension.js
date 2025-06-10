const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 設定路徑
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'extension-backup');
const IOS_DIR = path.join(ROOT_DIR, 'ios');

// 檢查備份目錄是否存在
if (!fs.existsSync(BACKUP_DIR)) {
  console.error('❌ 找不到備份目錄！請先運行 backup-extension.js');
  process.exit(1);
}

console.log('開始還原 Share Extension...');

try {
  // 還原 ShareExtension 目錄
  const backupExtensionDir = path.join(BACKUP_DIR, 'ShareExtension');
  const extensionDir = path.join(IOS_DIR, 'ShareExtension');
  
  if (fs.existsSync(backupExtensionDir)) {
    if (fs.existsSync(extensionDir)) {
      fs.rmSync(extensionDir, { recursive: true, force: true });
    }
    fs.cpSync(backupExtensionDir, extensionDir, { recursive: true });
    console.log('✓ 已還原 ShareExtension 目錄');
  }

  // 還原 Xcode 專案文件
  const xcodeBackupDir = path.join(BACKUP_DIR, 'xcode');
  if (fs.existsSync(xcodeBackupDir)) {
    // 還原 project.pbxproj
    const backupPbxprojPath = path.join(xcodeBackupDir, 'foodmap.xcodeproj', 'project.pbxproj');
    const pbxprojPath = path.join(IOS_DIR, 'foodmap.xcodeproj', 'project.pbxproj');
    
    if (fs.existsSync(backupPbxprojPath)) {
      // 讀取備份的 project.pbxproj
      const backupContent = fs.readFileSync(backupPbxprojPath, 'utf8');
      const currentContent = fs.readFileSync(pbxprojPath, 'utf8');

      // 提取 extension 相關的設定
      const extensionRegex = /\/\* ShareExtension \*\/ = {[^}]+}/g;
      const extensionMatches = backupContent.match(extensionRegex);
      
      if (extensionMatches) {
        let newContent = currentContent;
        extensionMatches.forEach(match => {
          // 如果當前文件已經包含這個設定，先移除它
          newContent = newContent.replace(/\/\* ShareExtension \*\/ = {[^}]+}/g, '');
          // 在適當的位置插入 extension 設定
          newContent = newContent.replace(
            /objects = {/,
            `objects = {\n\t\t${match}`
          );
        });
        fs.writeFileSync(pbxprojPath, newContent);
        console.log('✓ 已還原 project.pbxproj 中的 extension 設定');
      }
    }

    // 還原其他 Xcode 專案文件
    const xcodeFiles = [
      'foodmap.xcodeproj/project.xcworkspace',
      'foodmap.xcodeproj/xcshareddata/xcschemes/ShareExtension.xcscheme'
    ];

    xcodeFiles.forEach(file => {
      const backupPath = path.join(xcodeBackupDir, file);
      const targetPath = path.join(IOS_DIR, file);
      
      if (fs.existsSync(backupPath)) {
        // 確保目標目錄存在
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        if (fs.lstatSync(backupPath).isDirectory()) {
          if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { recursive: true, force: true });
          }
          fs.cpSync(backupPath, targetPath, { recursive: true });
        } else {
          fs.copyFileSync(backupPath, targetPath);
        }
        console.log(`✓ 已還原 ${file}`);
      }
    });
  }

  // 執行 pod install
  console.log('\n正在執行 pod install...');
  execSync('cd ios && pod install', { stdio: 'inherit' });
  
  console.log('\n✅ 還原完成！請用 Xcode 打開專案，確認 Share Extension target 是否正確顯示');
  console.log('📝 提示：如果 target 沒有自動出現，請在 Xcode 中手動添加 Share Extension target');
} catch (error) {
  console.error('❌ 還原過程中發生錯誤：', error);
  process.exit(1);
} 