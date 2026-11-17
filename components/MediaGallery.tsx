import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { getSupabaseClient } from '../services/supabaseClient';
import { Gallery, imagePreview, loadGallery, MediaKind, saveGallery, uploadGalleryImages } from '../services/mediaGallery';

export function MediaGallery({ kind, businessId, entityId, editable = false, onPrimaryChanged }: { kind: MediaKind; businessId: string; entityId: string; editable?: boolean; onPrimaryChanged?: (url: string) => void }) {
  const [gallery, setGallery] = useState<Gallery>({ paths: [], version: 0 });
  const [urls, setUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const client = getSupabaseClient();
  const refresh = async () => {
    if (!client) throw new Error('An active Supabase connection is required.');
    const next = await loadGallery(client, kind, businessId, entityId);
    const previews = await Promise.all(next.paths.map(path => path === 'legacy' ? Promise.resolve(next.legacyImage ?? '') : imagePreview(client, path)));
    setGallery(next); setUrls(previews); setLoaded(true);
    if (next.paths.length || next.version > 0) onPrimaryChanged?.(previews[0] ?? '');
  };
  useEffect(() => {
    let active = true;
    setLoaded(false); setUrls([]); setError('');
    if (!client) { setError('An active Supabase connection is required.'); return; }
    const update = async () => {
      try {
        const next = await loadGallery(client, kind, businessId, entityId);
        const previews = await Promise.all(next.paths.map(path => path === 'legacy' ? Promise.resolve(next.legacyImage ?? '') : imagePreview(client, path)));
        if (active) {
          setGallery(next); setUrls(previews); setLoaded(true);
          if (next.paths.length || next.version > 0) onPrimaryChanged?.(previews[0] ?? '');
        }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Gallery unavailable.'); }
    };
    void update();
    const timer = setInterval(() => void update(), 240000);
    return () => { active = false; clearInterval(timer); };
  }, [client, kind, businessId, entityId]);
  const run = async (operation: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await operation(); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Image change failed. Reload before retrying.'); }
    finally { setBusy(false); }
  };
  const choose = (replaceIndex?: number) => {
    if (!client || !loaded || busy || Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.multiple = replaceIndex === undefined;
    input.style.display = 'none';
    const cleanup = () => input.remove();
    input.oncancel = cleanup;
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      cleanup();
      if (files.length) void run(() => uploadGalleryImages(client, kind, businessId, entityId, gallery, files, replaceIndex));
    };
    document.body.appendChild(input);
    input.click();
  };
  const button = (label: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy || disabled} onPress={action} style={{ padding: 10, opacity: busy || disabled ? 0.5 : 1 }}><Text>{label}</Text></Pressable>;
  return <View style={{ padding: 16, gap: 12 }}>
    <Text accessibilityRole="header">{kind === 'trips' ? 'Trip' : 'Product'} image gallery ({gallery.paths.length}/10)</Text>
    <Text>JPEG, PNG or WebP · maximum 5 MB per image. First image is primary.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {urls.map((url, index) => <View key={gallery.paths[index]}>
        <Image accessibilityLabel={`Gallery image ${index + 1}${index === 0 ? ', primary' : ''}`} source={{ uri: url }} style={{ width: 180, height: 140 }} resizeMode="contain" />
        <Text>{index === 0 ? 'Primary image' : `Image ${index + 1}`}</Text>
        {editable && client && <>
          {button(`Replace image ${index + 1}`, () => choose(index))}
          {button(`Remove image ${index + 1}`, () => void run(() => saveGallery(client, kind, businessId, entityId, gallery, gallery.paths.filter((_, position) => position !== index))))}
          {index > 0 && button(`Make image ${index + 1} primary`, () => void run(() => saveGallery(client, kind, businessId, entityId, gallery, [gallery.paths[index], ...gallery.paths.filter((_, position) => position !== index)])))}
          {index > 0 && button(`Move image ${index + 1} earlier`, () => void run(() => { const paths = [...gallery.paths]; [paths[index - 1], paths[index]] = [paths[index], paths[index - 1]]; return saveGallery(client, kind, businessId, entityId, gallery, paths); }))}
        </>}
      </View>)}
    </View>
    {editable && client && gallery.legacyImage && !gallery.paths.includes('legacy') && gallery.paths.length < 10 && button('Restore original image', () => void run(() => saveGallery(client, kind, businessId, entityId, gallery, [...gallery.paths, 'legacy'])))}
    {editable && Platform.OS === 'web' && button('Add images', () => choose(), !loaded || gallery.paths.length >= 10)}
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
    {busy && <Text accessibilityLiveRegion="polite">Saving images…</Text>}
    {button('Reload gallery', () => void run(refresh))}
  </View>;
}
