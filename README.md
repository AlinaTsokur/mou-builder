# MOU Builder

Локальное веб-приложение для подготовки MOU из Google Docs-шаблона и данных Google Sheets.

## Локальный запуск

1. Скопируйте `.env.example` в `.env.local`.
2. Заполните `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` и рабочий домен в `GOOGLE_ALLOWED_DOMAIN`.
3. В Google Cloud OAuth app добавьте redirect URL:
   `http://localhost:3000/api/auth/callback/google`
4. Запустите:

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3000`.

## Deploy на Vercel

После публикации на Vercel нужно добавить production URL в тот же OAuth client в Google Cloud:

- Authorized JavaScript origins: `https://your-app.vercel.app`
- Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

В Vercel Environment Variables нужно перенести те же значения из `.env.local`, но заменить:

```env
NEXTAUTH_URL=https://your-app.vercel.app
```

`GOOGLE_ALLOWED_DOMAIN=primebridge.estate` оставляется таким же. Для стабильной работы лучше использовать один постоянный Vercel domain или custom domain; если использовать preview URLs, их тоже придется отдельно добавлять в Google OAuth redirect URIs.

## Google scopes

Приложение запрашивает доступ к Google Drive, Docs и Sheets, чтобы читать справочники, копировать шаблон, заменять плейсхолдеры и записывать лог.

## RULES

Если в таблице есть лист `RULES`, приложение прочитает его. Если листа нет, используются встроенные правила текущего Apps Script для статей 6, 7, 8, 9 и 18.

Рекомендуемые колонки:

`rule_id`, `target_type`, `target_key`, `label`, `default_enabled`, `condition_field`, `operator`, `condition_value`, `action`, `notes`

Готовые стартовые строки лежат в `rules-template.csv`. Создайте лист `RULES` в Google Sheet и вставьте туда содержимое этого файла, когда у аккаунта будут права на редактирование таблицы.
