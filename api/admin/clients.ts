import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminWithRefresh } from '../_lib/tokens.js';
import { getServiceSupabase } from '../_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getServiceSupabase();
  const isAdmin = await verifyAdminWithRefresh(req, res, supabase);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, code, description, password, logo_url, brand_color, is_active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ data: data || [] });
      }

      case 'POST': {
        const { name, password, brandColor } = req.body || {};
        if (!name || !password) {
          return res.status(400).json({ error: 'Name and password required' });
        }

        const code = name.trim().toLowerCase().replace(/\s+/g, '_');
        const { data: passwordHash, error: hashError } = await supabase.rpc('hash_password', { plain_password: password.trim() });
        if (hashError) throw hashError;

        const { error } = await supabase
          .from('clients')
          .insert({
            name: name.trim(),
            code,
            password: password.trim(),
            password_hash: passwordHash,
            brand_color: brandColor || '#3B82F6',
          });

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'PUT': {
        const { id, name, password, brandColor, isActive } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Client ID required' });
        }

        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name.trim();
        if (brandColor !== undefined) updates.brand_color = brandColor;
        if (isActive !== undefined) updates.is_active = isActive;
        if (password && password.trim()) {
          const { data: hash, error: hashError } = await supabase.rpc('hash_password', { plain_password: password.trim() });
          if (hashError) throw hashError;
          updates.password = password.trim();
          updates.password_hash = hash;
        }

        const { error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'DELETE': {
        const { id } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Client ID required' });
        }

        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Admin clients error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
