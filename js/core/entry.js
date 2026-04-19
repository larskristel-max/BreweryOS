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

function handleLoginUnavailable() {
  toast('Not available yet');
}

function handleSignupUnavailable() {
  toast('Not available yet');
}
