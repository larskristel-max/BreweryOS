const PRODUCT_CONFIG = {
  identity: {
    key: 'operon',
    legacyKeys: ['brewos', 'brewery-os'],
    name: 'Operon',
    shortName: 'Operon',
    tagline: 'vos opérations brassicoles',
    locale: 'fr',
    logoPath: '/assets/branding/operon-logo.svg',
    wordmarkSuffix: 'peron',
  },
  supportedLanguages: ['fr', 'nl', 'en', 'de'],
  featureFlags: {
    operationsContractV1: true,
    canonicalDomainFoundation: true,
    translationKeyFoundation: true,
  },
  displayStrings: {
    startupLoadingLabel: 'Operon',
    entryTitle: 'Welcome to Operon',
    tryDemo: 'Try Operon',
    cta: 'See Operon in action',
  },
};

function getProductIdentity() {
  return PRODUCT_CONFIG.identity;
}

function getBrandWordmarkSegments() {
  return {
    mark: PRODUCT_CONFIG.identity.name.charAt(0).toUpperCase(),
    suffix: PRODUCT_CONFIG.identity.wordmarkSuffix || PRODUCT_CONFIG.identity.name.slice(1),
  };
}
