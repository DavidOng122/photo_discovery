import { AIProvider, AnalyzeWalkInput, GenerateRecommendationsInput } from "../provider";
import { AnalyzeWalkOutput, RecommendationOutput } from "../schemas";

export class MockProvider implements AIProvider {
  readonly name = "mock";

  async analyzeWalk(_input: AnalyzeWalkInput): Promise<AnalyzeWalkOutput> {
    return {
      title: 'Mock Walk',
      tags: [
        { label: 'コーヒー文化の匂い', category: 'Culture', reason: 'Distinct coffee culture visible' },
        { label: '昭和レトロの路地', type: 'style', reason: 'Showa-era alley aesthetic' },
      ],
      observations: [{ id: 'obs1', description: 'desc', type: 'style', matchedFeatures: ['f1'] }],
      discoveries: [{ lens: 'culture', phrase: 'Mock Phrase', explanation: 'exp', observationIds: ['obs1'] }]
    };
  }

  async generateRecommendations(_input: GenerateRecommendationsInput): Promise<RecommendationOutput> {
    return {
      places: [
        { name: 'Mock Place 1', type: 'place', area: 'Tokyo', reason: 'Great place with unique culture and atmosphere worth visiting', googleMapsQuery: 'Mock 1 Tokyo', matchedFeatures: ['f1'] },
        { name: 'Mock Place 2', type: 'place', area: 'Tokyo', reason: 'Amazing spot with deep local history and rich cultural heritage', googleMapsQuery: 'Mock 2 Tokyo', matchedFeatures: ['f2'] },
        { name: 'Mock Place 3', type: 'place', area: 'Tokyo', reason: 'Wonderful location that perfectly captures the spirit of the area', googleMapsQuery: 'Mock 3 Tokyo', matchedFeatures: ['f3'] },
      ]
    };
  }
}
