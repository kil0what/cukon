import type { CmsState } from '../shared/types';
import { ROOM_PURPOSE_LABELS, ROOM_STATUS_LABELS } from '../shared/defaultData';
import { buildWordPressTemplates, mapAssetToWpRelative } from './wordpressTemplates';

export interface WordPressThemeFiles {
  [relativePath: string]: string;
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapePhpSingle(str: string): string {
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function buildWordPressThemeFiles(state: CmsState): WordPressThemeFiles {
  const ymId = state.settings.analytics.yandexMetrikaId.trim();
  const recipient = state.settings.contacts.leadRecipientEmail || state.settings.contacts.email;
  const freeLimit = Math.min(7, Math.max(5, state.settings.featuredFreeLimit || 6));

  const templates = buildWordPressTemplates(state);

  const functionsPhp = `<?php
/**
 * ЦУКОН — Функции темы WordPress (Концепция № 3, единая связанная база)
 */
if (!defined('ABSPATH')) exit;

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    register_nav_menus(['primary' => 'Главное меню ЦУКОН']);
});

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('tsukon-fonts', 'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&family=Unbounded:wght@400;500;600&display=swap', [], null);
    wp_enqueue_style('tsukon-style', get_stylesheet_uri(), [], '2.0.0');
});

// 1. Типы записей единой базы ЦУКОН
add_action('init', function () {
    register_post_type('tsukon_object', [
        'labels' => ['name' => 'Объекты (площадки)', 'singular_name' => 'Объект', 'add_new_item' => 'Добавить объект'],
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'thumbnail', 'custom-fields'],
        'menu_icon' => 'dashicons-building',
    ]);
    register_post_type('tsukon_room', [
        'labels' => ['name' => 'Помещения (каталог)', 'singular_name' => 'Помещение', 'add_new_item' => 'Добавить помещение'],
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'thumbnail', 'custom-fields'],
        'menu_icon' => 'dashicons-grid-view',
    ]);
    register_post_type('tsukon_resident', [
        'labels' => ['name' => 'Резиденты', 'singular_name' => 'Резидент', 'add_new_item' => 'Добавить резидента'],
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'custom-fields'],
        'menu_icon' => 'dashicons-groups',
    ]);
    register_post_type('tsukon_faq', [
        'labels' => ['name' => 'FAQ (Вопросы и ИИ)', 'singular_name' => 'Вопрос FAQ', 'add_new_item' => 'Добавить вопрос'],
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'custom-fields'],
        'menu_icon' => 'dashicons-editor-help',
    ]);
});

// 2. Вспомогательные функции единой выборки и связей
function tsukon_resolve_image($url) {
    $url = trim((string)$url);
    if (!$url) return get_template_directory_uri() . '/assets/images/industrial_park_exterior.jpg';
    if (strpos($url, 'assets/images/') === 0) {
        return get_template_directory_uri() . '/' . $url;
    }
    if (strpos($url, 'production_workshop') !== false) return get_template_directory_uri() . '/assets/images/production_workshop.jpg';
    if (strpos($url, 'logistics_warehouse') !== false) return get_template_directory_uri() . '/assets/images/logistics_warehouse.jpg';
    if (strpos($url, 'business_center_office') !== false) return get_template_directory_uri() . '/assets/images/business_center_office.jpg';
    if (strpos($url, 'industrial_park_exterior') !== false) return get_template_directory_uri() . '/assets/images/industrial_park_exterior.jpg';
    return $url;
}

function tsukon_get_free_limit() {
    return max(5, min(7, (int) get_theme_mod('tsukon_free_limit', ${freeLimit})));
}

function tsukon_get_objects() {
    return get_posts([
        'post_type' => 'tsukon_object',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'orderby' => 'ID',
        'order' => 'ASC',
    ]);
}

function tsukon_get_room_data($room_id) {
    $obj_id = (int) get_post_meta($room_id, '_tsukon_object_id', true);
    $obj_post = $obj_id ? get_post($obj_id) : null;
    $purpose = get_post_meta($room_id, '_tsukon_purpose', true) ?: 'prod';
    $status = get_post_meta($room_id, '_tsukon_status', true) ?: 'free';
    $purpose_map = ['prod' => 'Производство', 'wh' => 'Склад', 'off' => 'Офис'];
    $status_map = ['free' => 'Свободно', 'booked' => 'Забронировано', 'rented' => 'Сдано'];
    $features_str = (string) get_post_meta($room_id, '_tsukon_features', true);
    $features_arr = array_values(array_filter(array_map('trim', explode(',', $features_str))));
    $photo_meta = get_post_meta($room_id, '_tsukon_photo_url', true);
    if (!$photo_meta && has_post_thumbnail($room_id)) {
        $photo_meta = get_the_post_thumbnail_url($room_id, 'medium_large');
    }
    return [
        'object_id' => $obj_id,
        'object_name' => $obj_post ? $obj_post->post_title : '',
        'object_address' => $obj_post ? (string) get_post_meta($obj_post->ID, '_tsukon_address', true) : '',
        'area' => (int) get_post_meta($room_id, '_tsukon_area', true),
        'price' => (int) get_post_meta($room_id, '_tsukon_price', true),
        'purpose' => $purpose,
        'purpose_label' => $purpose_map[$purpose] ?? 'Помещение',
        'status' => $status,
        'status_label' => $status_map[$status] ?? 'Свободно',
        'features' => $features_str,
        'features_arr' => $features_arr,
        'lease_terms' => (string) get_post_meta($room_id, '_tsukon_lease_terms', true),
        'featured' => get_post_meta($room_id, '_tsukon_featured', true) === '1',
        'photo_url' => tsukon_resolve_image($photo_meta),
        'photo_raw' => (string) $photo_meta,
    ];
}

function tsukon_count_object_rooms($object_id, $status = '') {
    $meta_query = [['key' => '_tsukon_object_id', 'value' => (string) $object_id]];
    if ($status !== '') {
        $meta_query[] = ['key' => '_tsukon_status', 'value' => $status];
    }
    $q = new WP_Query([
        'post_type' => 'tsukon_room',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'fields' => 'ids',
        'meta_query' => $meta_query,
    ]);
    return (int) $q->found_posts;
}

function tsukon_count_all_rooms($status = '') {
    $args = ['post_type' => 'tsukon_room', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids'];
    if ($status !== '') {
        $args['meta_query'] = [['key' => '_tsukon_status', 'value' => $status]];
    }
    $q = new WP_Query($args);
    return (int) $q->found_posts;
}

function tsukon_query_featured_free_rooms() {
    $limit = tsukon_get_free_limit();
    $q = new WP_Query([
        'post_type' => 'tsukon_room',
        'post_status' => 'publish',
        'posts_per_page' => $limit,
        'meta_query' => [
            ['key' => '_tsukon_status', 'value' => 'free'],
            ['key' => '_tsukon_featured', 'value' => '1'],
        ],
    ]);
    if ($q->have_posts()) return $q;
    return tsukon_query_rooms(['status' => 'free', 'limit' => $limit]);
}

function tsukon_query_rooms($filters = []) {
    $meta_query = [];
    if (!empty($filters['object_id'])) {
        $meta_query[] = ['key' => '_tsukon_object_id', 'value' => (string) (int) $filters['object_id']];
    }
    if (!empty($filters['status'])) {
        $meta_query[] = ['key' => '_tsukon_status', 'value' => sanitize_text_field($filters['status'])];
    }
    if (!empty($filters['purpose'])) {
        if ($filters['purpose'] === 'wh_off') {
            $meta_query[] = ['key' => '_tsukon_purpose', 'value' => ['wh', 'off'], 'compare' => 'IN'];
        } else {
            $meta_query[] = ['key' => '_tsukon_purpose', 'value' => sanitize_text_field($filters['purpose'])];
        }
    }
    if (!empty($filters['min_area'])) {
        $meta_query[] = ['key' => '_tsukon_area', 'value' => (int) $filters['min_area'], 'type' => 'NUMERIC', 'compare' => '>='];
    }
    return new WP_Query([
        'post_type' => 'tsukon_room',
        'post_status' => 'publish',
        'posts_per_page' => isset($filters['limit']) ? (int) $filters['limit'] : -1,
        'orderby' => 'ID',
        'order' => 'ASC',
        'meta_query' => $meta_query,
    ]);
}

// 3. Автоматическое связывание после импорта XML и создание страниц сайта
function tsukon_link_imported_relations() {
    $objects = tsukon_get_objects();
    $source_to_wp = [];
    foreach ($objects as $obj) {
        $src = get_post_meta($obj->ID, '_tsukon_source_id', true);
        if ($src) $source_to_wp[(string) $src] = $obj->ID;
    }
    if (empty($source_to_wp)) return 0;

    $linked = 0;
    $posts = get_posts([
        'post_type' => ['tsukon_room', 'tsukon_resident'],
        'post_status' => 'any',
        'posts_per_page' => -1,
    ]);
    foreach ($posts as $p) {
        $src_obj = get_post_meta($p->ID, '_tsukon_object_source_id', true);
        if ($src_obj && isset($source_to_wp[(string) $src_obj])) {
            $target_id = (int) $source_to_wp[(string) $src_obj];
            if ((int) get_post_meta($p->ID, '_tsukon_object_id', true) !== $target_id) {
                update_post_meta($p->ID, '_tsukon_object_id', $target_id);
                $linked++;
            }
        }
    }
    return $linked;
}

function tsukon_ensure_pages() {
    $pages = [
        'home' => ['title' => 'Главная', 'template' => ''],
        'objects' => ['title' => 'Объекты и помещения', 'template' => 'page-objects.php'],
        'tenants' => ['title' => 'Арендаторам', 'template' => 'page-tenants.php'],
        'owners' => ['title' => 'Собственникам', 'template' => 'page-owners.php'],
        'residents' => ['title' => 'Резиденты', 'template' => 'page-residents.php'],
        'about' => ['title' => 'О компании', 'template' => 'page-about.php'],
        'faq' => ['title' => 'Вопросы и ответы (FAQ)', 'template' => 'page-faq.php'],
        'contacts' => ['title' => 'Контакты', 'template' => 'page-contacts.php'],
        'privacy-policy' => ['title' => 'Политика обработки персональных данных', 'template' => 'page-privacy.php'],
        'guide-production' => ['title' => 'Производственные помещения в Саранске', 'template' => 'page-guide.php'],
        'guide-warehouses' => ['title' => 'Склады, офисы и площадки для грузового транспорта', 'template' => 'page-guide.php'],
        'guide-utilities' => ['title' => 'Коммуникации, обслуживание и охрана объектов ЦУКОН', 'template' => 'page-guide.php'],
        'guide-terms' => ['title' => 'Условия аренды, точные площади и стоимость помещений', 'template' => 'page-guide.php'],
    ];

    $home_id = 0;
    foreach ($pages as $slug => $cfg) {
        $existing = get_page_by_path($slug);
        if (!$existing) {
            $pid = wp_insert_post([
                'post_title' => $cfg['title'],
                'post_name' => $slug,
                'post_type' => 'page',
                'post_status' => 'publish',
                'post_content' => '',
            ]);
        } else {
            $pid = $existing->ID;
        }
        if ($pid && !is_wp_error($pid)) {
            if ($cfg['template']) {
                update_post_meta($pid, '_wp_page_template', $cfg['template']);
            }
            if ($slug === 'home') $home_id = $pid;
        }
    }
    if ($home_id) {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $home_id);
    }
    flush_rewrite_rules();
}

add_action('after_switch_theme', function () {
    tsukon_ensure_pages();
    tsukon_link_imported_relations();
});
add_action('import_end', 'tsukon_link_imported_relations');

// 4. Метабоксы в стандартном редакторе WordPress (связь с Объектом + параметры)
add_action('add_meta_boxes', function () {
    add_meta_box('tsukon_object_meta', 'Параметры площадки ЦУКОН', function ($post) {
        wp_nonce_field('tsukon_obj_save', 'tsukon_obj_nonce');
        $addr = get_post_meta($post->ID, '_tsukon_address', true);
        $util = get_post_meta($post->ID, '_tsukon_utilities', true);
        $sec = get_post_meta($post->ID, '_tsukon_security', true);
        $photo = get_post_meta($post->ID, '_tsukon_photo_url', true);
        echo '<p><label>Адрес:<br><input style="width:100%" type="text" name="tsukon_address" value="' . esc_attr($addr) . '"></label></p>';
        echo '<p><label>Коммуникации:<br><input style="width:100%" type="text" name="tsukon_utilities" value="' . esc_attr($util) . '"></label></p>';
        echo '<p><label>Охрана и доступ:<br><input style="width:100%" type="text" name="tsukon_security" value="' . esc_attr($sec) . '"></label></p>';
        echo '<p><label>Фото URL (или assets/images/...):<br><input style="width:100%" type="text" name="tsukon_photo_url" value="' . esc_attr($photo) . '"></label></p>';
    }, 'tsukon_object');

    add_meta_box('tsukon_room_meta', 'Параметры помещения и связь с объектом', function ($post) {
        wp_nonce_field('tsukon_room_save', 'tsukon_room_nonce');
        $objects = tsukon_get_objects();
        $obj_id = (int) get_post_meta($post->ID, '_tsukon_object_id', true);
        $area = get_post_meta($post->ID, '_tsukon_area', true);
        $price = get_post_meta($post->ID, '_tsukon_price', true);
        $purpose = get_post_meta($post->ID, '_tsukon_purpose', true) ?: 'prod';
        $status = get_post_meta($post->ID, '_tsukon_status', true) ?: 'free';
        $features = get_post_meta($post->ID, '_tsukon_features', true);
        $terms = get_post_meta($post->ID, '_tsukon_lease_terms', true);
        $photo = get_post_meta($post->ID, '_tsukon_photo_url', true);
        $featured = get_post_meta($post->ID, '_tsukon_featured', true) === '1';

        echo '<p><label><strong>Привязка к объекту:</strong><br><select name="tsukon_object_id" style="width:100%">';
        echo '<option value="0">— Выберите объект —</option>';
        foreach ($objects as $o) {
            echo '<option value="' . (int) $o->ID . '"' . selected($obj_id, $o->ID, false) . '>' . esc_html($o->post_title) . '</option>';
        }
        echo '</select></label></p>';
        echo '<p><label>Площадь (м²): <input type="number" name="tsukon_area" value="' . esc_attr($area) . '"></label> ';
        echo '<label style="margin-left:16px">Ставка (₽/м²): <input type="number" name="tsukon_price" value="' . esc_attr($price) . '"></label></p>';
        echo '<p><label>Назначение: <select name="tsukon_purpose"><option value="prod"' . selected($purpose, 'prod', false) . '>Производство</option><option value="wh"' . selected($purpose, 'wh', false) . '>Склад</option><option value="off"' . selected($purpose, 'off', false) . '>Офис</option></select></label> ';
        echo '<label style="margin-left:16px">Статус: <select name="tsukon_status"><option value="free"' . selected($status, 'free', false) . '>Свободно</option><option value="booked"' . selected($status, 'booked', false) . '>Забронировано</option><option value="rented"' . selected($status, 'rented', false) . '>Сдано</option></select></label></p>';
        echo '<p><label><input type="checkbox" name="tsukon_featured" value="1"' . checked($featured, true, false) . '> Показывать в витрине свободных на Главной</label></p>';
        echo '<p><label>Характеристики (через запятую):<br><input style="width:100%" type="text" name="tsukon_features" value="' . esc_attr($features) . '"></label></p>';
        echo '<p><label>Условия аренды:<br><input style="width:100%" type="text" name="tsukon_lease_terms" value="' . esc_attr($terms) . '"></label></p>';
        echo '<p><label>Фото URL:<br><input style="width:100%" type="text" name="tsukon_photo_url" value="' . esc_attr($photo) . '"></label></p>';
    }, 'tsukon_room');
});

add_action('save_post_tsukon_object', function ($post_id) {
    if (!isset($_POST['tsukon_obj_nonce']) || !wp_verify_nonce($_POST['tsukon_obj_nonce'], 'tsukon_obj_save')) return;
    foreach (['address', 'utilities', 'security', 'photo_url'] as $k) {
        if (isset($_POST['tsukon_' . $k])) update_post_meta($post_id, '_tsukon_' . $k, sanitize_text_field($_POST['tsukon_' . $k]));
    }
});

add_action('save_post_tsukon_room', function ($post_id) {
    if (!isset($_POST['tsukon_room_nonce']) || !wp_verify_nonce($_POST['tsukon_room_nonce'], 'tsukon_room_save')) return;
    foreach (['object_id', 'area', 'price', 'purpose', 'status', 'features', 'lease_terms', 'photo_url'] as $k) {
        if (isset($_POST['tsukon_' . $k])) update_post_meta($post_id, '_tsukon_' . $k, sanitize_text_field($_POST['tsukon_' . $k]));
    }
    update_post_meta($post_id, '_tsukon_featured', !empty($_POST['tsukon_featured']) ? '1' : '0');
});

// Колонки в стандартном списке Помещений WP
add_filter('manage_tsukon_room_posts_columns', function ($cols) {
    return [
        'cb' => $cols['cb'],
        'title' => 'Помещение',
        'tsukon_obj' => 'Объект',
        'tsukon_area' => 'Площадь',
        'tsukon_price' => 'Цена',
        'tsukon_status' => 'Статус',
        'date' => 'Дата',
    ];
});
add_action('manage_tsukon_room_posts_custom_column', function ($col, $post_id) {
    $d = tsukon_get_room_data($post_id);
    if ($col === 'tsukon_obj') echo esc_html($d['object_name'] ?: '—');
    if ($col === 'tsukon_area') echo esc_html($d['area']) . ' м²';
    if ($col === 'tsukon_price') echo esc_html($d['price']) . ' ₽/м²';
    if ($col === 'tsukon_status') echo '<strong>' . esc_html($d['status_label']) . '</strong>';
}, 10, 2);

// 5. Единая панель «ЦУКОН: Помещения» в админке WordPress (создание, редактирование и удаление на одной странице)
add_action('admin_menu', function () {
    add_menu_page(
        'ЦУКОН: Помещения',
        'ЦУКОН: Помещения',
        'edit_posts',
        'tsukon-rooms-manager',
        'tsukon_render_rooms_manager_page',
        'dashicons-layout',
        6
    );
});

add_action('admin_post_tsukon_save_room_inline', function () {
    if (!current_user_can('edit_posts') || !check_admin_referer('tsukon_mgr_action')) wp_die('Нет доступа');
    $room_id = isset($_POST['room_id']) ? (int) $_POST['room_id'] : 0;
    $title = sanitize_text_field($_POST['title'] ?? '');
    if (!$title) wp_redirect(admin_url('admin.php?page=tsukon-rooms-manager&msg=err'));
    $post_args = ['post_title' => $title, 'post_type' => 'tsukon_room', 'post_status' => 'publish'];
    if ($room_id > 0) {
        $post_args['ID'] = $room_id;
        wp_update_post($post_args);
    } else {
        $room_id = wp_insert_post($post_args);
    }
    if ($room_id && !is_wp_error($room_id)) {
        update_post_meta($room_id, '_tsukon_object_id', (int) ($_POST['object_id'] ?? 0));
        update_post_meta($room_id, '_tsukon_purpose', sanitize_text_field($_POST['purpose'] ?? 'prod'));
        update_post_meta($room_id, '_tsukon_area', (int) ($_POST['area'] ?? 0));
        update_post_meta($room_id, '_tsukon_price', (int) ($_POST['price'] ?? 0));
        update_post_meta($room_id, '_tsukon_status', sanitize_text_field($_POST['status'] ?? 'free'));
        update_post_meta($room_id, '_tsukon_features', sanitize_text_field($_POST['features'] ?? ''));
        update_post_meta($room_id, '_tsukon_lease_terms', sanitize_text_field($_POST['lease_terms'] ?? ''));
        update_post_meta($room_id, '_tsukon_featured', !empty($_POST['featured']) ? '1' : '0');
        if (!empty($_POST['photo_url'])) {
            update_post_meta($room_id, '_tsukon_photo_url', sanitize_text_field($_POST['photo_url']));
        }
    }
    wp_redirect(admin_url('admin.php?page=tsukon-rooms-manager&msg=saved'));
    exit;
});

add_action('admin_post_tsukon_delete_room_inline', function () {
    if (!current_user_can('delete_posts') || !check_admin_referer('tsukon_mgr_action')) wp_die('Нет доступа');
    $room_id = isset($_GET['room_id']) ? (int) $_GET['room_id'] : 0;
    if ($room_id > 0) wp_trash_post($room_id);
    wp_redirect(admin_url('admin.php?page=tsukon-rooms-manager&msg=deleted'));
    exit;
});

add_action('admin_post_tsukon_sync_links', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('tsukon_mgr_action')) wp_die('Нет доступа');
    tsukon_ensure_pages();
    $cnt = tsukon_link_imported_relations();
    wp_redirect(admin_url('admin.php?page=tsukon-rooms-manager&msg=synced&cnt=' . (int) $cnt));
    exit;
});

function tsukon_render_rooms_manager_page() {
    $objects = tsukon_get_objects();
    $rooms = tsukon_query_rooms();
    $action_url = admin_url('admin-post.php');
    $nonce = wp_create_nonce('tsukon_mgr_action');
    echo '<div class="wrap"><h1>ЦУКОН: Единое управление помещениями</h1>';
    echo '<p>Все изменения, добавление или удаление помещений на этой странице автоматически применяются на Главной, в разделе «Объекты», «Арендаторам», в ИИ-таблицах (<code>/guide-*</code>) и Schema.org.</p>';
    echo '<form method="post" action="' . esc_url($action_url) . '" style="margin:12px 0"><input type="hidden" name="action" value="tsukon_sync_links"><input type="hidden" name="_wpnonce" value="' . esc_attr($nonce) . '"><button class="button">Синхронизировать страницы и привязки после импорта XML</button></form>';

    echo '<div style="background:#fff;border:1px solid #ccd0d4;padding:16px;margin:16px 0;border-radius:6px"><h2>Добавить новое помещение</h2>';
    echo '<form method="post" action="' . esc_url($action_url) . '" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;align-items:end">';
    echo '<input type="hidden" name="action" value="tsukon_save_room_inline"><input type="hidden" name="_wpnonce" value="' . esc_attr($nonce) . '">';
    echo '<label>Название<br><input class="regular-text" style="width:100%" name="title" required placeholder="Цех № 2"></label>';
    echo '<label>Объект<br><select name="object_id" style="width:100%">';
    foreach ($objects as $o) echo '<option value="' . (int) $o->ID . '">' . esc_html($o->post_title) . '</option>';
    echo '</select></label>';
    echo '<label>Назначение<br><select name="purpose" style="width:100%"><option value="prod">Производство</option><option value="wh">Склад</option><option value="off">Офис</option></select></label>';
    echo '<label>Площадь (м²)<br><input type="number" name="area" value="200" style="width:100%"></label>';
    echo '<label>Цена (₽/м²)<br><input type="number" name="price" value="350" style="width:100%"></label>';
    echo '<label>Статус<br><select name="status" style="width:100%"><option value="free">Свободно</option><option value="booked">Забронировано</option><option value="rented">Сдано</option></select></label>';
    echo '<label>Характеристики<br><input type="text" name="features" placeholder="100 кВт, ворота 4×4" style="width:100%"></label>';
    echo '<label><input type="checkbox" name="featured" value="1" checked> На главной</label>';
    echo '<div><button class="button button-primary" type="submit">Создать помещение</button></div>';
    echo '</form></div>';

    echo '<table class="widefat striped"><thead><tr><th>Название</th><th>Объект</th><th>Назначение</th><th>Площадь м²</th><th>Цена ₽/м²</th><th>Статус</th><th>На главной</th><th>Действия</th></tr></thead><tbody>';
    if ($rooms->have_posts()) : while ($rooms->have_posts()) : $rooms->the_post();
        $rid = get_the_ID();
        $d = tsukon_get_room_data($rid);
        $del_url = wp_nonce_url(admin_url('admin-post.php?action=tsukon_delete_room_inline&room_id=' . $rid), 'tsukon_mgr_action');
        echo '<tr><form method="post" action="' . esc_url($action_url) . '">';
        echo '<input type="hidden" name="action" value="tsukon_save_room_inline"><input type="hidden" name="_wpnonce" value="' . esc_attr($nonce) . '"><input type="hidden" name="room_id" value="' . (int) $rid . '">';
        echo '<input type="hidden" name="features" value="' . esc_attr($d['features']) . '"><input type="hidden" name="lease_terms" value="' . esc_attr($d['lease_terms']) . '"><input type="hidden" name="photo_url" value="' . esc_attr($d['photo_raw']) . '">';
        echo '<td><input type="text" name="title" value="' . esc_attr(get_the_title()) . '" style="width:100%"></td>';
        echo '<td><select name="object_id">';
        foreach ($objects as $o) echo '<option value="' . (int) $o->ID . '"' . selected($d['object_id'], $o->ID, false) . '>' . esc_html($o->post_title) . '</option>';
        echo '</select></td>';
        echo '<td><select name="purpose"><option value="prod"' . selected($d['purpose'], 'prod', false) . '>Производство</option><option value="wh"' . selected($d['purpose'], 'wh', false) . '>Склад</option><option value="off"' . selected($d['purpose'], 'off', false) . '>Офис</option></select></td>';
        echo '<td><input type="number" name="area" value="' . esc_attr($d['area']) . '" style="width:80px"></td>';
        echo '<td><input type="number" name="price" value="' . esc_attr($d['price']) . '" style="width:80px"></td>';
        echo '<td><select name="status"><option value="free"' . selected($d['status'], 'free', false) . '>Свободно</option><option value="booked"' . selected($d['status'], 'booked', false) . '>Забронировано</option><option value="rented"' . selected($d['status'], 'rented', false) . '>Сдано</option></select></td>';
        echo '<td style="text-align:center"><input type="checkbox" name="featured" value="1"' . checked($d['featured'], true, false) . '></td>';
        echo '<td style="white-space:nowrap"><button class="button button-primary" type="submit">Сохранить</button> <a class="button" style="color:#b32d2e" href="' . esc_url($del_url) . '" onclick="return confirm(\'Удалить помещение?\')">Удалить</a></td>';
        echo '</form></tr>';
    endwhile; wp_reset_postdata(); endif;
    echo '</tbody></table></div>';
}

// 6. Форма обратной связи + AJAX отправка + Антиспам
function tsukon_render_lead_form($type = 'tenant') {
    $is_owner = $type === 'owner';
    $pre_room = isset($_GET['room']) ? sanitize_text_field($_GET['room']) : '';
    $msg_val = $pre_room ? 'Интересует: ' . $pre_room : '';
    $a = wp_rand(2, 7);
    $b = wp_rand(1, 6);
    ob_start(); ?>
    <form class="f tsukon-ajax-form" method="post" action="<?php echo esc_url(admin_url('admin-ajax.php')); ?>">
      <input type="hidden" name="action" value="tsukon_lead">
      <input type="hidden" name="form_type" value="<?php echo esc_attr($type); ?>">
      <input type="hidden" name="captcha_expected" value="<?php echo (int) ($a + $b); ?>">
      <input name="name" placeholder="Имя и компания *" required>
      <input name="phone" placeholder="Телефон *" required>
      <input name="email" type="email" placeholder="Email">
      <input name="area" placeholder="<?php echo $is_owner ? 'Общая площадь объекта (м²)' : 'Требуемая площадь (м²)'; ?>">
      <textarea class="full" name="msg" rows="2" placeholder="<?php echo $is_owner ? 'Адрес объекта, текущая загрузка, состояние сетей' : 'Назначение, электрическая мощность (кВт), сроки'; ?>"><?php echo esc_textarea($msg_val); ?></textarea>
      <div class="full" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        <label style="font-size:13px">Антиспам: сколько будет <?php echo $a . ' + ' . $b; ?>? <input type="number" name="captcha_answer" required style="width:70px;display:inline-block;margin-left:8px"></label>
        <label style="font-size:13px"><input type="checkbox" name="consent" value="1" required style="width:auto;margin-right:6px"> Согласие на обработку ПД (152-ФЗ)</label>
      </div>
      <input class="hp" name="website" tabindex="-1" autocomplete="off">
      <div class="full"><button class="btn" type="submit"><?php echo $is_owner ? 'Передать объект в управление' : 'Отправить заявку'; ?></button></div>
      <div class="full form-result"></div>
    </form>
    <?php
    return ob_get_clean();
}

add_action('wp_ajax_tsukon_lead', 'tsukon_handle_lead');
add_action('wp_ajax_nopriv_tsukon_lead', 'tsukon_handle_lead');
function tsukon_handle_lead() {
    if (!empty($_POST['website'])) wp_send_json_error(['message' => 'Антиспам-блокировка'], 400);
    $exp = (int) ($_POST['captcha_expected'] ?? -1);
    $ans = (int) ($_POST['captcha_answer'] ?? -2);
    if ($exp <= 0 || $exp !== $ans) wp_send_json_error(['message' => 'Неверный ответ на антиспам-проверку'], 400);
    $name = sanitize_text_field($_POST['name'] ?? '');
    $phone = sanitize_text_field($_POST['phone'] ?? '');
    $email = sanitize_email($_POST['email'] ?? '');
    $area = sanitize_text_field($_POST['area'] ?? '');
    $msg = sanitize_textarea_field($_POST['msg'] ?? '');
    $type = sanitize_text_field($_POST['form_type'] ?? 'tenant');
    if (!$name || !$phone) wp_send_json_error(['message' => 'Укажите имя и телефон'], 400);
    $to = get_theme_mod('tsukon_lead_email', '${escapePhpSingle(recipient)}');
    $subject = $type === 'owner' ? 'ЦУКОН: Заявка от собственника' : 'ЦУКОН: Подбор помещения';
    $body = "Имя: $name\\nТелефон: $phone\\nEmail: $email\\nПлощадь: $area\\nКомментарий: $msg\\n";
    wp_mail($to, $subject, $body);
    wp_send_json_success(['message' => 'Заявка отправлена на ' . $to]);
}

// 7. Настройки Customizer (Яндекс.Метрика, Email, Лимит)
add_action('customize_register', function ($wp_customize) {
    $wp_customize->add_section('tsukon_settings', ['title' => 'Настройки ЦУКОН (Метрика, Лимит, Почта)']);
    $wp_customize->add_setting('tsukon_ym_id', ['default' => '${escapePhpSingle(ymId)}']);
    $wp_customize->add_control('tsukon_ym_id', ['label' => 'ID счётчика Яндекс.Метрики', 'section' => 'tsukon_settings']);
    $wp_customize->add_setting('tsukon_lead_email', ['default' => '${escapePhpSingle(recipient)}']);
    $wp_customize->add_control('tsukon_lead_email', ['label' => 'Email для заявок', 'section' => 'tsukon_settings']);
    $wp_customize->add_setting('tsukon_free_limit', ['default' => ${freeLimit}]);
    $wp_customize->add_control('tsukon_free_limit', ['label' => 'Лимит свободных помещений на старте (5-7)', 'section' => 'tsukon_settings', 'type' => 'number']);
});

// 8. Динамические Яндекс.Метрика и Schema.org JSON-LD в <head>
add_action('wp_head', function () {
    $ym = preg_replace('/\\D/', '', get_theme_mod('tsukon_ym_id', '${escapePhpSingle(ymId)}'));
    if ($ym) : ?>
    <script>window.TSUKON_YM_ID = <?php echo (int) $ym; ?>;</script>
    <script type="text/javascript">
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
      ym(<?php echo esc_js($ym); ?>,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
    </script>
    <?php endif;

    // Живая разметка Schema.org из единой базы Помещений и FAQ
    $offers = [];
    $rooms = tsukon_query_rooms(['status' => 'free']);
    while ($rooms->have_posts()) : $rooms->the_post();
        $d = tsukon_get_room_data(get_the_ID());
        $offers[] = [
            '@type' => 'Offer',
            'name' => get_the_title() . ' (' . $d['area'] . ' м²)',
            'price' => (string) $d['price'],
            'priceCurrency' => 'RUB',
            'availability' => 'https://schema.org/InStock',
        ];
    endwhile; wp_reset_postdata();

    $faq_entities = [];
    $faqs = new WP_Query(['post_type' => 'tsukon_faq', 'posts_per_page' => -1]);
    while ($faqs->have_posts()) : $faqs->the_post();
        $faq_entities[] = [
            '@type' => 'Question',
            'name' => get_the_title(),
            'acceptedAnswer' => ['@type' => 'Answer', 'text' => wp_strip_all_tags(get_the_content())],
        ];
    endwhile; wp_reset_postdata();

    $graph = [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'RealEstateAgent',
                'name' => '${escapePhpSingle(state.settings.contacts.companyName)}',
                'url' => home_url('/'),
                'telephone' => '${escapePhpSingle(state.settings.contacts.phoneDisplay)}',
                'email' => '${escapePhpSingle(state.settings.contacts.email)}',
                'hasOfferCatalog' => ['@type' => 'OfferCatalog', 'name' => 'Помещения ЦУКОН', 'itemListElement' => $offers],
            ],
            [
                '@type' => 'FAQPage',
                'mainEntity' => $faq_entities,
            ],
        ],
    ];
    echo '<script type="application/ld+json">' . wp_json_encode($graph, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>' . "\\n";
});
`;

  return {
    ...templates,
    'tsukon-theme/functions.php': functionsPhp,
  };
}

export function buildWordPressWxrXml(state: CmsState): string {
  const items: string[] = [];

  for (const obj of state.objects) {
    const wpId = 1000 + obj.id;
    const wpPhoto = mapAssetToWpRelative(obj.image);
    items.push(`  <item>
    <title>${escapeXml(obj.name)}</title>
    <wp:post_id>${wpId}</wp:post_id>
    <wp:post_type>tsukon_object</wp:post_type>
    <wp:status>publish</wp:status>
    <content:encoded><![CDATA[${obj.description}]]></content:encoded>
    <wp:postmeta><wp:meta_key>_tsukon_source_id</wp:meta_key><wp:meta_value><![CDATA[${obj.id}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_address</wp:meta_key><wp:meta_value><![CDATA[${obj.address}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_utilities</wp:meta_key><wp:meta_value><![CDATA[${obj.utilities}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_security</wp:meta_key><wp:meta_value><![CDATA[${obj.security}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_lat</wp:meta_key><wp:meta_value><![CDATA[${obj.lat}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_lng</wp:meta_key><wp:meta_value><![CDATA[${obj.lng}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_photo_url</wp:meta_key><wp:meta_value><![CDATA[${wpPhoto}]]></wp:meta_value></wp:postmeta>
  </item>`);
  }

  for (const room of state.rooms) {
    const wpId = 2000 + room.id;
    const parentWpId = 1000 + room.objectId;
    const wpPhoto = mapAssetToWpRelative(room.image);
    items.push(`  <item>
    <title>${escapeXml(room.title)}</title>
    <wp:post_id>${wpId}</wp:post_id>
    <wp:post_type>tsukon_room</wp:post_type>
    <wp:status>publish</wp:status>
    <content:encoded><![CDATA[${ROOM_PURPOSE_LABELS[room.purpose]}, ${room.area} м², ${room.pricePerSqm} ₽/м² в мес. Статус: ${ROOM_STATUS_LABELS[room.status]}. ${room.leaseTerms}]]></content:encoded>
    <wp:postmeta><wp:meta_key>_tsukon_object_id</wp:meta_key><wp:meta_value><![CDATA[${parentWpId}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_object_source_id</wp:meta_key><wp:meta_value><![CDATA[${room.objectId}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_area</wp:meta_key><wp:meta_value><![CDATA[${room.area}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_price</wp:meta_key><wp:meta_value><![CDATA[${room.pricePerSqm}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_purpose</wp:meta_key><wp:meta_value><![CDATA[${room.purpose}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_status</wp:meta_key><wp:meta_value><![CDATA[${room.status}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_features</wp:meta_key><wp:meta_value><![CDATA[${room.features.join(', ')}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_lease_terms</wp:meta_key><wp:meta_value><![CDATA[${room.leaseTerms}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_featured</wp:meta_key><wp:meta_value><![CDATA[${room.featuredOnStart ? '1' : '0'}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_photo_url</wp:meta_key><wp:meta_value><![CDATA[${wpPhoto}]]></wp:meta_value></wp:postmeta>
  </item>`);
  }

  for (const res of state.residents) {
    const wpId = 3000 + res.id;
    const parentWpId = 1000 + res.objectId;
    items.push(`  <item>
    <title>${escapeXml(res.name)}</title>
    <wp:post_id>${wpId}</wp:post_id>
    <wp:post_type>tsukon_resident</wp:post_type>
    <wp:status>publish</wp:status>
    <content:encoded><![CDATA[${res.description}]]></content:encoded>
    <wp:postmeta><wp:meta_key>_tsukon_object_id</wp:meta_key><wp:meta_value><![CDATA[${parentWpId}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_object_source_id</wp:meta_key><wp:meta_value><![CDATA[${res.objectId}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_industry</wp:meta_key><wp:meta_value><![CDATA[${res.industry}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_since_year</wp:meta_key><wp:meta_value><![CDATA[${res.sinceYear}]]></wp:meta_value></wp:postmeta>
  </item>`);
  }

  for (const faq of state.faqs) {
    const wpId = 4000 + faq.id;
    items.push(`  <item>
    <title>${escapeXml(faq.question)}</title>
    <wp:post_id>${wpId}</wp:post_id>
    <wp:post_type>tsukon_faq</wp:post_type>
    <wp:status>publish</wp:status>
    <content:encoded><![CDATA[${faq.answer}]]></content:encoded>
    <wp:postmeta><wp:meta_key>_tsukon_category</wp:meta_key><wp:meta_value><![CDATA[${faq.category}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key>_tsukon_ai_priority</wp:meta_key><wp:meta_value><![CDATA[${faq.isPriorityAi ? '1' : '0'}]]></wp:meta_value></wp:postmeta>
  </item>`);
  }

  const wpPages: Array<{ id: number; slug: string; title: string; template: string; content: string }> = [
    { id: 5001, slug: 'home', title: 'Главная', template: '', content: state.pages.homeHeroLead },
    { id: 5002, slug: 'objects', title: 'Объекты и помещения', template: 'page-objects.php', content: '' },
    { id: 5003, slug: 'tenants', title: 'Арендаторам', template: 'page-tenants.php', content: state.pages.tenantsIntro },
    { id: 5004, slug: 'owners', title: 'Собственникам', template: 'page-owners.php', content: state.pages.ownersIntro },
    { id: 5005, slug: 'residents', title: 'Резиденты', template: 'page-residents.php', content: state.pages.residentsIntro },
    { id: 5006, slug: 'about', title: 'О компании', template: 'page-about.php', content: state.pages.aboutStatement },
    { id: 5007, slug: 'faq', title: 'Вопросы и ответы (FAQ)', template: 'page-faq.php', content: '' },
    { id: 5008, slug: 'contacts', title: 'Контакты', template: 'page-contacts.php', content: '' },
    { id: 5009, slug: 'privacy-policy', title: 'Политика обработки персональных данных', template: 'page-privacy.php', content: state.pages.privacyText },
    {
      id: 5010,
      slug: 'guide-production',
      title: 'Производственные помещения в Саранске',
      template: 'page-guide.php',
      content:
        'Прямая аренда производственных цехов в Саранске от УК ЦУКОН: точные площади, электричество до 350 кВт, газ, кран-балки и ставки без посредников.',
    },
    {
      id: 5011,
      slug: 'guide-warehouses',
      title: 'Склады, офисы и площадки для грузового транспорта',
      template: 'page-guide.php',
      content:
        'Отапливаемые складские боксы, офисные блоки и асфальтированные площадки под еврофуры в Саранске с круглосуточной охраной.',
    },
    {
      id: 5012,
      slug: 'guide-utilities',
      title: 'Коммуникации, обслуживание и охрана объектов ЦУКОН',
      template: 'page-guide.php',
      content:
        'Электроснабжение до 350 кВт, газ, отопление, КПП 24/7 и эксплуатационная служба управляющей компании ЦУКОН.',
    },
    {
      id: 5013,
      slug: 'guide-terms',
      title: 'Условия аренды, точные площади и стоимость помещений',
      template: 'page-guide.php',
      content:
        'Полная сводка характеристик по всем объектам ЦУКОН в г. Саранске: назначение, точный метраж, стоимость за м² и статус.',
    },
  ];

  for (const pg of wpPages) {
    items.push(`  <item>
    <title>${escapeXml(pg.title)}</title>
    <wp:post_id>${pg.id}</wp:post_id>
    <wp:post_name>${pg.slug}</wp:post_name>
    <wp:post_type>page</wp:post_type>
    <wp:status>publish</wp:status>
    <content:encoded><![CDATA[${pg.content}]]></content:encoded>
    ${pg.template ? `<wp:postmeta><wp:meta_key>_wp_page_template</wp:meta_key><wp:meta_value><![CDATA[${pg.template}]]></wp:meta_value></wp:postmeta>` : ''}
  </item>`);
  }

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
<channel>
  <title>${escapeXml(state.settings.contacts.companyName)}</title>
  <link>https://${escapeXml(state.settings.contacts.domain)}</link>
  <description>Экспорт связанных объектов, помещений, резидентов, FAQ и страниц ЦУКОН для WordPress</description>
  <language>ru-RU</language>
  <wp:wxr_version>1.2</wp:wxr_version>
${items.join('\n')}
</channel>
</rss>
`;
}
