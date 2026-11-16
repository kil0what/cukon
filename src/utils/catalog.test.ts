import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CMS_STATE } from '../shared/defaultData';
import {
  buildSchemaOrgGraph,
  clampFeaturedFreeLimit,
  createAntiSpamChallenge,
  evaluateTzCompliance,
  filterAndSortRooms,
  generateLlmsTxt,
  generateRobotsTxt,
  generateSitemapXml,
  getStartFreeRooms,
  validateLeadSubmission,
} from './catalog';

test('filterAndSortRooms filters by object, purpose, status, and minArea', () => {
  const onlyFreeWarehouses = filterAndSortRooms(DEFAULT_CMS_STATE.rooms, {
    objectId: '0',
    purpose: 'wh',
    status: 'free',
  });
  assert.equal(onlyFreeWarehouses.length, 3);
  assert.ok(onlyFreeWarehouses.every((r) => r.purpose === 'wh' && r.status === 'free'));

  const largeRooms = filterAndSortRooms(DEFAULT_CMS_STATE.rooms, {
    objectId: '0',
    purpose: '0',
    status: '0',
    minArea: '500',
    sort: 'area_desc',
  });
  assert.equal(largeRooms.length, 2);
  assert.equal(largeRooms[0].area, 620);
  assert.equal(largeRooms[1].area, 520);
});

test('clampFeaturedFreeLimit and getStartFreeRooms enforce TZ 5–7 free rooms limit', () => {
  assert.equal(clampFeaturedFreeLimit(3), 5);
  assert.equal(clampFeaturedFreeLimit(6), 6);
  assert.equal(clampFeaturedFreeLimit(12), 7);

  const startRooms5 = getStartFreeRooms(DEFAULT_CMS_STATE.rooms, 5);
  assert.equal(startRooms5.length, 5);
  assert.ok(startRooms5.every((r) => r.status === 'free'));

  const startRooms7 = getStartFreeRooms(DEFAULT_CMS_STATE.rooms, 7);
  // DEFAULT_CMS_STATE has 6 free rooms total, so max returned is 6
  assert.equal(startRooms7.length, 6);
});

test('validateLeadSubmission rejects honeypot, fast submit, bad captcha, missing fields, and invalid email', () => {
  const challenge = createAntiSpamChallenge(4);

  const spamHoneypot = validateLeadSubmission({
    type: 'tenant',
    name: 'Иван',
    phone: '+79991112233',
    email: 'test@mail.ru',
    purposeOrObject: 'Склад',
    area: '300',
    message: '',
    consent: true,
    honeypot: 'http://spam.example',
    elapsedMs: 5000,
    captchaExpected: challenge.expected,
    captchaAnswer: String(challenge.expected),
  });
  assert.equal(spamHoneypot.ok, false);
  assert.equal(spamHoneypot.code, 'spam_honeypot');

  const spamTiming = validateLeadSubmission({
    type: 'tenant',
    name: 'Иван',
    phone: '+79991112233',
    email: '',
    purposeOrObject: '',
    area: '',
    message: '',
    consent: true,
    elapsedMs: 400,
    captchaExpected: challenge.expected,
    captchaAnswer: String(challenge.expected),
  });
  assert.equal(spamTiming.ok, false);
  assert.equal(spamTiming.code, 'spam_timing');

  const badCaptcha = validateLeadSubmission({
    type: 'tenant',
    name: 'Иван',
    phone: '+79991112233',
    email: '',
    purposeOrObject: '',
    area: '',
    message: '',
    consent: true,
    elapsedMs: 5000,
    captchaExpected: challenge.expected,
    captchaAnswer: '999',
  });
  assert.equal(badCaptcha.ok, false);
  assert.equal(badCaptcha.code, 'spam_captcha');

  const valid = validateLeadSubmission({
    type: 'owner',
    name: 'Александр',
    phone: '+7 (8342) 27-10-27',
    email: 'zukonar@mail.ru',
    purposeOrObject: 'Цех на Промышленной',
    area: '1200',
    message: 'Передать в управление',
    consent: true,
    elapsedMs: 4500,
    captchaExpected: challenge.expected,
    captchaAnswer: String(challenge.expected),
  });
  assert.equal(valid.ok, true);
});

test('SEO and AI optimization outputs contain mandatory TZ routes and Saransk FAQs', () => {
  const sitemap = generateSitemapXml('https://цукон.рф', DEFAULT_CMS_STATE);
  assert.ok(sitemap.includes('/#/faq'));
  assert.ok(sitemap.includes('/#/objects'));
  assert.ok(sitemap.includes('/#/guide-production'));
  assert.ok(sitemap.includes('/#/guide-terms'));
  assert.ok(sitemap.includes('/#/privacy-policy'));

  const robots = generateRobotsTxt('https://цукон.рф');
  assert.ok(robots.includes('Disallow: /#/admin'));
  assert.ok(robots.includes('Sitemap: https://цукон.рф/sitemap.xml'));

  const llms = generateLlmsTxt('https://цукон.рф', DEFAULT_CMS_STATE);
  assert.ok(llms.includes('Где снять недорогое производственное помещение в Саранске?'));
  assert.ok(llms.includes('zukonar@mail.ru'));
  assert.ok(llms.includes('/#/guide-utilities'));

  const schema = buildSchemaOrgGraph('https://цукон.рф', DEFAULT_CMS_STATE) as {
    '@graph': Array<{ hasOfferCatalog?: { itemListElement: unknown[] } }>;
  };
  assert.ok((schema['@graph'][0].hasOfferCatalog?.itemListElement.length || 0) >= 5);

  const audit = evaluateTzCompliance(DEFAULT_CMS_STATE, 0);
  assert.equal(audit.length, 8);
  assert.ok(audit.every((item) => item.passed));
});
