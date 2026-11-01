#!/usr/bin/env bash
# Перегенерировать sitemap.xml с живым lastmod.
#
# Почему lastmod = дата запуска, а не дата последнего контентного коммита файла:
# GitHub Pages отдаёт HTTP-заголовок Last-Modified одинаковым для всех URL сайта.
# Это дата последнего коммита в ветке main целиком, а не per-file mtime (проверено
# curl -I на / и /belye-spiski/ и /sitemap.xml: все три показывали одну и ту же
# секунду). Значит единственный lastmod, который не разъедется с тем, что реально
# увидит краулер, это дата коммита, которым пушится этот sitemap.
#
# Запускать последним шагом перед `git add`/`git commit`, чтобы sitemap.xml ушёл
# в тот же коммит, который выставит этот Last-Modified на проде.
#
# Дата берётся в московском времени (часовой пояс проекта: коммиты в этом репо
# и даты на самом лендинге живут в MSK), а не в UTC: иначе возле полуночи
# sitemap на день расходится с тем, что написано в видимом тексте страницы.
#
# Каждая страница живёт парой RU/EN. У обеих в sitemap по три hreflang-ссылки
# (ru, en и x-default на русский адрес): без них поисковик не свяжет версии.
set -euo pipefail
cd "$(dirname "$0")/.."

TODAY="$(TZ=Europe/Moscow date +%Y-%m-%d)"

# Формат: ru-адрес<TAB>en-адрес<TAB>priority ru<TAB>priority en.
# Добавлять новые страницы сюда же.
PAGES=$'https://noirvpn.org/\thttps://noirvpn.org/en/\t1.0\t0.9\nhttps://noirvpn.org/belye-spiski/\thttps://noirvpn.org/en/whitelists/\t0.8\t0.7'

# Один <url>: адрес страницы, пара ru/en для hreflang, priority.
emit() {
  local loc="$1" ru="$2" en="$3" priority="$4"
  echo '  <url>'
  echo "    <loc>${loc}</loc>"
  echo "    <xhtml:link rel=\"alternate\" hreflang=\"ru\" href=\"${ru}\"/>"
  echo "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"${en}\"/>"
  echo "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"${ru}\"/>"
  echo "    <lastmod>${TODAY}</lastmod>"
  echo "    <priority>${priority}</priority>"
  echo '  </url>'
}

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
  echo '        xmlns:xhtml="http://www.w3.org/1999/xhtml">'
  while IFS=$'\t' read -r ru en p_ru p_en; do
    emit "$ru" "$ru" "$en" "$p_ru"
    emit "$en" "$ru" "$en" "$p_en"
  done <<< "$PAGES"
  echo '</urlset>'
} > sitemap.xml

echo "sitemap.xml -> lastmod ${TODAY}"
