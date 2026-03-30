const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const svgAndroidDir = path.join(
  projectRoot,
  'node_modules',
  'react-native-svg',
  'android',
  'src',
  'main',
  'java',
  'com',
  'horcrux',
  'svg',
);

const renderableManagerPath = path.join(svgAndroidDir, 'RNSVGRenderableManager.java');
const svgPackagePath = path.join(svgAndroidDir, 'SvgPackage.java');
const virtualViewPath = path.join(svgAndroidDir, 'VirtualView.java');

try {
  if (fs.existsSync(renderableManagerPath)) {
    let managerFile = fs.readFileSync(renderableManagerPath, 'utf8');
    managerFile = managerFile.replace(
      /import static com\.facebook\.react\.common\.StandardCharsets\.UTF_8;\r?\n\r?\n/g,
      '',
    );
    if (!managerFile.includes('import java.nio.charset.StandardCharsets;')) {
      managerFile = managerFile.replace(
        /import java\.io\.InputStreamReader;\r?\n/,
        (match) => `${match}import java.nio.charset.StandardCharsets;\n`,
      );
    }
    managerFile = managerFile.replace(
      'new InputStreamReader(stream, UTF_8)',
      'new InputStreamReader(stream, StandardCharsets.UTF_8)',
    );
    fs.writeFileSync(renderableManagerPath, managerFile, 'utf8');
  }

  if (fs.existsSync(virtualViewPath)) {
    let virtualViewFile = fs.readFileSync(virtualViewPath, 'utf8');
    virtualViewFile = virtualViewFile.replace(
      /(?:public\s+)+void setPointerEvents\(PointerEvents pointerEvents\)/,
      'public void setPointerEvents(PointerEvents pointerEvents)',
    );
    fs.writeFileSync(virtualViewPath, virtualViewFile, 'utf8');
  }

  if (fs.existsSync(svgPackagePath)) {
    let svgPackageFile = fs.readFileSync(svgPackagePath, 'utf8');
    svgPackageFile = svgPackageFile.replace(
      'return (List<String>) getViewManagersMap(reactContext).keySet();',
      'return new ArrayList<>(getViewManagersMap(reactContext).keySet());',
    );
    fs.writeFileSync(svgPackagePath, svgPackageFile, 'utf8');
  }

  console.log('react-native-svg patched for React Native 0.84 Android build compatibility.');
} catch (error) {
  console.warn('Failed to patch react-native-svg:', error.message);
}
