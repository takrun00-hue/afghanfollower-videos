import { config } from './config.ts';

// Planning only. This does not claim generated imagery is photographic evidence.
export function buildSmartPrompt(topic) {
  if (typeof topic !== 'string' || !topic.trim()) throw new Error('A non-empty topic is required');
  const key = topic.normalize('NFC').trim();
  const own = (map, fallback) => Object.hasOwn(map, key) ? map[key] : fallback;
  return [key, own(config.germanCulture, config.visualPrompt.defaultContext),
    own(config.emotionMap, config.visualPrompt.defaultEmotion),
    config.visualPrompt.quality, `palette ${config.designSystem.palette.join(', ')}`,
    `--no ${config.visualPrompt.negative}`].join(', ');
}
