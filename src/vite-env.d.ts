/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_A11Y_COORDINATOR_NAME?: string;
  readonly VITE_A11Y_CONTACT_EMAIL?: string;
  readonly VITE_A11Y_CONTACT_PHONE?: string;
  readonly VITE_A11Y_CONTACT_PHONE_DISPLAY?: string;
  readonly VITE_A11Y_LAST_AUDIT_DATE?: string;
  readonly VITE_A11Y_STATEMENT_UPDATED?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_ADMIN_EMAILS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
