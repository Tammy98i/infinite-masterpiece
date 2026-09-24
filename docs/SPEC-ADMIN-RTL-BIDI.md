# דסק אדמין — RTL / BiDi

מערכת ניהול (`/library/admin`) על Vite + React + Tailwind. כיוון המסמך נקבע פעם אחת:

```html
<html lang="he" dir="rtl">
```

אין להוסיף `direction: rtl` על מעטפות פנימיות של הדסק — זה גורם להיפוך כפול ב־Flex/Grid.

## חוזה

| נושא | כלל |
| --- | --- |
| Logical CSS | `ps/pe/ms/me/start/end/border-s/e` — לא `pl/pr/left/right` |
| סיידבר | `border-e` בין ניווט לתוכן (inline-end פונה לתוכן ב־RTL) |
| אייקונים כיווניים | מחלקת `.icon-dir` ב־`HebrewRtl.css` |
| אייקונים אבסולוטיים | Search / Play / Check — בלי שיקוף |
| אימייל / טלפון / URL | `<Bidi kind="email\|phone\|url">` או `input[type=email\|tel\|url]` |
| שדות טקסט מעורבים | `.crm-desk-field` + `unicode-bidi: plaintext` |
| קיצורי מקלדת | `<kbd class="crm-desk-hotkey">` |

## קבצים

- `src/styles/HebrewRtl.css` — תשתית אתר
- `src/styles/CrmDesk.css` — שכבת דסק
- `src/components/Bidi.tsx` — `<bdi dir="ltr">`
- `src/utils/bidi.ts` — המרת utilities + `isolateLtr`

## בדיקות ידניות

1. טבלת מסלולים: שם עברי + אימייל LTR באותה שורה — הסימן `@` לא «קופץ».
2. כרטיס דק: טלפון ישראלי `05x-…` ליד תווית «טלפון» בעברית.
3. סיידבר: קו ההפרדה בין ניווט לתוכן נשאר בין העמודות (לא בקצה החיצוני).
