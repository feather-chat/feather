import { describe, it, expect } from 'vitest';
import { searchEmojis, COMMON_EMOJIS } from './emoji';

describe('searchEmojis', () => {
  it('returns common emojis for empty query', () => {
    const results = searchEmojis('');
    expect(results.length).toBeGreaterThan(0);
    // Should return common emojis
    expect(results.map((r) => r.emoji)).toEqual(
      expect.arrayContaining([COMMON_EMOJIS[0]])
    );
  });

  it('exact match scores highest', () => {
    const results = searchEmojis('fire');
    expect(results[0].shortcode).toBe('fire');
    expect(results[0].emoji).toBe('🔥');
  });

  it('prefix match scores second', () => {
    const results = searchEmojis('th');
    // Should find thumbsup before anything with 'th' in the middle
    const thumbsIndex = results.findIndex((r) => r.shortcode === 'thumbsup');
    const thumbsdownIndex = results.findIndex((r) => r.shortcode === 'thumbsdown');
    // Both should be near the top
    expect(thumbsIndex).toBeLessThan(5);
    expect(thumbsdownIndex).toBeLessThan(5);
  });

  it('substring match scores lowest', () => {
    const results = searchEmojis('ear');
    // 'ear' exact match should be first if it exists, or prefix matches
    // Substring matches (e.g., 'bear', 'pear') should come after
    const earIndex = results.findIndex((r) => r.shortcode === 'ear');
    const bearIndex = results.findIndex((r) => r.shortcode === 'bear');
    if (earIndex !== -1 && bearIndex !== -1) {
      expect(earIndex).toBeLessThan(bearIndex);
    }
  });

  it('respects limit parameter', () => {
    const results = searchEmojis('a', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('returns empty array for no matches', () => {
    const results = searchEmojis('xyznonexistent');
    expect(results).toEqual([]);
  });

  it('is case insensitive', () => {
    const lowerResults = searchEmojis('fire');
    const upperResults = searchEmojis('FIRE');
    expect(lowerResults).toEqual(upperResults);
  });
});
