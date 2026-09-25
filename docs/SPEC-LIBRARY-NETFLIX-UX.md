# ספרייה + אדמין — נטפליקס אקדמי

איור + יישום מוצר. לא מוחקים אף מסך, קישור, bulk, פילטר או פעולה — רק חושך, כרום, צפיפות, ריק ו־hover.

לוח אינטראקטיבי: [`library-netflix/sketch.html`](library-netflix/sketch.html)

## גבולות

- ספרייה ≠ מסע / 88. CTA ספרייה לא על דף המסע.
- בלי שלב 2: תגובות, שאלות למרצה, AI, Revenue Share, אפליקציה, gamification.
- מייסד = `is_founder`. קפטן = `pod_role`.
- הססנים: 8 → 80 → 800 → 8,000.
- RTL / BiDi לפי [`SPEC-ADMIN-RTL-BIDI.md`](SPEC-ADMIN-RTL-BIDI.md).
- כרום CRM: [`SPEC-ADMIN-NETFLIX-DESK.md`](SPEC-ADMIN-NETFLIX-DESK.md).

## ספרייה ציבורית

| # | שכבה | יישום |
| --- | --- | --- |
| 01 | ווילים | `SkyBackdrop` + `LibraryCatalog.css` — `a–e` + `f` תחתון / `g` צד / `h` רדיאלי; brightness מכויל |
| 02 | כרזה | `HeroBanner` — eyebrow קולנועי; מטא בלי שפת מנוי; progress 4px; CTA לבן/אפור |
| 03 | פסים | `CourseCard` — hover מטא + play 4px + list 4px; באדג׳ נעול שקט; FlowPolish בלי זכוכית על rails |
| 04 | ריקים | `EmptyState` / skeleton / error — כרום 4px; My List / History / Search / Category / Shorts |
| 05 | ניווט | `Navbar` — קישור «נושאים» → `#topics-heading`; כל הקישורים נשארים |

## אדמין

| מסך | יישום |
| --- | --- |
| סקירה | `CrmCatalogStage` + `crm-desk-metric`; skeleton טעינה |
| תכני VOD | `crm-desk-table` + thumb/מונוגרם + chip סטטוס + bulk `crm-desk-panel` + פעולות `crm-desk-row-act` |
| אנליטיקות | משפך / צפייה / מרצים כ־`crm-desk-metric`; טבלה + פיד עם `DeskMonogram` |

## חוזה ווילים

1. `SkyBackdrop` לכל האתר.
2. תחת `/library` (`.vod-app`): library veils `a–h` פעילים.
3. תחת `.crm-desk`: library veils כבויים; CRM veils נשארים.
4. FlowPolish: בלי radial glass על rails; plan-strip / quick-action שטוחים 4px.

## טוקנים

| טוקן | ערך |
| --- | --- |
| זהב | `#b79043` / `#dfc47d` |
| navy | `rgba(5, 10, 20, 0.55–0.72)` |
| רדיוס | `4px` |
| CTA ראשי | לבן; זהב = accent / progress |

## כלל הזהב

כל מה שנשאר — נשאר. מה שמשתנה הוא חושך, שקיפות, רדיוס, hover וריקים.
