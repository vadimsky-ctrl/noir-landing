#!/usr/bin/env bash
# Перегенерировать sitemap.xml с живым lastmod.
#
# Почему lastmod = дата запуска, а не дата последнего контентного коммита файла:
# GitHub Pages отдаёт HTTP-заголовок Last-Modified одинаковым для всех URL сайта —
# это дата последнего коммита в ветке main целиком, а не per-file mtime (проверено
# curl -I на / и /belye-spiski/ и /sitemap.xml: все три показывали одну и ту же
# секунду). Значит единственный lastmod, который не разъедется с тем, что реально
# увидит краулер, это дата коммита, которым пушится этот sitemap.
#
# Запускать последним шагом перед `git add`/`git commit`, чтобы sitemap.xml ушёл
# в тот же коммит, который выставит этот Last-Modified на проде.
#
# Дата берётся в московском времени (часовой пояс проекта: коммиты в этом репо
# и даты на самом лендинге живут в MSK), а не в UTC — иначе возле полуночи
# sitemap на день расходится с тем, что написано в видимом тексте страницы.
set -euo pipefail
cd "$(dirname "$0")/.."

TODAY="$(TZ=Europe/Moscow date +%Y-%m-%d)"

# Формат: url<TAB>priority. Добавлять новые страницы сюда же.
URLS=$'https://noirvpn.org/\t1.0\nhttps://noirvpn.org/belye-spiski/\t0.8'

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  while IFS=$'\t' read -r loc priority; do
    echo '  <url>'
    echo "    <loc>${loc}</loc>"
    echo "    <lastmod>${TODAY}</lastmod>"
    echo "    <priority>${priority}</priority>"
    echo '  </url>'
  done <<< "$URLS"
  echo '</urlset>'
} > sitemap.xml

echo "sitemap.xml -> lastmod ${TODAY}"
