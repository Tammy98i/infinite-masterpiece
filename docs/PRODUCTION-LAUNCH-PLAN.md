# תוכנית השקה — 3 שבועות

מסמך עבודה ממוספר מהמצב הנוכחי (~85% קוד) ל-production מלא (~100%).

**עקרון:** מסלול 8888 (אמיצים/הססנים) ≠ מנוי ספרייה. Paywall ודף `/library-membership` מפרידים ביניהם.

---

## שבוע 1 — תשתית + פיילוט סגור

### יום 1–2: תשתית
- [ ] Git init + remote + `.gitignore` (כולל `.env`)
- [ ] Hosting: frontend (Vercel/Cloudflare) + API (Node)
- [ ] Domain + SSL + `APP_URL` production
- [ ] DB: SQLite → Postgres (או managed) + backup יומי
- [ ] S3/R2: `S3_*` + העברת uploads/וידאו
- [ ] Secrets: כל משתני `.env.example`

### יום 3–4: תוכן מינימלי
- [ ] 5–10 הרצאות אמיתיות (וידאו, cover, תיאור)
- [ ] שיבוץ `programWeek` באדמין (Readiness)
- [ ] תמונות מייסדים אמיתיות
- [ ] `npm run a11y:generate-captions` + VTT מלא לפרקי פיילוט

### יום 5: משפט ונגישות
- [ ] רכז/ת + טלפון ב-`.env`
- [ ] תקנון הגרלות — `raffle_terms_approved` באדמין
- [ ] [`PRODUCTION-A11Y-CHECKLIST.md`](./PRODUCTION-A11Y-CHECKLIST.md) — בדיקות ידניות
- [ ] Smoke: `npm run lint` + `a11y:smoke`

### יום 6–7: פיילוט פנימי
- [ ] 5–10 משתמשי בета
- [ ] מצב `pilot_manual`: אדמין פותח מנוי / מסלול ידנית
- [ ] תיעוד באגים + תיקון קריטי

**יעד שבוע 1:** אתר על domain, ספרייה עם תוכן אמיתי, פיילוט ללא Stripe (או Stripe test).

---

## שבוע 2 — סליקה + מנוי ספרייה

### Stripe — מסלול כניסה (8888)
- [ ] `STRIPE_SECRET_KEY` + webhook production
- [ ] בדיקת אמיצים: תשלום מלא
- [ ] בדיקת הססנים: 8 → 80 → 800 → 8000 + `processDueInstallments`
- [ ] גישת VOD לפי `currentPaymentPhase` / `programWeek`

### Stripe — מנוי ספרייה (חדש)
- [ ] Products: `monthly` + `annual` (מחירים שיווקיים — להחליט)
- [ ] Checkout session נפרד מ-track checkout (`/api/checkout/library-session`)
- [ ] Webhook: עדכון `subscription_plan` + `subscription_started`
- [ ] דף `/library-membership` — מחירים אמיתיים + redirect ל-Stripe
- [ ] **לא** לערבב CTA של מסלול 8888 באותו checkout

### Paywall (לפי אפיון)
- [ ] «פתיחת גישה עכשיו» → `/library-membership`
- [ ] «בדיקת התאמה» → `/pricing`
- [ ] «לא עכשיו» → סגירה

### נבחרת 88
- [ ] תהליך: מועמדות → סקירה → `premium_88` באדמין
- [ ] אימייל/הודעה למועמד (ידני בשלב זה)

**יעד שבוע 2:** תשלום end-to-end (מסלול + מנוי ספרייה), Paywall נכון.

---

## שבוע 3 — השקה + משפט מלא

### תוכן מלא
- [ ] כל הרצאות launch + כיתוביות VTT מלאות
- [ ] קבצים נלווים (PDF מונגשים — ת"י 5568 חלק 2)
- [ ] QA נגן: CC, next chapter, mobile

### משפט
- [ ] חוות דעת מורשה נגישות
- [ ] עדכון `A11Y_LAST_AUDIT_DATE`
- [ ] Terms / Privacy — אישור עו"ד סופי
- [ ] SLA פניות נגישות — מענה ראשון ≤ 14 יום

### תפעול
- [ ] Runbook: [`A11Y-OPERATIONS.md`](./A11Y-OPERATIONS.md)
- [ ] אדמין: מי מטפל ב-leads / payments / premium88 / a11y
- [ ] ניטור: לוגים + (אופציונלי) Sentry

### Go-live
- [ ] [`PRODUCTION-A11Y-CHECKLIST.md`](./PRODUCTION-A11Y-CHECKLIST.md) — הכל מסומן
- [ ] Stripe live keys (לא test)
- [ ] Announce + ניטור 48 שעות

**יעד שבוע 3:** production 100% — תוכן, תשלום, משפט, תפעול.

---

## מה **לא** בשלושת השבועות (שלב 2)

תגובות · שאלות למרצה · AI · Pods · gamification · אפליקציה · מייל/וואטסאפ אוטומטי · Revenue Share

---

## מדדי הצלחה

| מדד | יעד |
|-----|-----|
| Playback | session + CC על 100% פרקי launch |
| Conversion | paywall → library-membership / pricing מדיד |
| Payments | 0 כשלונות webhook לא מטופלים |
| A11y | checklist + חוות דעת |
| Support | פניות נגישות ≤ 14 יום |

---

## סיכום פערים שסגרנו בקוד (הסession האחרון)

- דף **`/library-membership`** — מנוי ספרייה נפרד ממסלול 8888
- Paywall — 3 כפתורים לפי אפיון (במקום «בחירת מסלול» בלבד)
- מסמך תוכנית זה + checklist קיים

## עדיין פתוח (שבוע 2 בקוד)

- Stripe checkout למנוי חודשי/שנתי (כרגע trial + pilot manual)
