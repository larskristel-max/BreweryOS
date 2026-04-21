import type { BreweryContext } from "@/context/AppContext";

/** Demo brewery context used when in demo mode */
export const DEMO_BREWERY: BreweryContext = {
  breweryId: "demo",
  name: "Hopsburg Brewing Co.",
  language: "en",
  timezone: "Europe/Brussels",
  country: "BE",
  exciseEnabled: true,
  notionSourceId: null,
  role: "owner",
};

export interface DemoBatch {
  id: string;
  batchNumber: string;
  recipeName: string;
  status: "mashing" | "boiling" | "fermenting" | "conditioning" | "packaged";
  og: number | null;
  fg: number | null;
  abv: number | null;
  ibu: number | null;
  ebc: number | null;
  volumeL: number;
  startedAt: string;
  notes: string;
}

export interface DemoRecipe {
  id: string;
  name: string;
  style: string;
  og: number;
  fg: number;
  abv: number;
  ibu: number;
  ebc: number;
  volumeL: number;
  lastBrewedAt: string | null;
}

export const DEMO_BATCHES: DemoBatch[] = [
  {
    id: "demo-batch-1",
    batchNumber: "B2024-047",
    recipeName: "Golden Citrus IPA",
    status: "fermenting",
    og: 1.062,
    fg: null,
    abv: null,
    ibu: 62,
    ebc: 8,
    volumeL: 500,
    startedAt: "2024-04-17",
    notes: "Dry-hop with Citra & Mosaic at day 4.",
  },
  {
    id: "demo-batch-2",
    batchNumber: "B2024-046",
    recipeName: "Dark Rye Stout",
    status: "conditioning",
    og: 1.072,
    fg: 1.018,
    abv: 7.1,
    ibu: 35,
    ebc: 80,
    volumeL: 300,
    startedAt: "2024-04-08",
    notes: "Roast character developing well.",
  },
  {
    id: "demo-batch-3",
    batchNumber: "B2024-045",
    recipeName: "Wheat Blanche",
    status: "packaged",
    og: 1.048,
    fg: 1.010,
    abv: 4.9,
    ibu: 15,
    ebc: 5,
    volumeL: 600,
    startedAt: "2024-03-28",
    notes: "Packaged in 330ml cans. Excise declared.",
  },
];

export const DEMO_RECIPES: DemoRecipe[] = [
  {
    id: "demo-recipe-1",
    name: "Golden Citrus IPA",
    style: "American IPA",
    og: 1.062,
    fg: 1.012,
    abv: 6.5,
    ibu: 62,
    ebc: 8,
    volumeL: 500,
    lastBrewedAt: "2024-04-17",
  },
  {
    id: "demo-recipe-2",
    name: "Dark Rye Stout",
    style: "Foreign Extra Stout",
    og: 1.072,
    fg: 1.018,
    abv: 7.1,
    ibu: 35,
    ebc: 80,
    volumeL: 300,
    lastBrewedAt: "2024-04-08",
  },
  {
    id: "demo-recipe-3",
    name: "Wheat Blanche",
    style: "Belgian Witbier",
    og: 1.048,
    fg: 1.010,
    abv: 4.9,
    ibu: 15,
    ebc: 5,
    volumeL: 600,
    lastBrewedAt: "2024-03-28",
  },
  {
    id: "demo-recipe-4",
    name: "Session Pale Ale",
    style: "Session Pale Ale",
    og: 1.040,
    fg: 1.008,
    abv: 4.2,
    ibu: 30,
    ebc: 10,
    volumeL: 500,
    lastBrewedAt: null,
  },
];

export const STATUS_LABELS: Record<DemoBatch["status"], string> = {
  mashing:      "Mashing",
  boiling:      "Boiling",
  fermenting:   "Fermenting",
  conditioning: "Conditioning",
  packaged:     "Packaged",
};

export const STATUS_VARIANTS: Record<DemoBatch["status"], "info" | "warning" | "success" | "neutral" | "danger"> = {
  mashing:      "warning",
  boiling:      "warning",
  fermenting:   "info",
  conditioning: "info",
  packaged:     "success",
};
