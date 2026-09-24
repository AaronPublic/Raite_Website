export interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
  description?: string;
}

export interface CompetitionRubric {
  title: string;
  socialMediaLabel: string;
  socialMediaMax: number;
  criteria: RubricCriterion[];
  judgeMaxTotal: number;
  grandTotal: number;
}

export const COMPETITION_RUBRICS: Record<string, CompetitionRubric> = {
  "Lanyard Layout Design": {
    title: "Lanyard Layout Design",
    socialMediaLabel: "Facebook Like & Reaction",
    socialMediaMax: 5,
    judgeMaxTotal: 95,
    grandTotal: 100,
    criteria: [
      {
        id: "concept_relevance",
        name: "Concept / Relevance",
        maxScore: 35,
        description: "Relevance of the design to the theme, clarity of concept, and adherence to requirements.",
      },
      {
        id: "originality",
        name: "Originality",
        maxScore: 30,
        description: "Uniqueness and freshness of the artwork, layout concept, and visual identity.",
      },
      {
        id: "creativity_impact",
        name: "Creativity and Impact",
        maxScore: 30,
        description: "Aesthetic appeal, visual harmony, typography, and memorable presentation impact.",
      },
    ],
  },
  "Micro Short Film": {
    title: "Micro Short Film",
    socialMediaLabel: "YouTube Likes",
    socialMediaMax: 5,
    judgeMaxTotal: 95,
    grandTotal: 100,
    criteria: [
      {
        id: "creativity_originality",
        name: "Creativity and Originality",
        maxScore: 25,
        description: "Innovative concept, fresh perspective, and creative execution.",
      },
      {
        id: "storytelling",
        name: "Storytelling",
        maxScore: 25,
        description: "Narrative structure, emotional resonance, pacing, and message delivery.",
      },
      {
        id: "visual_audio_quality",
        name: "Visual and Audio Quality",
        maxScore: 25,
        description: "Cinematography, lighting, color grading, sound design, and audio clarity.",
      },
      {
        id: "technical_execution",
        name: "Technical Execution",
        maxScore: 20,
        description: "Seamless editing, continuity, transitions, visual effects, and overall production quality.",
      },
    ],
  },
  "TechTok Challenge: CTRL+ NEXT Edition": {
    title: "TechTok Challenge: CTRL+ NEXT Edition",
    socialMediaLabel: "TikTok Reactions",
    socialMediaMax: 5,
    judgeMaxTotal: 95,
    grandTotal: 100,
    criteria: [
      {
        id: "relevance_theme",
        name: "Relevance to Theme",
        maxScore: 20,
        description: "Direct alignment with the CTRL+ NEXT theme and educational IT messaging.",
      },
      {
        id: "creativity_originality",
        name: "Creativity and Originality",
        maxScore: 25,
        description: "Unique angle, engaging hook, humor/entertainment value, and creative delivery.",
      },
      {
        id: "visual_impact_aesthetics",
        name: "Visual Impact and Aesthetics",
        maxScore: 25,
        description: "Visual appeal, dynamic camera work, screen presence, and visual styling.",
      },
      {
        id: "content_accuracy_organization",
        name: "Content Accuracy and Organization",
        maxScore: 15,
        description: "Factual accuracy of information presented and logical flow within the time limit.",
      },
      {
        id: "technical_execution_design",
        name: "Technical Execution and Design Quality",
        maxScore: 10,
        description: "Audio-video synchronization, captioning, transitions, and editing polish.",
      },
    ],
  },
  "Infographics Design Competition": {
    title: "Infographics Design Competition",
    socialMediaLabel: "Facebook Like & Reaction",
    socialMediaMax: 5,
    judgeMaxTotal: 95,
    grandTotal: 100,
    criteria: [
      {
        id: "relevance_theme",
        name: "Relevance to Theme",
        maxScore: 25,
        description: "Depth of theme understanding and targeted context delivery.",
      },
      {
        id: "creativity_originality",
        name: "Creativity and Originality",
        maxScore: 25,
        description: "Original infographic layout, distinctive visual illustrations, and creative data visualization.",
      },
      {
        id: "visual_impact_aesthetics",
        name: "Visual Impact and Aesthetics",
        maxScore: 20,
        description: "Color palette harmony, balance, typography hierarchy, and visual appeal.",
      },
      {
        id: "content_accuracy_organization",
        name: "Content Accuracy and Organization",
        maxScore: 15,
        description: "Clarity of data presentation, logical reading flow, and verifiable facts.",
      },
      {
        id: "technical_execution_design",
        name: "Technical Execution and Design Quality",
        maxScore: 10,
        description: "Resolution, layout precision, vector cleanlines, and print/digital readiness.",
      },
    ],
  },
};

/**
 * Returns the matching rubric for an event title (handles minor casing and whitespace variations)
 */
export function getRubricForEvent(eventTitle: string): CompetitionRubric | null {
  if (!eventTitle) return null;
  const cleanTitle = eventTitle.trim().toLowerCase();

  for (const [key, rubric] of Object.entries(COMPETITION_RUBRICS)) {
    if (key.toLowerCase() === cleanTitle) return rubric;
    if (cleanTitle.includes("lanyard") && key.includes("Lanyard")) return rubric;
    if (cleanTitle.includes("short film") && key.includes("Short Film")) return rubric;
    if (cleanTitle.includes("techtok") && key.includes("TechTok")) return rubric;
    if (cleanTitle.includes("infographic") && key.includes("Infographics")) return rubric;
  }

  return null;
}

/**
 * Calculates sum of valid scores given for a criterion map
 */
export function sumCriteriaScores(scores: Record<string, number | undefined>): number {
  let sum = 0;
  for (const val of Object.values(scores)) {
    if (typeof val === "number" && !isNaN(val) && val >= 0) {
      sum += val;
    }
  }
  return Number(sum.toFixed(2));
}

export interface ScoredRegistrationRow {
  registrationId: string;
  schoolName: string;
  teamOrCompetitor: string;
  entryUrl: string | null;
  socialMediaScore: number;
  judgeScores: {
    judgeId: string;
    judgeName: string;
    totalScore: number;
    criteriaScores: Record<string, number>;
    feedback?: string | null;
  }[];
  averageJudgeScore: number;
  finalScore: number;
  judgesCount: number;
  rank?: number;
}

/**
 * Computes live rankings for a list of registrations in a competition
 */
export function computeRankings(rows: ScoredRegistrationRow[]): ScoredRegistrationRow[] {
  // Sort descending by finalScore, then by averageJudgeScore, then by schoolName
  const sorted = [...rows].sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    if (b.averageJudgeScore !== a.averageJudgeScore) {
      return b.averageJudgeScore - a.averageJudgeScore;
    }
    return a.schoolName.localeCompare(b.schoolName);
  });

  // Assign ranks with tie handling
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].finalScore === sorted[i - 1].finalScore) {
      sorted[i].rank = sorted[i - 1].rank;
    } else {
      sorted[i].rank = currentRank;
    }
    currentRank++;
  }

  return sorted;
}
