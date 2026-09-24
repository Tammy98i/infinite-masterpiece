# CRM Netflix desk — אפיון מוצר

שפת **ספריית נטפליקס האקדמית** על דסק ה־CRM: שמיים משותפים + ווילי CRM + כרום 4px שקוף. בלי מחיקת טאבים.

לוח אינטראקטיבי (ארכיון סקיצה): [`crm-netflix/sketch.html`](crm-netflix/sketch.html)

## חמש שכבות (במוצר)

| # | שכבה | יישום |
| --- | --- | --- |
| 01 | חושך מעל התמונה | ווילי CRM `a–h` ב־`SkyBackdrop` + `CrmDesk.css`; library veils כבויים תחת `.crm-desk` |
| 02 | כרום נטפליקס | `.crm-desk-panel` / `.crm-desk-table` / מיגרציית `glass` ו־`#0a0a0a` |
| 03 | סקירה | `CrmCatalogStage` + `.crm-desk-metric` (plan-strip) |
| 04 | שורת אדם | `DeskMonogram` + `.crm-desk-who` + `.crm-desk-title-card` |
| 05 | כל הטאבים | 23 נשארים; `AsideVeils` גם למרצה |

## חוזה ווילים

1. `SkyBackdrop` משרת את כל האתר.
2. תחת `.crm-desk`:
   - library veils **כבויים** (`display: none`)
   - CRM veils `a–e` מכוילים + `f` תחתון / `g` צד סיידבר / `h` רדיאלי מרכז
3. `.crm-desk-stage` על `main` — stage veil קל.
4. `/library` לא משתנה.

## טוקנים

| טוקן | ערך |
| --- | --- |
| זהב | `#b79043` / `#dfc47d` |
| navy שקוף | `rgba(5, 10, 20, 0.55–0.72)` |
| רדיוס | `4px` |
| גבול | `rgba(255,255,255,0.12)` |

## כלל הזהב

כל מה שנשאר — נשאר. מה שמשתנה הוא חושך, שקיפות ושפת כרום.

## גבולות

- ספרייה ≠ מסע / 88.
- הססנים 8→80→800→8,000.
- מייסד = `is_founder`. קפטן = `pod_role`.
- בלי תגובות / AI / שלב 2.

## RTL / BiDi

חוזה מ־[`SPEC-ADMIN-RTL-BIDI.md`](SPEC-ADMIN-RTL-BIDI.md) נשמר.
