import { describe, it, expect } from 'vitest';
import { translateDistressMessage, detectNonEnglishScript } from '../src/services/translationService';
import request from 'supertest';
import { app } from '../src/app';

describe('Multilingual Translation Service & Responder Integration', () => {
  it('detects Indic and non-Latin scripts accurately', () => {
    expect(detectNonEnglishScript('हम बाढ़ में फंसे हैं').isNonLatin).toBe(true);
    expect(detectNonEnglishScript('आम्ही पुरात अडकलो आहोत').isNonLatin).toBe(true);
    expect(detectNonEnglishScript('আমরা জলে আটকে আছি').isNonLatin).toBe(true);
    expect(detectNonEnglishScript('We are trapped in flood').isNonLatin).toBe(false);
  });

  it('keeps English messages untouched without translation overhead', async () => {
    const text = 'Water is rising rapidly on the second floor, send emergency boats immediately.';
    const result = await translateDistressMessage(text);
    expect(result.isTranslated).toBe(false);
    expect(result.detectedLanguage).toBe('English');
    expect(result.translatedDescription).toBe(text);
  });

  it('accurately translates Hindi distress message into English', async () => {
    const hindiMsg = 'हम 4 लोग बाढ़ के पानी में छत पर फंसे हैं, कृपया जल्दी नाव भेजो';
    const result = await translateDistressMessage(hindiMsg);
    expect(result.isTranslated).toBe(true);
    expect(result.detectedLanguage.toLowerCase()).toContain('hindi');
    expect(result.translatedDescription.toLowerCase()).toMatch(/4|people|flood|roof|boat|help/);
  });

  it('accurately translates Marathi distress message into English', async () => {
    const marathiMsg = 'आम्ही ५ जण पुराच्या पाण्यात अडकलो आहोत, ताबडतोब बोट पाठवा';
    const result = await translateDistressMessage(marathiMsg);
    expect(result.isTranslated).toBe(true);
    expect(result.detectedLanguage.toLowerCase()).toMatch(/marathi|hindi|devanagari/);
    expect(result.translatedDescription.toLowerCase()).toMatch(/5|flood|water|boat|stuck|trapped/);
  });

  it('accurately translates Spanish distress message into English', async () => {
    const spanishMsg = 'El agua está subiendo rápidamente, hay dos personas heridas y necesitamos comida y medicina';
    const result = await translateDistressMessage(spanishMsg);
    expect(result.isTranslated).toBe(true);
    expect(result.detectedLanguage.toLowerCase()).toContain('spanish');
    expect(result.translatedDescription.toLowerCase()).toMatch(/water|rising|injured|food|medicine/);
  });

  it('end-to-end: POST /api/incidents converts multilingual survivor input into English for responders', async () => {
    const rawHindiSOS = 'घर में आग लग गई है, 3 लोग अंदर फंसे हैं और धुएं से सांस नहीं आ रही है';

    const response = await request(app)
      .post('/api/incidents')
      .send({
        category: 'fire',
        description: rawHindiSOS,
        peopleAffected: 3,
        urgentNeeds: ['medical', 'evacuation'],
        location: { lat: 19.076, lng: 72.8777, label: 'Mumbai Fire Zone' },
      });

    expect(response.status).toBe(201);
    const incident = response.body;

    // Verify raw input is preserved
    expect(incident.description).toBe(rawHindiSOS);

    // Verify accurate English translation is populated on both incident and triage
    expect(incident.translatedDescription).toBeDefined();
    expect(typeof incident.translatedDescription).toBe('string');
    expect(incident.translatedDescription.toLowerCase()).toMatch(/fire|house|people|smoke|trapped|breathe/);
    expect(incident.detectedLanguage.toLowerCase()).toContain('hindi');

    expect(incident.triage).toBeDefined();
    expect(incident.triage.translatedDescription).toBe(incident.translatedDescription);

    // Verify GET /api/incidents/:id returns the translated description
    const getRes = await request(app).get(`/api/incidents/${incident.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.translatedDescription).toBe(incident.translatedDescription);
  });
});
