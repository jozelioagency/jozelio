export interface ServiceDetail {
  id: string;
  title: string;
  icon: string;
  shortDesc: string;
  longDesc: string;
  features: string[];
  deliverable: string;
}

export interface ShowcaseProject {
  id: string;
  clientName: string;
  category: "Social Management" | "Web Development" | "Unified Growth";
  description: string;
  colorTheme: string;
  results: string[];
  mockFeedImage?: string;
}
