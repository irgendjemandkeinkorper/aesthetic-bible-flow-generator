import type { GenerationPromptInput } from '../../types';

export function buildAestheticBiblePrompt(brief: GenerationPromptInput): string {
  const gameDirection = [
    brief.gamePerspective && `perspective: ${brief.gamePerspective}`,
    brief.mechanicsArchetype && `mechanics archetype: ${brief.mechanicsArchetype}`,
  ].filter(Boolean).join('; ') || 'not specified; infer from the wider brief';

  const artDirection = [
    brief.renderingStyle && `rendering style: ${brief.renderingStyle}`,
    brief.artisticInfluences?.length && `artistic influences: ${brief.artisticInfluences.join(', ')}`,
  ].filter(Boolean).join('; ') || 'not specified; derive a coherent original direction';

  const auditoryDirection = [
    brief.musicTempo && `tempo: ${brief.musicTempo}`,
    brief.musicTexture && `texture: ${brief.musicTexture}`,
    brief.musicInstrumentation?.length && `instrumentation: ${brief.musicInstrumentation.join(', ')}`,
    brief.ambientMood && `ambient mood: ${brief.ambientMood}`,
  ].filter(Boolean).join('; ') || 'not specified; derive it from the visual and emotional direction';

  return `You are a lead art director and speculative worldbuilder. Generate a complete aesthetic bible as JSON.
Creative brief: ${JSON.stringify(brief)}
Game direction: ${gameDirection}. Make dominant geometry, silhouettes, scale, camera readability, and interface decisions practical for this perspective and mechanics archetype.
Art direction: ${artDirection}. Weave these references into the manifesto, visual philosophy, shape language, materials, and texture guidance while keeping the result original and cohesive.
Auditory direction: ${auditoryDirection}. Populate musicDirection with a concrete coreThemeSpec, an instrumentation list, and a production-ready generativePromptSpec suitable for Suno or Udio.
Use stable unique string IDs, ISO date strings, valid six-digit hex colors, distinct typography roles, concrete do/don't lists, and 4-6 detailed mood-board tiles.`;
}
