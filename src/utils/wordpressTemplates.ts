import type { CmsState } from '../shared/types';
import { ASSET_IMAGES } from '../shared/defaultData';

export function mapAssetToWpRelative(url: string): string {
  if (!url) return 'assets/images/industrial_park_exterior.jpg';
  if (url === ASSET_IMAGES.workshop || url.includes('production_workshop')) {
    return 'assets/images/production_workshop.jpg';
  }
  if (url === ASSET_IMAGES.warehouse || url.includes('logistics_warehouse')) {
    return 'assets/images/logistics_warehouse.jpg';
  }
  if (url === ASSET_IMAGES.office || url.includes('business_center_office')) {
    return 'assets/images/business_center_office.jpg';
  }
  if (url === ASSET_IMAGES.exterior || url.includes('industrial_park_exterior')) {
    return 'assets/images/industrial_park_exterior.jpg';
  }
  return url;
}

export function buildWordPressTemplates(state: CmsState): Record<string, string> {
  const freeLimit = Math.min(7, Math.max(5, state.settings.featuredFreeLimit || 6));
  const recipient = state.settings.contacts.leadRecipientEmail || state.settings.contacts.email;

  const styleCss = `/*
Theme Name: ЦУКОН — Концепция № 3
Theme URI: https://цукон.рф
Author: Агафонова В.Е.
Description: Тема WordPress для ООО «ЦУКОН» (производственно-коммерческая недвижимость в Саранске). Единая база Объектов, Помещений (со связью по ID объекта), Резидентов и FAQ с автоматическим обновлением всех страниц, формами заявок, антиспамом, Яндекс.Метрикой, llms.txt и Schema.org.
Version: 2.0.0
Text Domain: tsukon
*/

:root{--bg:#f1f2f3;--card:#fff;--ink:#15171a;--mute:#5d636b;--line:#d3d6d9;--acc:#2447ff;--dark:#111316;--ok:#14803f;--wait:#a35f00;--off:#7b8088;--dsp:Unbounded,"Arial Black",system-ui,sans-serif}
*{box-sizing:border-box;margin:0}
html{overflow-x:clip}
body{background:var(--bg);color:var(--ink);font:400 16px/1.6 Onest,system-ui,sans-serif;overflow-x:clip;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.w{max-width:1200px;margin:0 auto;padding:0 24px}
section{padding:64px 0}
h1,h2,h3,.dsp{font-family:var(--dsp);font-weight:500;letter-spacing:-.025em;line-height:1.12}
h1{font-size:clamp(24px,5.2vw,68px)}
h2{font-size:clamp(22px,3vw,38px)}
h3{font-size:18px;font-weight:600}
.mute{color:var(--mute)}
.tabular{font-variant-numeric:tabular-nums}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 24px;border-radius:99px;background:var(--ink);color:var(--bg);font:500 14px Onest,sans-serif;border:0;cursor:pointer;transition:background .2s,color .2s}
.btn:hover{background:var(--acc);color:#fff}
.btn.l{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}
.btn.l:hover{background:var(--ink);color:var(--bg)}
header.site-hdr{position:sticky;top:0;z-index:20;background:rgba(241,242,243,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;gap:18px;height:68px}
.logo{display:flex;align-items:center;gap:10px;font:600 18px var(--dsp);white-space:nowrap}
.logo i{width:26px;height:26px;background:var(--ink);color:var(--bg);display:grid;place-items:center;font-style:normal;font-size:14px}
.menu{display:flex;gap:14px;margin-left:auto;list-style:none;padding:0}
.menu a{font-size:14px;color:var(--mute);white-space:nowrap}
.menu a:hover,.menu a.active{color:var(--ink);font-weight:500}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:16px;margin-top:24px}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:16px;margin-top:24px}
.card{background:var(--card);border-radius:20px;padding:16px;border:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
.card img{width:100%;height:185px;object-fit:cover;border-radius:12px;margin-bottom:4px;background:#e5e7eb}
.tag{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600}
.tag.free{color:var(--ok)}.tag.booked{color:var(--wait)}.tag.rented{color:var(--off)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.chip{font-size:12px;padding:4px 10px;border-radius:99px;background:var(--bg);border:1px solid var(--line);color:var(--mute)}
.fbox{background:var(--card);border-radius:24px;padding:32px;border:1px solid var(--line);margin-top:32px}
.f{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:18px;margin-top:20px}
.f input,.f select,.f textarea{width:100%;padding:10px 0;border:0;border-bottom:1px solid var(--ink);background:transparent;font:inherit;color:var(--ink)}
.f .full{grid-column:1/-1}
.hp{position:absolute;left:-9999px}
.filters{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;padding:18px;background:var(--card);border:1px solid var(--line);border-radius:20px}
.filters select,.filters input{padding:10px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);font:inherit}
.table-wrap{background:var(--card);border:1px solid var(--line);border-radius:20px;overflow-x:auto;margin-top:24px}
table.tsukon-tbl{width:100%;border-collapse:collapse;font-size:14px;text-align:left}
table.tsukon-tbl th,table.tsukon-tbl td{padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:top}
table.tsukon-tbl th{font-size:12px;color:var(--mute);font-weight:500}
footer.site-ftr{background:var(--dark);color:#f1f2f3;border-radius:24px 24px 0 0;padding:48px 0 24px;margin-top:56px}
.notice-ok{margin-top:12px;padding:12px 16px;border-radius:12px;background:#e8f6ee;color:#14803f;font-size:14px}
.notice-err{margin-top:12px;padding:12px 16px;border-radius:12px;background:#fdecec;color:#b42318;font-size:14px}
@media(max-width:1040px){.menu{display:none}}
`;

  const headerPhp = `<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<header class="site-hdr">
  <div class="w nav">
    <a class="logo" href="<?php echo esc_url(home_url('/')); ?>"><i>Ц</i>ЦУКОН</a>
    <nav class="menu">
      <a href="<?php echo esc_url(home_url('/')); ?>">Главная</a>
      <a href="<?php echo esc_url(home_url('/objects/')); ?>">Объекты</a>
      <a href="<?php echo esc_url(home_url('/tenants/')); ?>">Арендаторам</a>
      <a href="<?php echo esc_url(home_url('/owners/')); ?>">Собственникам</a>
      <a href="<?php echo esc_url(home_url('/residents/')); ?>">Резиденты</a>
      <a href="<?php echo esc_url(home_url('/about/')); ?>">О компании</a>
      <a href="<?php echo esc_url(home_url('/faq/')); ?>">FAQ</a>
      <a href="<?php echo esc_url(home_url('/contacts/')); ?>">Контакты</a>
    </nav>
    <a class="btn" href="<?php echo esc_url(home_url('/tenants/#lead-form')); ?>">Подобрать</a>
  </div>
</header>
<main>
`;

  const footerPhp = `</main>
<footer class="site-ftr">
  <div class="w">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:24px">
      <div>
        <strong>${state.settings.contacts.companyName}</strong>
        <p style="opacity:.75;font-size:14px;margin-top:6px">${state.settings.contacts.legalAddress}</p>
        <p style="opacity:.6;font-size:13px;margin-top:4px">ИНН ${state.settings.contacts.inn} · КПП ${state.settings.contacts.kpp} · ОГРН ${state.settings.contacts.ogrn}</p>
      </div>
      <div style="font-size:14px">
        <div><a href="${state.settings.contacts.phoneHref}">${state.settings.contacts.phoneDisplay}</a></div>
        <div style="margin-top:4px"><a href="mailto:${state.settings.contacts.email}">${state.settings.contacts.email}</a></div>
        <div style="margin-top:10px;display:flex;gap:12px;flex-wrap:wrap;font-size:12px;opacity:.75">
          <a href="<?php echo esc_url(home_url('/guide-production/')); ?>">Производство</a>
          <a href="<?php echo esc_url(home_url('/guide-warehouses/')); ?>">Склады и фуры</a>
          <a href="<?php echo esc_url(home_url('/guide-utilities/')); ?>">Коммуникации</a>
          <a href="<?php echo esc_url(home_url('/guide-terms/')); ?>">Площади и цены</a>
          <a href="<?php echo esc_url(home_url('/privacy-policy/')); ?>">Политика обработки персональных данных</a>
        </div>
      </div>
    </div>
    <p style="margin-top:24px;font-size:13px;opacity:.6">© <?php echo date('Y'); ?> ${state.settings.contacts.companyName}</p>
  </div>
</footer>
<div id="tsukon-cookie-banner" style="display:none;position:fixed;bottom:16px;right:16px;left:16px;max-width:500px;margin-left:auto;z-index:99;background:#111316;color:#f1f2f3;border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:18px;box-shadow:0 20px 45px rgba(0,0,0,.35);font-size:13.5px;line-height:1.5">
  <p style="margin:0 0 12px">Мы используем файлы <strong>cookie</strong> и Яндекс.Метрику для корректной работы сайта. Продолжая использовать сайт, вы соглашаетесь с <a href="<?php echo esc_url(home_url('/privacy-policy/')); ?>" style="text-decoration:underline;color:#fff">Политикой обработки персональных данных</a>.</p>
  <button type="button" id="tsukon-cookie-accept" class="btn" style="background:#2447ff;color:#fff;padding:8px 18px;font-size:13px">Принять</button>
</div>
<script>
(function(){
  try {
    var key = 'tsukon_cookie_consent_v1';
    var banner = document.getElementById('tsukon-cookie-banner');
    var accept = document.getElementById('tsukon-cookie-accept');
    if (banner && localStorage.getItem(key) !== 'accepted') { banner.style.display = 'block'; }
    if (accept && banner) {
      accept.addEventListener('click', function(){
        localStorage.setItem(key, 'accepted');
        banner.style.display = 'none';
      });
    }
  } catch (e) {}
})();
document.querySelectorAll('form.tsukon-ajax-form').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var box = form.querySelector('.form-result');
    var btn = form.querySelector('button[type="submit"]');
    if(btn) btn.disabled = true;
    fetch(form.action, { method: 'POST', body: new FormData(form) })
      .then(function(r){ return r.json().then(function(d){ return {ok:r.ok, data:d}; }); })
      .then(function(res){
        if(res.ok && res.data.success){
          box.innerHTML = '<div class="notice-ok">' + (res.data.data && res.data.data.message ? res.data.data.message : 'Заявка отправлена') + '</div>';
          if(typeof ym === 'function' && window.TSUKON_YM_ID){
            var ft = form.querySelector('input[name="form_type"]');
            ym(window.TSUKON_YM_ID, 'reachGoal', ft && ft.value === 'owner' ? 'form_owner_submit' : 'form_tenant_submit');
          }
          form.reset();
        } else {
          box.innerHTML = '<div class="notice-err">' + (res.data.data && res.data.data.message ? res.data.data.message : 'Проверьте заполнение формы') + '</div>';
        }
      })
      .catch(function(){
        box.innerHTML = '<div class="notice-err">Ошибка соединения. Позвоните по телефону ${state.settings.contacts.phoneDisplay}.</div>';
      })
      .finally(function(){ if(btn) btn.disabled = false; });
  });
});
</script>
<?php wp_footer(); ?>
</body>
</html>
`;

  const roomCardInclude = `<?php
// Универсальная карточка помещения (подтягивает связанный Объект)
$r_id = get_the_ID();
$r_data = tsukon_get_room_data($r_id);
$obj_title = $r_data['object_name'] ?: 'Объект ЦУКОН';
$obj_addr = $r_data['object_address'];
?>
<article class="card">
  <?php if ($r_data['photo_url']) : ?>
    <img src="<?php echo esc_url($r_data['photo_url']); ?>" alt="<?php echo esc_attr(get_the_title()); ?>">
  <?php elseif (has_post_thumbnail()) : ?>
    <?php the_post_thumbnail('medium_large'); ?>
  <?php endif; ?>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
    <span class="tag <?php echo esc_attr($r_data['status']); ?>"><?php echo esc_html($r_data['status_label']); ?></span>
    <span class="mute" style="font-size:12px"><?php echo esc_html($r_data['purpose_label']); ?></span>
  </div>
  <h3><?php the_title(); ?></h3>
  <p class="mute" style="font-size:13px"><?php echo esc_html($obj_title); ?><?php echo $obj_addr ? ' · ' . esc_html($obj_addr) : ''; ?></p>
  <p class="tabular" style="font-weight:600;margin-top:4px"><?php echo esc_html($r_data['area']); ?> м² · <?php echo number_format((int)$r_data['price'], 0, ',', ' '); ?> ₽/м² в мес.</p>
  <p class="mute tabular" style="font-size:13px">≈ <?php echo number_format((int)$r_data['area'] * (int)$r_data['price'], 0, ',', ' '); ?> ₽/мес.</p>
  <?php if (!empty($r_data['features_arr'])) : ?>
    <div class="chips">
      <?php foreach (array_slice($r_data['features_arr'], 0, 4) as $feat) : ?>
        <span class="chip"><?php echo esc_html($feat); ?></span>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
  <div style="margin-top:auto;padding-top:10px">
    <a class="btn l" style="width:100%" href="<?php echo esc_url(home_url('/tenants/?room=' . urlencode(get_the_title()) . '#lead-form')); ?>">Оставить заявку</a>
  </div>
</article>`;

  const frontPagePhp = `<?php get_header(); ?>
<section>
  <div class="w">
    <h1>${state.pages.homeHeroTitle1}<br>${state.pages.homeHeroTitle2}<br>${state.pages.homeHeroTitle3}</h1>
    <p class="mute" style="margin:24px 0;max-width:56ch;font-size:18px">${state.pages.homeHeroLead}</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <a class="btn" href="<?php echo esc_url(home_url('/objects/')); ?>">Смотреть помещения</a>
      <a class="btn l" href="<?php echo esc_url(home_url('/owners/#lead-form')); ?>">Передать объект</a>
    </div>
  </div>
</section>

<section style="padding-top:24px">
  <div class="w">
    <h2>Объекты под управлением</h2>
    <p class="mute" style="margin-top:8px">Производственные, складские и деловые площадки в г. Саранске.</p>
    <div class="grid3">
      <?php
      $objects = tsukon_get_objects();
      foreach ($objects as $obj) :
        $free_cnt = tsukon_count_object_rooms($obj->ID, 'free');
        $total_cnt = tsukon_count_object_rooms($obj->ID, '');
        $img = tsukon_resolve_image(get_post_meta($obj->ID, '_tsukon_photo_url', true));
        $addr = get_post_meta($obj->ID, '_tsukon_address', true);
      ?>
        <article class="card">
          <?php if ($img) : ?><img src="<?php echo esc_url($img); ?>" alt="<?php echo esc_attr($obj->post_title); ?>"><?php endif; ?>
          <h3><?php echo esc_html($obj->post_title); ?></h3>
          <p class="mute" style="font-size:13px"><?php echo esc_html($addr); ?></p>
          <p style="font-size:14px;margin-top:4px"><?php echo esc_html(wp_trim_words(wp_strip_all_tags($obj->post_content), 22)); ?></p>
          <div style="margin-top:auto;padding-top:10px;display:flex;justify-content:space-between;align-items:center">
            <span class="tag free">Свободно: <?php echo (int)$free_cnt; ?> из <?php echo (int)$total_cnt; ?></span>
            <a class="btn l" href="<?php echo esc_url(home_url('/objects/?object_id=' . $obj->ID)); ?>">Помещения</a>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section>
  <div class="w">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
      <div>
        <h2>Свободные помещения</h2>
        <p class="mute" style="margin-top:6px">Актуальные предложения · прямая аренда от управляющей компании.</p>
      </div>
      <a class="btn l" href="<?php echo esc_url(home_url('/objects/')); ?>">Весь каталог</a>
    </div>
    <div class="grid">
      <?php
      $rooms = tsukon_query_featured_free_rooms();
      if ($rooms->have_posts()) :
        while ($rooms->have_posts()) : $rooms->the_post();
          include __DIR__ . '/template-parts-room-card.php';
        endwhile;
        wp_reset_postdata();
      else : ?>
        <p class="mute">Свободных помещений сейчас нет в базе. Добавьте их в разделе «ЦУКОН: Помещения» в админке WordPress.</p>
      <?php endif; ?>
    </div>
  </div>
</section>

<section id="lead-form">
  <div class="w">
    <div class="fbox">
      <h2>Подобрать помещение</h2>
      <p class="mute" style="margin-top:6px">Оставьте контакты — предложим подходящие варианты за 1 рабочий день.</p>
      <?php echo tsukon_render_lead_form('tenant'); ?>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const pageObjectsPhp = `<?php /* Template Name: Объекты и каталог ЦУКОН */ get_header();
$f_object = isset($_GET['object_id']) ? (int)$_GET['object_id'] : 0;
$f_purpose = isset($_GET['purpose']) ? sanitize_text_field($_GET['purpose']) : '';
$f_status = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : '';
$f_min_area = isset($_GET['min_area']) ? (int)$_GET['min_area'] : 0;
$objects = tsukon_get_objects();
?>
<section>
  <div class="w">
    <h1>Объекты и помещения в Саранске</h1>
    <p class="mute" style="margin-top:10px;max-width:60ch">Актуальные производственные, складские и офисные площади в прямой аренде от управляющей компании ЦУКОН.</p>

    <div class="grid3">
      <?php foreach ($objects as $obj) :
        $free_cnt = tsukon_count_object_rooms($obj->ID, 'free');
        $img = tsukon_resolve_image(get_post_meta($obj->ID, '_tsukon_photo_url', true));
        $addr = get_post_meta($obj->ID, '_tsukon_address', true);
        $util = get_post_meta($obj->ID, '_tsukon_utilities', true);
      ?>
        <article class="card">
          <?php if ($img) : ?><img src="<?php echo esc_url($img); ?>" alt="<?php echo esc_attr($obj->post_title); ?>"><?php endif; ?>
          <h3><?php echo esc_html($obj->post_title); ?></h3>
          <p class="mute" style="font-size:13px"><?php echo esc_html($addr); ?></p>
          <?php if ($util) : ?><p style="font-size:13px"><strong>Коммуникации:</strong> <?php echo esc_html($util); ?></p><?php endif; ?>
          <div style="margin-top:auto;padding-top:8px;display:flex;justify-content:space-between;align-items:center">
            <span class="tag free">Свободно: <?php echo (int)$free_cnt; ?></span>
            <a class="btn l" href="?object_id=<?php echo (int)$obj->ID; ?>#rooms-list">Фильтр</a>
          </div>
        </article>
      <?php endforeach; ?>
    </div>

    <div id="rooms-list" style="margin-top:48px">
      <h2>Каталог помещений</h2>
      <form class="filters" method="get" action="#rooms-list">
        <select name="object_id">
          <option value="0">Все объекты</option>
          <?php foreach ($objects as $obj) : ?>
            <option value="<?php echo (int)$obj->ID; ?>" <?php selected($f_object, $obj->ID); ?>><?php echo esc_html($obj->post_title); ?></option>
          <?php endforeach; ?>
        </select>
        <select name="purpose">
          <option value="">Любое назначение</option>
          <option value="prod" <?php selected($f_purpose, 'prod'); ?>>Производство</option>
          <option value="wh" <?php selected($f_purpose, 'wh'); ?>>Склад</option>
          <option value="off" <?php selected($f_purpose, 'off'); ?>>Офис</option>
        </select>
        <select name="status">
          <option value="">Все статусы</option>
          <option value="free" <?php selected($f_status, 'free'); ?>>Свободно</option>
          <option value="booked" <?php selected($f_status, 'booked'); ?>>Забронировано</option>
          <option value="rented" <?php selected($f_status, 'rented'); ?>>Сдано</option>
        </select>
        <input type="number" name="min_area" placeholder="Площадь от (м²)" value="<?php echo $f_min_area ? (int)$f_min_area : ''; ?>" style="width:160px">
        <button class="btn" type="submit">Показать</button>
        <a class="btn l" href="<?php echo esc_url(home_url('/objects/#rooms-list')); ?>">Сбросить</a>
      </form>

      <div class="grid">
        <?php
        $rooms = tsukon_query_rooms([
          'object_id' => $f_object,
          'purpose' => $f_purpose,
          'status' => $f_status,
          'min_area' => $f_min_area,
        ]);
        if ($rooms->have_posts()) :
          while ($rooms->have_posts()) : $rooms->the_post();
            include __DIR__ . '/template-parts-room-card.php';
          endwhile;
          wp_reset_postdata();
        else : ?>
          <p class="mute">По заданным фильтрам помещений не найдено.</p>
        <?php endif; ?>
      </div>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const pageTenantsPhp = `<?php /* Template Name: Арендаторам ЦУКОН */ get_header(); ?>
<section>
  <div class="w">
    <h1>Арендаторам</h1>
    <p class="mute" style="margin-top:12px;max-width:60ch;font-size:18px">${state.pages.tenantsIntro}</p>

    <h2 style="margin-top:42px">Доступные сейчас помещения</h2>
    <div class="grid">
      <?php
      $rooms = tsukon_query_rooms(['status' => 'free', 'limit' => tsukon_get_free_limit()]);
      if ($rooms->have_posts()) :
        while ($rooms->have_posts()) : $rooms->the_post();
          include __DIR__ . '/template-parts-room-card.php';
        endwhile;
        wp_reset_postdata();
      endif; ?>
    </div>

    <div id="lead-form" class="fbox">
      <h2>Заявка на подбор помещения</h2>
      <p class="mute" style="margin-top:6px">Укажите требуемую площадь и параметры — подберём помещение в течение рабочего дня.</p>
      <?php echo tsukon_render_lead_form('tenant'); ?>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const pageOwnersPhp = `<?php /* Template Name: Собственникам ЦУКОН */ get_header(); ?>
<section>
  <div class="w">
    <h1>Собственникам недвижимости</h1>
    <p class="mute" style="margin-top:12px;max-width:62ch;font-size:18px">${state.pages.ownersIntro}</p>

    <div class="grid3" style="margin-top:32px">
      <div class="card"><h3>Брокеридж</h3><p class="mute">Поиск и проверка арендаторов, минимизация простоев, прямые договоры.</p></div>
      <div class="card"><h3>Эксплуатация сетей</h3><p class="mute">Обслуживание подстанций, газового хозяйства, отопления и кровли.</p></div>
      <div class="card"><h3>Охрана и учёт</h3><p class="mute">КПП 24/7, пропускной режим, прозрачная отчётность по платежам.</p></div>
    </div>

    <div id="lead-form" class="fbox">
      <h2>Передать объект в управление</h2>
      <?php echo tsukon_render_lead_form('owner'); ?>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const pageResidentsPhp = `<?php /* Template Name: Резиденты ЦУКОН */ get_header(); ?>
<section>
  <div class="w">
    <h1>Резиденты площадок ЦУКОН</h1>
    <p class="mute" style="margin-top:12px;max-width:60ch;font-size:18px">${state.pages.residentsIntro}</p>
    <div class="grid">
      <?php
      $res = new WP_Query(['post_type' => 'tsukon_resident', 'posts_per_page' => -1, 'orderby' => 'menu_order title', 'order' => 'ASC']);
      while ($res->have_posts()) : $res->the_post();
        $oid = (int)get_post_meta(get_the_ID(), '_tsukon_object_id', true);
        $obj_name = $oid ? get_the_title($oid) : '';
        $ind = get_post_meta(get_the_ID(), '_tsukon_industry', true);
        $yr = get_post_meta(get_the_ID(), '_tsukon_since_year', true);
      ?>
        <article class="card">
          <h3><?php the_title(); ?></h3>
          <?php if ($ind) : ?><p style="font-size:14px;font-weight:500"><?php echo esc_html($ind); ?></p><?php endif; ?>
          <div class="mute" style="font-size:13px"><?php the_content(); ?></div>
          <?php if ($obj_name || $yr) : ?>
            <p class="mute" style="margin-top:auto;font-size:12px"><?php echo esc_html($obj_name); ?><?php echo $yr ? ' · с ' . esc_html($yr) . ' г.' : ''; ?></p>
          <?php endif; ?>
        </article>
      <?php endwhile; wp_reset_postdata(); ?>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const pageAboutPhp = `<?php /* Template Name: О компании ЦУКОН */ get_header();
$objects = tsukon_get_objects();
$free_total = tsukon_count_all_rooms('free');
?>
<section>
  <div class="w">
    <h1>О компании ЦУКОН</h1>
    <p class="mute" style="margin-top:14px;max-width:64ch;font-size:18px">${state.pages.aboutStatement}</p>
    <div class="grid3" style="margin-top:32px">
      <div class="card"><div class="dsp" style="font-size:34px"><?php echo count($objects); ?></div><p class="mute">Ключевые площадки в Саранске</p></div>
      <div class="card"><div class="dsp" style="font-size:34px"><?php echo (int)$free_total; ?></div><p class="mute">Свободных помещений сейчас в каталоге</p></div>
      <div class="card"><div class="dsp" style="font-size:34px">${state.settings.tenantsTotalCount}</div><p class="mute">Компаний-резидентов</p></div>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const pageFaqPhp = `<?php /* Template Name: FAQ ЦУКОН */ get_header(); ?>
<section>
  <div class="w">
    <h1>Вопросы и ответы (FAQ)</h1>
    <p class="mute" style="margin-top:10px;max-width:64ch">Конкретные ответы о помещениях, мощностях, охране, стоимости и условиях аренды в г. Саранске.</p>

    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px">
      <a class="btn l" href="<?php echo esc_url(home_url('/guide-production/')); ?>">Производство и кВт</a>
      <a class="btn l" href="<?php echo esc_url(home_url('/guide-warehouses/')); ?>">Склады и фуры</a>
      <a class="btn l" href="<?php echo esc_url(home_url('/guide-utilities/')); ?>">Коммуникации и охрана</a>
      <a class="btn l" href="<?php echo esc_url(home_url('/guide-terms/')); ?>">Все площади и цены</a>
    </div>

    <div style="margin-top:28px;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:8px 24px">
      <?php
      $faqs = new WP_Query(['post_type' => 'tsukon_faq', 'posts_per_page' => -1, 'orderby' => 'menu_order ID', 'order' => 'ASC']);
      while ($faqs->have_posts()) : $faqs->the_post(); ?>
        <details open style="border-bottom:1px solid var(--line);padding:16px 0">
          <summary style="font-weight:600;cursor:pointer"><?php the_title(); ?></summary>
          <div class="mute" style="margin-top:8px;font-size:15px"><?php the_content(); ?></div>
        </details>
      <?php endwhile; wp_reset_postdata(); ?>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const pageGuidePhp = `<?php /* Template Name: Спецификация для ИИ и поиска ЦУКОН */ get_header();
$slug = get_post_field('post_name', get_post());
$purpose_filter = '';
$title_default = 'Условия аренды, точные площади и стоимость помещений';
if ($slug === 'guide-production') {
  $purpose_filter = 'prod';
  $title_default = 'Производственные помещения в Саранске (площади и кВт)';
} elseif ($slug === 'guide-warehouses') {
  $purpose_filter = 'wh_off';
  $title_default = 'Склады, офисы и площадки для грузового транспорта в Саранске';
} elseif ($slug === 'guide-utilities') {
  $title_default = 'Коммуникации, обслуживание и охрана объектов ЦУКОН';
}
$objects = tsukon_get_objects();
$rooms = tsukon_query_rooms(['purpose' => $purpose_filter]);
?>
<section>
  <div class="w">
    <h1><?php echo esc_html(get_the_title() ?: $title_default); ?></h1>
    <div class="mute" style="margin-top:12px;max-width:65ch"><?php the_content(); ?></div>

    <h2 style="margin-top:36px">Площадки, адреса и инженерная инфраструктура</h2>
    <div class="grid3">
      <?php foreach ($objects as $obj) :
        $addr = get_post_meta($obj->ID, '_tsukon_address', true);
        $util = get_post_meta($obj->ID, '_tsukon_utilities', true);
        $sec = get_post_meta($obj->ID, '_tsukon_security', true);
      ?>
        <article class="card">
          <h3><?php echo esc_html($obj->post_title); ?></h3>
          <p style="font-size:14px;font-weight:500"><?php echo esc_html($addr); ?></p>
          <p class="mute" style="font-size:13px"><strong>Коммуникации:</strong> <?php echo esc_html($util); ?></p>
          <p class="mute" style="font-size:13px"><strong>Охрана:</strong> <?php echo esc_html($sec); ?></p>
        </article>
      <?php endforeach; ?>
    </div>

    <h2 style="margin-top:42px">Точные площади, ставки и статусы</h2>
    <div class="table-wrap">
      <table class="tsukon-tbl">
        <thead>
          <tr>
            <th>Помещение и объект</th>
            <th>Назначение</th>
            <th>Площадь</th>
            <th>Ставка</th>
            <th>Коммуникации и условия</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          <?php if ($rooms->have_posts()) : while ($rooms->have_posts()) : $rooms->the_post();
            $d = tsukon_get_room_data(get_the_ID()); ?>
            <tr>
              <td><strong><?php the_title(); ?></strong><div class="mute" style="font-size:12px"><?php echo esc_html($d['object_name']); ?><?php echo $d['object_address'] ? ' · ' . esc_html($d['object_address']) : ''; ?></div></td>
              <td><?php echo esc_html($d['purpose_label']); ?></td>
              <td class="tabular"><strong><?php echo esc_html($d['area']); ?> м²</strong></td>
              <td class="tabular"><strong><?php echo number_format((int)$d['price'], 0, ',', ' '); ?> ₽/м²</strong><div class="mute" style="font-size:12px">≈ <?php echo number_format((int)$d['area'] * (int)$d['price'], 0, ',', ' '); ?> ₽/мес.</div></td>
              <td class="mute" style="font-size:13px"><?php echo esc_html($d['features']); ?><?php echo $d['lease_terms'] ? '<br>' . esc_html($d['lease_terms']) : ''; ?></td>
              <td><span class="tag <?php echo esc_attr($d['status']); ?>"><?php echo esc_html($d['status_label']); ?></span></td>
            </tr>
          <?php endwhile; wp_reset_postdata(); endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const pageContactsPhp = `<?php /* Template Name: Контакты ЦУКОН */ get_header(); ?>
<section>
  <div class="w">
    <h1>Контакты и реквизиты</h1>
    <div class="grid3" style="margin-top:28px">
      <div class="card"><h3>Адрес</h3><p>${state.settings.contacts.legalAddress}</p><p class="mute">${state.settings.contacts.workHours}</p></div>
      <div class="card"><h3>Связь</h3><p><a href="${state.settings.contacts.phoneHref}">${state.settings.contacts.phoneDisplay}</a></p><p><a href="mailto:${state.settings.contacts.email}">${state.settings.contacts.email}</a></p></div>
      <div class="card"><h3>Реквизиты</h3><p>${state.settings.contacts.companyName}</p><p class="mute">ИНН ${state.settings.contacts.inn} · КПП ${state.settings.contacts.kpp} · ОГРН ${state.settings.contacts.ogrn}</p></div>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const pagePrivacyPhp = `<?php /* Template Name: Политика конфиденциальности ЦУКОН */ get_header(); ?>
<section>
  <div class="w">
    <h1>Политика обработки персональных данных</h1>
    <div class="card" style="margin-top:24px;max-width:780px">
      <p>${state.pages.privacyText}</p>
    </div>
  </div>
</section>
<?php get_footer(); ?>
`;

  const indexPhp = `<?php get_header(); ?>
<section><div class="w">
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
  <h1><?php the_title(); ?></h1>
  <div style="margin-top:20px"><?php the_content(); ?></div>
<?php endwhile; endif; ?>
</div></section>
<?php get_footer(); ?>
`;

  const readmeTxt = `ЦУКОН — Тема WordPress (Концепция № 3, версия 2.0 с единой связанной базой)
=============================================================================

Как правильно перенести и управлять помещениями с одного экрана:
1. В админке WordPress откройте «Внешний вид -> Темы -> Добавить новую -> Загрузить тему» и загрузите tsukon-wp-theme.zip.
2. Активируйте тему. При активации автоматически создаются страницы сайта (Главная, Объекты, Арендаторам, Собственникам, Резиденты, О компании, FAQ, Контакты и 4 ИИ-страницы).
3. Перейдите в «Инструменты -> Импорт -> WordPress» (установите стандартный импортер при первом запуске) и загрузите tsukon-wordpress.xml.
   Все объекты, помещения (подвязанные к своим объектам по ID), резиденты и вопросы FAQ появятся в базе WordPress.
4. В меню админки WordPress появится раздел «ЦУКОН: Помещения».
   Там на ОДНОЙ странице можно создавать, удалять и редактировать любые помещения (объект, назначение, площадь, цену, статус, характеристики, показ на главной).
   Любое изменение сразу и равномерно применяется на:
   - Главной странице (счётчик свободных помещений на объекте + витрина 5–7 свободных),
   - Странице «Объекты» (фильтрация по объекту/назначению/площади),
   - Странице «Арендаторам» (список свободных),
   - ИИ-таблицах (/guide-production, /guide-warehouses, /guide-utilities, /guide-terms),
   - Разметке Schema.org JSON-LD и /llms.txt.
5. В «Внешний вид -> Настроить -> Настройки ЦУКОН» укажите новый 8-значный ID счётчика Яндекс.Метрики и email для заявок (${recipient}, лимит ${freeLimit} помещений).
`;

  return {
    'tsukon-theme/style.css': styleCss,
    'tsukon-theme/header.php': headerPhp,
    'tsukon-theme/footer.php': footerPhp,
    'tsukon-theme/template-parts-room-card.php': roomCardInclude,
    'tsukon-theme/front-page.php': frontPagePhp,
    'tsukon-theme/page-objects.php': pageObjectsPhp,
    'tsukon-theme/page-tenants.php': pageTenantsPhp,
    'tsukon-theme/page-owners.php': pageOwnersPhp,
    'tsukon-theme/page-residents.php': pageResidentsPhp,
    'tsukon-theme/page-about.php': pageAboutPhp,
    'tsukon-theme/page-faq.php': pageFaqPhp,
    'tsukon-theme/page-guide.php': pageGuidePhp,
    'tsukon-theme/page-contacts.php': pageContactsPhp,
    'tsukon-theme/page-privacy.php': pagePrivacyPhp,
    'tsukon-theme/index.php': indexPhp,
    'tsukon-theme/README.txt': readmeTxt,
  };
}
