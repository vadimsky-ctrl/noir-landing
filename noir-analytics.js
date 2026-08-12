/* Noir landing — метка кампании и события кликов.
 *
 * Зачем: экран «Источники» в админке строит воронку по `users.source`, а метку
 * туда кладёт payload диплинка (`t.me/NoirVPN_bot?start=<метка>`). До этого файла
 * во всех ссылках лендинга был зашит `lp`, поэтому три кампании подряд слипались
 * в одну строку и понять, какая из них привела платящих, было нельзя.
 *
 * Теперь метка собирается из UTM того захода, с которого человек пришёл:
 *   noirvpn.org/?utm_source=tg&utm_campaign=avgust  →  ?start=lp-tg-avgust
 * Короткий вариант для ручных ссылок: ?c=blogger1   →  ?start=blogger1
 *
 * Метка живёт в sessionStorage: человек ходит между страницами лендинга, а UTM
 * остаётся только на первом адресе.
 *
 * Ограничения не наши, а Telegram и бота: payload это [A-Za-z0-9_-] и не длиннее
 * 64 символов (`_SOURCE_SLUG` в `bot/handlers/start.py`). Всё, что не подходит,
 * вычищается здесь, иначе бот запишет источник как `other` и метка пропадёт.
 */
(function () {
  'use strict';

  var KEY = 'noir_src';
  var MAX = 64;
  // Метка страницы: с какой из них человек ушёл в бота. Индекс это `lp`,
  // разбор белых списков `lpb`: эти две страницы продают по-разному, и мешать
  // их в одну строку значит потерять ровно то, ради чего вторая написана.
  var page = /belye-spiski/.test(location.pathname) ? 'lpb' : 'lp';

  function clean(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function fromQuery() {
    var q = new URLSearchParams(location.search);
    var direct = clean(q.get('c'));
    if (direct) return direct.slice(0, MAX);

    var parts = [page, clean(q.get('utm_source')), clean(q.get('utm_campaign'))].filter(Boolean);
    // Только страница и ничего больше: значит UTM не было, и это обычный заход.
    return parts.join('-').slice(0, MAX);
  }

  function slug() {
    var q = new URLSearchParams(location.search);
    var fresh = q.get('c') || q.get('utm_source') || q.get('utm_campaign');
    var stored;
    try {
      stored = sessionStorage.getItem(KEY);
    } catch (e) {
      stored = null;
    }
    // Свежий заход с меткой всегда сильнее запомненного: человек мог вернуться
    // по второй ссылке, и считать его за первую кампанию неправильно.
    if (!fresh && stored) return stored;

    var value = fromQuery();
    try {
      sessionStorage.setItem(KEY, value);
    } catch (e) {
      /* приватный режим: метка проживёт одну страницу, это лучше, чем ошибка */
    }
    return value;
  }

  function retag() {
    var mark = slug();
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (href.indexOf('t.me/NoirVPN_bot') !== -1) {
        links[i].setAttribute('href', 'https://t.me/NoirVPN_bot?start=' + mark);
        links[i].setAttribute('data-noir-cta', 'bot');
      } else if (href.indexOf('id.heynoir.com') !== -1) {
        links[i].setAttribute('href', 'https://id.heynoir.com/?from=' + mark);
        links[i].setAttribute('data-noir-cta', 'cabinet');
      }
    }
    return mark;
  }

  var mark = retag();

  // События кликов. Просмотры страницы считает сам счётчик, а вот доля тех, кто
  // дошёл до кнопки, это и есть верх воронки: с неё начинается всё, что видно
  // на экране источников.
  document.addEventListener(
    'click',
    function (event) {
      var link = event.target.closest ? event.target.closest('a[data-noir-cta]') : null;
      if (!link) return;
      if (window.umami && typeof window.umami.track === 'function') {
        window.umami.track('cta-' + link.getAttribute('data-noir-cta'), {
          source: mark,
          page: page
        });
      }
    },
    true
  );
})();
