# Checklist פרודקשן — נגישות ו-VOD

לפני עלייה ל-production. מקורות: `docs/A11Y-OPERATIONS.md`, `/accessibility`, `.cursor/skills/israeli-accessibility-compliance/`.

---

## 1. משפט ותפעול

- [ ] `.env` production: `A11Y_COORDINATOR_NAME`, `A11Y_CONTACT_PHONE`, `A11Y_CONTACT_PHONE_DISPLAY`
- [ ] `VITE_A11Y_*` מסונכרנים עם ערכי השרver
- [ ] `A11Y_STATEMENT_UPDATED` מעודכן לתאריך פרסום
- [ ] חוות דעת **מורשה נגישות השירות** — שמורה מחוץ ל-repo
- [ ] `A11Y_LAST_AUDIT_DATE` מעודכן אחרי ביקורת
- [ ] SLA פניות: תגובה ראשונית תוך `A11Y_RESPONSE_DAYS` (ברירת מחדל 14)
- [ ] רכז/ת מכיר/ה את פאנל המשפטי (פניות נגישות) באדמין

---

## 2. תוכן

- [ ] כתוביות WebVTT **מלאות** לכל פרק בפרודקשן (לא stubs בלבד)
- [ ] העלאה דרך אדמין/מרצה (`kind=caption`) או החלפת קבצים ב-`public/captions/episodes/`
- [ ] alt משמעותי לתמונות חדשות בהעלאה
- [ ] PDF / מסמכים להורדה — הנגשה לפי ת"י 5568 חלק 2 (אם קיימים)

---

## 3. בדיקות אוטומטיות

```bash
npm run lint
npm run a11y:generate-captions   # אחרי שינוי catalog
npm run dev                      # טרמינל נפרד
npm run a11y:smoke
npm run a11y:audit               # HTML סטטי בלבד — SPA מוגבל
```

- [ ] `lint` — ללא שגיאות
- [ ] `a11y:smoke` — 5/5 PASS
- [ ] `a11y:audit` — ידוע: skip-link/headings נכשלים על shell בלבד; לא מחליף בדיקת דפדפן

---

## 4. בדיקות ידניות (חובה)

### מקלדת
- [ ] `/` — Tab → skip-link → תוכן ראשי
- [ ] `/library` — skip-link → `#library-main`
- [ ] `/accessibility` — skip-link + טופס משוב
- [ ] `Alt+A` — פתיחת ווידג'ט, מתגים, איפוס
- [ ] טאב «מבנה דף» — קפיצה ל-landmarks וכותרות

### קורא מסך (NVDA / VoiceOver)
- [ ] `/`, `/library`, `/accessibility` — כותרות, landmarks, RTL
- [ ] נגן — CC, כפתור כתוביות, מקש `C`

### ויזואלי
- [ ] ניגודיות כהה/בהירה, invert, mono
- [ ] השתקת מדיה בדף watch
- [ ] reduce motion — אנימציות מופחתות

---

## 4b. DB קיים (upgrade)

- [ ] Restart ל-`npm run server` / deploy — מיגרציה מעדכנת `caption_tracks` ל-`/captions/episodes/{id}.vtt`
- [ ] וידוא בנגן: CC מופיע לפרק חינמי ופרימיום (לפי גישה)

---

## 5. מה לא לפרוס

- [ ] **לא** מתקינים «נגיש בקליק», UserWay, accessiBe או overlay דומה
- [ ] **לא** מפעילים תגובות/דירוגים על תכנים (שלב 2)
- [ ] **לא** מוכרים קורס בודד — רק מסלול / מנוי ספרייה

---

## 6. אחרי עלייה

- [ ] בדיקת `/accessibility` ב-production (פרטי רכז, טופס, קישורי footer)
- [ ] ניטור פניות `accessibility_reports` בשבוע הראשון
- [ ] תיעוד תיקונים + עדכון `A11Y_STATEMENT_UPDATED` אם נדרש

---

**אישור:** _______________  **תאריך:** _______________
