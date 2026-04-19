function hasUserSession() {
  // Temporary auth stub. Return false until real login/session handling exists.
  return false;
}

function shouldForceLanguageSelection() {
  // Without a real session, always require language selection on each open.
  // This keeps the language-first flow active in demo mode.
  // When hasUserSession() becomes true, saved preference can skip this step.
  return !hasUserSession();
}

function getInitialScreen() {
  return 'screen-splash';
}

function getPostSplashScreen() {
  if (!hasSavedLanguagePreference() || shouldForceLanguageSelection()) {
    return 'screen-language';
  }
  return 'screen-entry';
}

function navigateBack(fallbackScreen = 'screen-home') {
  if (screenStack.length > 1) {
    screenStack.pop();
    const prev = screenStack[screenStack.length - 1] || fallbackScreen;
    isHistoryNavigation = true;
    showScreen(prev);
    isHistoryNavigation = false;
    return;
  }
  showScreen(fallbackScreen);
}

function goBack() {
  navigateBack('screen-home');
}

function goBackToBatches() {
  navigateBack('screen-batches');
}
