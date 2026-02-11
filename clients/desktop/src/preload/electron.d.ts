interface ElectronBridge {
  platform: string;
  isElectron: true;
}

interface Window {
  electron?: ElectronBridge;
}
