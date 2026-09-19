import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES, getLanguageMeta } from '../src/i18n/languages';
import { TRANSLATIONS, getTranslation } from '../src/i18n/translations';
import { SupportedLanguage } from '../src/i18n/types';

describe('RescueLink Multilingual i18n Subsystem', () => {
  it('should support exactly 20 disaster survival languages', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(20);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    
    // 8 Indian regional languages
    expect(codes).toContain('hi'); // Hindi
    expect(codes).toContain('mr'); // Marathi
    expect(codes).toContain('bn'); // Bengali
    expect(codes).toContain('te'); // Telugu
    expect(codes).toContain('ta'); // Tamil
    expect(codes).toContain('gu'); // Gujarati
    expect(codes).toContain('kn'); // Kannada
    expect(codes).toContain('pa'); // Punjabi

    // 12 Major Global languages (including Nepali, Indonesian, Turkish)
    expect(codes).toContain('en'); // English
    expect(codes).toContain('es'); // Spanish
    expect(codes).toContain('fr'); // French
    expect(codes).toContain('ar'); // Arabic
    expect(codes).toContain('pt'); // Portuguese
    expect(codes).toContain('ru'); // Russian
    expect(codes).toContain('zh'); // Chinese Simplified
    expect(codes).toContain('ja'); // Japanese
    expect(codes).toContain('de'); // German
    expect(codes).toContain('ne'); // Nepali
    expect(codes).toContain('id'); // Indonesian
    expect(codes).toContain('tr'); // Turkish
  });

  it('should configure Arabic with RTL direction and arabic script', () => {
    const arMeta = getLanguageMeta('ar');
    expect(arMeta.dir).toBe('rtl');
    expect(arMeta.script).toBe('arabic');
    expect(arMeta.region).toBe('global');
  });

  it('should configure all Indic languages with indic script to prevent letter distortion', () => {
    const indianCodes: SupportedLanguage[] = ['hi', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'pa'];
    for (const code of indianCodes) {
      const meta = getLanguageMeta(code);
      expect(meta.script).toBe('indic');
      expect(meta.dir).toBe('ltr');
      expect(meta.region).toBe('indian');
      expect(meta.nativeLabel.length).toBeGreaterThan(0);
    }

    // Nepali uses Devanagari (Indic script)
    const neMeta = getLanguageMeta('ne');
    expect(neMeta.script).toBe('indic');
    expect(neMeta.dir).toBe('ltr');
  });

  it('should provide full complete dictionaries with non-empty strings for all 20 languages', () => {
    const expectedSections = ['brand', 'connectivity', 'categories', 'urgentNeeds', 'form', 'status', 'languages'] as const;

    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      expect(dict).toBeDefined();

      for (const section of expectedSections) {
        expect(dict[section]).toBeDefined();
        const keys = Object.keys(dict[section]) as Array<keyof typeof dict[typeof section]>;
        expect(keys.length).toBeGreaterThan(0);

        for (const key of keys) {
          const val = (dict[section] as Record<string, string>)[key as string];
          expect(typeof val).toBe('string');
          expect(val.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should verify Hindi and Marathi specific safety and SOS terminology', () => {
    const hi = getTranslation('hi');
    const mr = getTranslation('mr');

    // Hindi validation
    expect(hi.form.transmitSos).toContain('एसओएस');
    expect(hi.categories.flood).toContain('बाढ़');
    expect(hi.urgentNeeds.medical).toContain('चिकित्सा');

    // Marathi validation
    expect(mr.form.transmitSos).toContain('एसओएस');
    expect(mr.categories.flood).toContain('पूर');
    expect(mr.urgentNeeds.medical).toContain('वैद्यकीय');
  });

  it('should gracefully fallback to English when given an unknown language code', () => {
    // @ts-expect-error Testing invalid language fallback
    const fallback = getTranslation('xx_UNKNOWN');
    expect(fallback).toBeDefined();
    expect(fallback.brand.title).toBe('RESCUELINK');
    expect(fallback.categories.flood).toContain('Flood');
  });
});
