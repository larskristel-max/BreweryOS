const SPLASH_DURATION_MS = 1400;
let splashTimer = null;

function startEntryFlow() {
  showScreen('screen-splash');
  clearTimeout(splashTimer);
  splashTimer = setTimeout(() => {
    const nextScreen = getPostSplashScreen();
    showScreen(nextScreen);
  }, SPLASH_DURATION_MS);
}

function enterAppFromEntry() {
  showScreen('screen-home');
}
