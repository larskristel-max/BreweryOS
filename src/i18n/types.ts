export interface TranslationKeys {
  language: {
    select: {
      title: string;
      subtitle: string;
    };
    names: {
      en: string;
      fr: string;
      nl: string;
      de: string;
    };
  };
  nav: {
    operations: string;
    batches: string;
    recipes: string;
    settings: string;
    brew: string;
  };
  operations: {
    title: string;
    comingSoon: string;
    status: {
      active: string;
      paused: string;
      completed: string;
      cancelled: string;
      pending: string;
    };
    labels: {
      startDate: string;
      endDate: string;
      duration: string;
      volume: string;
      target: string;
      actual: string;
      variance: string;
    };
  };
  batch: {
    title: string;
    titleDetail: string;
    comingSoon: string;
    detailComingSoon: string;
    status: {
      active: string;
      fermenting: string;
      conditioning: string;
      ready: string;
      archived: string;
      blocked: string;
    };
    workflow: {
      mashing: string;
      lautering: string;
      boiling: string;
      whirlpool: string;
      fermentation: string;
      maturation: string;
      packaging: string;
      qualityCheck: string;
    };
    readiness: {
      ready: string;
      notReady: string;
      checkRequired: string;
      awaitingApproval: string;
    };
    blocked: {
      missingIngredients: string;
      equipmentUnavailable: string;
      qualityHold: string;
      awaitingAnalysis: string;
      temperatureOutOfRange: string;
      pressureOutOfRange: string;
      staffUnavailable: string;
    };
    labels: {
      batchNumber: string;
      recipe: string;
      brewer: string;
      startDate: string;
      estimatedEnd: string;
      currentStep: string;
      gravity: string;
      temperature: string;
      ph: string;
      notes: string;
    };
  };
  recipe: {
    title: string;
    titleNew: string;
    titleDetail: string;
    comingSoon: string;
    newComingSoon: string;
    detailComingSoon: string;
    labels: {
      style: string;
      abv: string;
      ibu: string;
      srm: string;
      og: string;
      fg: string;
      ingredients: string;
      steps: string;
      notes: string;
      author: string;
      version: string;
    };
  };
  brew: {
    title: string;
    comingSoon: string;
  };
  settings: {
    title: string;
    language: string;
    languageDescription: string;
    account: string;
    brewery: string;
    notifications: string;
    appearance: string;
    about: string;
    version: string;
    signOut: string;
  };
  auth: {
    welcome: string;
    signIn: string;
    signUp: string;
    createAccount: string;
    continueAsDemo: string;
    backToSignIn: string;
    comingSoon: string;
    email: string;
    password: string;
    forgotPassword: string;
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    done: string;
    close: string;
    yes: string;
    no: string;
    comingSoon: string;
  };
}
