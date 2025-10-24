type SupplierRecord = {
  id: string;
  name: string;
  service: string;
  location?: string;
  match?: number;
};

const API_BASE =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_API_BASE ||
  'https://maloveapp-backend.onrender.com';

export async function fetchSuppliers(): Promise<SupplierRecord[]> {
  try {
    const resp = await fetch(`${API_BASE.replace(/\/$/, '')}/api/mobile/suppliers/shortlist`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const payload = await resp.json();
    if (!Array.isArray(payload?.items)) {
      return [];
    }

    return payload.items.map((item: any, index: number) => ({
      id: item.id || `supplier-${index}`,
      name: item.name || item.title || 'Proveedor IA',
      service: item.service || item.category || 'Servicio',
      location: item.city || item.location || undefined,
      match: typeof item.match === 'number' ? item.match : undefined,
    }));
  } catch (error) {
    console.warn('[mobile] fetchSuppliers failed', error);
    throw error instanceof Error ? error : new Error('Failed to load suppliers');
  }
}
