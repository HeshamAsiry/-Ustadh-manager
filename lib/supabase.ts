import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = "https://tzbafipmzhsjzziqcxoa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GNXLzI9Ft0R6w8seT7DfdQ_TlPEOUUx";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;

export const supabase = createBrowserClient(url, key);
