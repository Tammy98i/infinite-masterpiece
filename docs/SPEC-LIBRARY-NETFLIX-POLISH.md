# פוליש ספרייה + אדמין — סקיצה

איור לפני ביצוע. לא קוד ב־`src/` עד «קדימה». לא מוחקים פיצ׳רים — רק צפיפות, רדיוס, היררכיה וסריקה.

לוח: [`library-netflix/polish-sketch.html`](library-netflix/polish-sketch.html)

ממשיך את [`SPEC-LIBRARY-NETFLIX-UX.md`](SPEC-LIBRARY-NETFLIX-UX.md) (אם קיים בענף המוצר) / סקיצת הבסיס.

## גבולות

- ספרייה ≠ מסע / 88.
- בלי שלב 2 (תגובות / AI).
- כל הקישורים, bulk, פילטרים ו־23 טאבים נשארים.
- זהב = accent; CTA ראשי לבן 4px.

## 12 שכבות הפוליש

### ספרייה

| # | נושא | היום | סקיצה |
| --- | --- | --- | --- |
| 01 | Hover בפס | `scale` נחתך ב־`overflow-x` | padding אנכי / overflow חופשי בשורת hover |
| 02 | חיצי פס | `rounded-full` | 4px |
| 03 | המשך צפייה | Play קבוע + Play hover | Play אחד (hover / progress) |
| 04 | מטא hover | כולל «פתוח» | רק `טעימה` / `נעול` |
| 05 | Plan strip CTA | זהב `rounded-full` | לבן 4px כמו הכרזה |
| 06 | נושאים | מונה מוסתר | מונה גלוי + underline פעיל בנאב |
| 07 | כותרת ריק | אייקון זהב / קישור zinc | אותה שפת 4px כמו EmptyState |
| 08 | StartHere בריק | מתחרה ב־CTA | פס שקט / מקווקו מתחת לפאנל |

### אדמין

| # | נושא | היום | סקיצה |
| --- | --- | --- | --- |
| 09 | סקירה | `CrmCatalogStage` מלא | באנר קצר + 4 מדדים מיד מתחת |
| 10 | Play בדסק | עגול | 4px כמו ספרייה |
| 11 | Chip סטטוס | אחיד | גבול/צבע לפי פורסם / טיוטה / חסום |
| 12 | אנליטיקות | מדדים שטוחים + id גולמי | `em` יחס משפך + כותרת קריאה בפיד |

## טוקנים

| טוקן | ערך |
| --- | --- |
| רדיוס | `4px` |
| זהב | `#b79043` / `#dfc47d` |
| navy | `rgba(5, 10, 20, 0.55–0.72)` |
| ok / block | `#9be7b5` / `#f7b4b4` (chip בלבד) |

## מיגרציה (מולס במוצר)

1. `CourseCard` / rail scroller — overflow + continue play + meta.
2. Plan strip / rail arrows — 4px.
3. `TopicsGrid` + `Navbar` — מונה + active.
4. `MyListView` / `HistoryView` — כותרת + StartHere quiet.
5. `OverviewPanel` — באנר מקוצר (`CrmCatalogStage` compact).
6. `ContentPanel` chips · `AnalyticsPanel` funnel ratios + feed labels.

יישום: ענף `cursor/library-netflix-ship-6dc7`.

## כלל הזהב

כל מה שנשאר — נשאר. מה שמשתנה הוא חיתוך hover, כפילות Play, רדיוס, משקל סטטוס והיררכיית סקירה.
