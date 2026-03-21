export const CROP_TYPES = {
  WHEAT: "grau",
  CORN: "porumb",
  GRAPE: "vie",
  SUNFLOWER: "floarea_soarelui",
  POTATO: "cartof",
  SUGAR_BEET: "sfecla_de_zahar",
  BARLEY: "orz",
} as const;

export const CROP_ICONS_MAP = {
  grau: "wheat",
  porumb: "corn",
  vie: "grape",
  wheat: "wheat",
  corn: "corn",
  grape: "grape",
  floarea_soarelui: "sunflower",
  cartof: "potato",
  sfecla_de_zahar: "sugar_beet",
  orz: "barley",
} as const;

export const HEALTH_STATUS = {
  HEALTHY: "healthy",
  FIRE: "fire",
  FLOOD: "flood",
} as const;

export const ALERT_TYPES = {
  FIRE: "fire",
  FLOOD: "flood",
  WARNING: "warning",
  NDVI: "ndvi",
} as const;

export const ALERT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export const PACKAGES = {
  BASIC: "Basic",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
  PER_RAPORT: "Per Raport",
} as const;

export const PACKAGE_CONFIGS = {
  Basic: {
    reports: 5,
    price: 29,
    features: ["5 reports per month", "Real-time alerts", "Basic analytics"],
  },
  Pro: {
    reports: 15,
    price: 79,
    features: [
      "15 reports per month",
      "Real-time alerts",
      "Advanced analytics",
      "Priority support",
    ],
  },
  Enterprise: {
    reports: 30,
    price: 199,
    features: [
      "Unlimited reports",
      "Real-time alerts",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
    ],
  },
  "Per Raport": {
    reports: 1,
    price: 9,
    features: ["1 additional report"],
  },
} as const;

export const NDVI_THRESHOLDS = {
  EXCELLENT: 0.7,
  GOOD: 0.5,
  MODERATE: 0.3,
} as const;

export const MAP_BOUNDS = {
  ROMANIA: [
    [43.5, 20.2],
    [48.3, 30.0],
  ] as [[number, number], [number, number]],
} as const;

export const LOADING_MESSAGES = {
  SATELLITE: "Se inițializează conexiunea satelitară...",
  INFRARED: "Se scanează spectrul infraroșu...",
  WEATHER: "Se analizează datele meteorologice...",
  SENSORS: "Se corelează cu senzorii la sol...",
  REPORT: "Se finalizează raportul de alerte...",
} as const;

export const MESSAGES = {
  CHAT_INITIAL:
    "Bună! Sunt SpotyBot, asistentul tău pentru monitorizarea terenurilor. Cum te pot ajuta astăzi?",
  NO_PROPERTIES: "Nu ai terenuri înregistrate",
  NO_ALERTS: "Nu sunt alerte în acest moment",
  CONFIRM_DELETE: "Ești sigur că vrei să ștergi acest teren?",
  LOADING: "Se încarcă...",
  ERROR: "Îmi pare rău, a apărut o eroare. Vă rugăm să încercați din nou.",
} as const;

export const DATETIME_FORMAT_OPTIONS = {
  DATE_SHORT: {
    year: "numeric" as const,
    month: "2-digit" as const,
    day: "2-digit" as const,
  },
  TIME_SHORT: {
    hour: "2-digit" as const,
    minute: "2-digit" as const,
  },
  DATETIME_FULL: {
    year: "numeric" as const,
    month: "short" as const,
    day: "2-digit" as const,
    hour: "2-digit" as const,
    minute: "2-digit" as const,
  },
} as const;
