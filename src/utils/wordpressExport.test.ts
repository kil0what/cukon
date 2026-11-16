import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CMS_STATE } from '../shared/defaultData';
import { buildWordPressThemeFiles, buildWordPressWxrXml } from './wordpressExport';

test('buildWordPressThemeFiles generates complete linked WP theme with single-screen room manager', () => {
  const files = buildWordPressThemeFiles({
    ...DEFAULT_CMS_STATE,
    settings: {
      ...DEFAULT_CMS_STATE.settings,
      analytics: {
        ...DEFAULT_CMS_STATE.settings.analytics,
        yandexMetrikaId: '98765432',
      },
    },
  });

  const fn = files['tsukon-theme/functions.php'];
  assert.ok(files['tsukon-theme/style.css'].includes('Theme Name: ЦУКОН'));
  assert.ok(fn.includes("register_post_type('tsukon_room'"));
  assert.ok(fn.includes('tsukon_render_rooms_manager_page'));
  assert.ok(fn.includes('tsukon_link_imported_relations'));
  assert.ok(fn.includes('tsukon_ensure_pages'));
  assert.ok(fn.includes('_tsukon_object_id'));
  assert.ok(fn.includes('98765432'));
  assert.ok(fn.includes('zukonar@mail.ru'));

  // Ensure no accidental JS template interpolation leaked into PHP
  assert.ok(!fn.includes('undefined'));
  assert.ok(files['tsukon-theme/front-page.php'].includes('tsukon_query_featured_free_rooms'));
  assert.ok(files['tsukon-theme/page-objects.php'].includes('tsukon_query_rooms'));
  assert.ok(files['tsukon-theme/page-tenants.php'].includes('template-parts-room-card.php'));
  assert.ok(files['tsukon-theme/page-guide.php'].includes('tsukon_get_room_data'));
  assert.ok(files['tsukon-theme/page-faq.php'].includes('tsukon_faq'));
  assert.ok(files['tsukon-theme/page-residents.php'].includes('tsukon_resident'));
  assert.ok(files['tsukon-theme/page-owners.php'].includes("tsukon_render_lead_form('owner')"));
  assert.ok(files['tsukon-theme/page-contacts.php'].includes('1327024467'));
});

test('buildWordPressWxrXml exports linked objects, rooms, residents, FAQs, and pages as WXR 1.2', () => {
  const xml = buildWordPressWxrXml(DEFAULT_CMS_STATE);
  assert.ok(xml.includes('<wp:wxr_version>1.2</wp:wxr_version>'));
  assert.ok(xml.includes('<wp:post_type>tsukon_object</wp:post_type>'));
  assert.ok(xml.includes('<wp:post_type>tsukon_room</wp:post_type>'));
  assert.ok(xml.includes('<wp:post_type>tsukon_faq</wp:post_type>'));
  assert.ok(xml.includes('<wp:post_type>tsukon_resident</wp:post_type>'));
  assert.ok(xml.includes('<wp:post_type>page</wp:post_type>'));
  assert.ok(xml.includes('<wp:meta_key>_tsukon_object_source_id</wp:meta_key>'));
  assert.ok(xml.includes('<wp:meta_key>_tsukon_object_id</wp:meta_key>'));
  assert.ok(xml.includes('assets/images/production_workshop.jpg'));
  assert.ok(xml.includes('<wp:post_name>objects</wp:post_name>'));
  assert.ok(xml.includes('<wp:post_name>guide-production</wp:post_name>'));
  assert.ok(xml.includes('Где снять недорогое производственное помещение в Саранске?'));
});
