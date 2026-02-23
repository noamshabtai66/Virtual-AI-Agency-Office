// Research Service - Fetches research by category for the Office App
import { supabase } from './supabaseService';

export interface ResearchItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  summary?: string;
}

// Fetch all research (for display)
export async function fetchAllResearch(): Promise<ResearchItem[]> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .or('category.like.%research%')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: String(item.id),
      title: item.title,
      content: item.content,
      category: item.category || 'research',
      tags: item.tags || [],
      created_at: item.created_at,
      summary: item.content?.slice(0, 200) + '...'
    }));
  } catch (e) {
    console.error('Error fetching research:', e);
    return [];
  }
}

// Fetch research by type
export async function fetchResearchByCategory(category: string): Promise<ResearchItem[]> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .ilike('category', `%${category}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: String(item.id),
      title: item.title,
      content: item.content,
      category: item.category || category,
      tags: item.tags || [],
      created_at: item.created_at,
      summary: item.content?.slice(0, 200) + '...'
    }));
  } catch (e) {
    console.error('Error fetching research by category:', e);
    return [];
  }
}

// Research categories for the UI
export const RESEARCH_TABS = [
  { id: 'all', name: 'הכל', category: '' },
  { id: 'private', name: 'פרטי', category: 'research_private' },
  { id: 'public', name: 'ציבורי', category: 'research_public' },
  { id: 'investment', name: 'השקעות', category: 'research_investment' },
  { id: 'technical', name: 'טכני', category: 'research_technical' },
];
