import { supabase } from '@/lib/supabase';
import { HOME_CONTENT, type HomeContentData } from '@/config/homeContent';

// المحتوى المحفوظ من الأدمن بيتخزن في جدول settings تحت المفتاح ده
const KEY = 'home_content';

function merge(saved: Partial<HomeContentData> | null): HomeContentData {
  if (!saved) return HOME_CONTENT;
  return {
    ...HOME_CONTENT,
    ...saved,
    strip: { ...HOME_CONTENT.strip, ...(saved.strip ?? {}) },
    savings: saved.savings ?? HOME_CONTENT.savings,
    why: HOME_CONTENT.why,
  };
}

export async function fetchHomeContent(): Promise<HomeContentData> {
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', KEY).maybeSingle();
    const raw = (data as { value?: unknown } | null)?.value;
    if (!raw) return HOME_CONTENT;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return merge(parsed as Partial<HomeContentData>);
  } catch {
    return HOME_CONTENT;
  }
}

export async function saveHomeContent(content: HomeContentData): Promise<void> {
  const value = JSON.stringify(content);
  const { data: existing, error: readErr } = await supabase
    .from('settings')
    .select('key')
    .eq('key', KEY)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  const res = existing
    ? await supabase.from('settings').update({ value }).eq('key', KEY)
    : await supabase.from('settings').insert({ key: KEY, value });
  if (res.error) throw new Error(res.error.message);
}

// رفع صورة أو فيديو لنفس الـ bucket بتاع المنتجات (مجلد home)
export async function uploadHomeMedia(file: File, kind: 'image' | 'video'): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? (kind === 'video' ? 'mp4' : 'png');
  const path = `home/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('products')
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('products').getPublicUrl(path);
  return data.publicUrl;
}
