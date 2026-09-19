export type SupportedLanguage =
  | 'hi' // Hindi (हिन्दी)
  | 'mr' // Marathi (मराठी)
  | 'bn' // Bengali (বাংলা)
  | 'te' // Telugu (తెలుగు)
  | 'ta' // Tamil (தமிழ்)
  | 'gu' // Gujarati (ગુજરાતી)
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'pa' // Punjabi (ਪੰਜਾਬੀ)
  | 'en' // English
  | 'es' // Spanish (Español)
  | 'fr' // French (Français)
  | 'ar' // Arabic (العربية)
  | 'pt' // Portuguese (Português)
  | 'ru' // Russian (Русский)
  | 'zh' // Chinese Simplified (简体中文)
  | 'ja' // Japanese (日本語)
  | 'de' // German (Deutsch)
  | 'ne' // Nepali (नेपाली)
  | 'id' // Indonesian (Bahasa Indonesia)
  | 'tr'; // Turkish (Türkçe)

export interface LanguageMeta {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  region: 'indian' | 'global';
  dir: 'ltr' | 'rtl';
  script: 'indic' | 'latin' | 'arabic' | 'cjk' | 'cyrillic';
}

export interface TranslationDictionary {
  brand: {
    title: string;
    beacon: string;
    subtitle: string;
  };
  connectivity: {
    offlineActive: string;
    offlineSubtitle: string;
    onlineActive: string;
    pendingCount: string;
    syncNow: string;
    syncing: string;
  };
  categories: {
    flood: string;
    medical: string;
    fire: string;
    trapped: string;
    landslide: string;
    storm: string;
    other: string;
  };
  urgentNeeds: {
    medical: string;
    water: string;
    food: string;
    evacuation: string;
    shelter: string;
    warmth: string;
    oxygen: string;
    search_rescue: string;
  };
  form: {
    selectCategory: string;
    selectUrgentNeeds: string;
    peopleAffected: string;
    peopleHelpText: string;
    location: string;
    detectGps: string;
    detectingGps: string;
    gpsAcquired: string;
    locationPlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    voiceDistress: string;
    startRecording: string;
    stopRecording: string;
    audioRecorded: string;
    beaconStrobe: string;
    beaconHelp: string;
    transmitSos: string;
    transmitting: string;
    requiredField: string;
    validationError: string;
  };
  status: {
    sosTransmitted: string;
    incidentId: string;
    reportedAt: string;
    stepReported: string;
    stepAcknowledged: string;
    stepInProgress: string;
    stepResolved: string;
    suggestedAction: string;
    defaultDirective: string;
    assignedUnits: string;
    noUnitsYet: string;
    submitAnother: string;
  };
  languages: {
    selectLanguage: string;
    indianLanguages: string;
    globalLanguages: string;
  };
}