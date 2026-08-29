export function hebrewAuthError(message: string) {
  const text = message.toLowerCase();
  if (
    text.includes('failed to fetch') ||
    text.includes('networkerror') ||
    text.includes('network request failed') ||
    text.includes('load failed') ||
    text.includes('network error')
  ) {
    return 'לא הצלחנו להתחבר לשירות ההתחברות. בדקו את הרשת ונסו שוב.';
  }
  if (text.includes('invalid login credentials') || text.includes('invalid credentials')) {
    return 'אימייל או סיסמה שגויים';
  }
  if (text.includes('email not confirmed')) {
    return 'יש לאשר את החשבון דרך האימייל שנשלח אליכם';
  }
  if (text.includes('user already registered') || text.includes('already registered')) {
    return 'כבר קיים חשבון עם האימייל הזה';
  }
  if (text.includes('password should be at least') || text.includes('password is known to be weak')) {
    return 'הסיסמה חייבת להיות לפחות 8 תווים';
  }
  if (text.includes('unable to validate email') || text.includes('invalid format')) {
    return 'נא להזין אימייל תקין';
  }
  if (text.includes('signup requires a valid password')) {
    return 'נא להזין סיסמה';
  }
  if (text.includes('too many requests') || text.includes('rate limit')) {
    return 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות';
  }
  if (text.includes('provider is not enabled') || text.includes('unsupported provider')) {
    if (text.includes('phone')) return 'הרשמה בטלפון עדיין לא הופעלה ב-Supabase';
    return 'התחברות עם Google עדיין לא הופעלה ב-Supabase';
  }
  if (text.includes('otp') && (text.includes('expired') || text.includes('token has expired'))) {
    return 'הקוד פג תוקף. שלחו קוד חדש';
  }
  if (text.includes('invalid otp') || text.includes('token not found') || text.includes('otp_disabled')) {
    return 'הקוד שגוי. בדקו את ההודעה ונסו שוב';
  }
  if (text.includes('invalid phone') || text.includes('phone number')) {
    return 'נא להזין מספר בפורמט בינלאומי, למשל +972501234567';
  }
  if (text.includes('new password should be different') || text.includes('same password')) {
    return 'הסיסמה החדשה חייבת להיות שונה מהקודמת';
  }
  if (text.includes('unable to send') && text.includes('email')) {
    return 'לא הצלחנו לשלוח את מייל האיפוס. נסו שוב בעוד רגע';
  }
  if (text.includes('signups not allowed') || text.includes('signup is disabled')) {
    return 'אין חשבון עם הטלפון הזה. הירשמו קודם';
  }
  if (text.includes('sms') && (text.includes('error') || text.includes('failed'))) {
    return 'שליחת ה-SMS נכשלה. בדקו את מספר הטלפון או נסו שוב בעוד רגע';
  }
  return message || 'הבקשה נכשלה';
}
