import type { StudyCategory, EnhancedFocusSession } from '../types/stats';

// Predefined Categories with Emojis and Theme Colors
export const PREDEFINED_CATEGORIES: Omit<StudyCategory, 'createdAt' | 'lastUsed'>[] = [
  { id: 'accounting', title: 'Accounting', emoji: '💰', themeColor: '#10B981', accentColor: '#34D399' },
  { id: 'algebra', title: 'Algebra', emoji: '📐', themeColor: '#3B82F6', accentColor: '#60A5FA' },
  { id: 'science', title: 'Science', emoji: '🧪', themeColor: '#8B5CF6', accentColor: '#A78BFA' },
  { id: 'coding', title: 'Coding', emoji: '💻', themeColor: '#EC4899', accentColor: '#F472B6' },
  { id: 'reading', title: 'Reading', emoji: '📚', themeColor: '#F59E0B', accentColor: '#FBBF24' },
  { id: 'writing', title: 'Writing', emoji: '✍️', themeColor: '#EF4444', accentColor: '#F87171' },
  { id: 'language', title: 'Language', emoji: '🗣️', themeColor: '#06B6D4', accentColor: '#22D3EE' },
  { id: 'music', title: 'Music', emoji: '🎵', themeColor: '#6366F1', accentColor: '#818CF8' },
];

// Storage Keys
const CATEGORIES_KEY = 'studyCategories';
const ENHANCED_SESSIONS_KEY = 'enhancedFocusSessions';

// Get all categories (predefined + custom)
export const getCategories = (): StudyCategory[] => {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // Initialize with predefined categories
  const initialCategories = PREDEFINED_CATEGORIES.map(cat => ({
    ...cat,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  }));

  saveCategories(initialCategories);
  return initialCategories;
};

// Save categories
export const saveCategories = (categories: StudyCategory[]) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

// Get or create category
export const getOrCreateCategory = (title: string): StudyCategory => {
  const categories = getCategories();

  // Find existing category
  const existing = categories.find(c => c.title.toLowerCase() === title.toLowerCase());
  if (existing) {
    // Update last used
    existing.lastUsed = new Date().toISOString();
    saveCategories(categories);
    return existing;
  }

  // Create new custom category
  const newCategory: StudyCategory = {
    id: `custom-${Date.now()}`,
    title,
    emoji: '📖', // Default emoji for custom categories
    themeColor: '#A855F7',
    accentColor: '#C084FC',
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  };

  categories.push(newCategory);
  saveCategories(categories);
  return newCategory;
};

// Get recent categories (last 4 used)
export const getRecentCategories = (): StudyCategory[] => {
  const categories = getCategories();
  return categories
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, 4);
};

// Enhanced session storage
export const getEnhancedSessions = (): EnhancedFocusSession[] => {
  const stored = localStorage.getItem(ENHANCED_SESSIONS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // Try to migrate old sessions
  const oldSessions = localStorage.getItem('focusHistory');
  if (oldSessions) {
    const sessions = JSON.parse(oldSessions);
    const enhanced = sessions.map((s: any) => {
      const category = getOrCreateCategory(s.category);
      return {
        ...s,
        categoryId: category.id,
        emoji: category.emoji,
        themeColor: category.themeColor,
        timestamp: s.id,
        successStatus: true
      };
    });
    saveEnhancedSessions(enhanced);
    return enhanced;
  }

  return [];
};

export const saveEnhancedSessions = (sessions: EnhancedFocusSession[]) => {
  localStorage.setItem(ENHANCED_SESSIONS_KEY, JSON.stringify(sessions));
};

export const saveEnhancedSession = (categoryTitle: string, duration: number, success: boolean = true): EnhancedFocusSession => {
  const category = getOrCreateCategory(categoryTitle);
  const sessions = getEnhancedSessions();

  const newSession: EnhancedFocusSession = {
    id: Date.now(),
    categoryId: category.id,
    category: category.title,
    emoji: category.emoji,
    themeColor: category.themeColor,
    duration,
    date: new Date().toISOString(),
    timestamp: Date.now(),
    successStatus: success
  };

  sessions.push(newSession);
  saveEnhancedSessions(sessions);

  // Also save to old format for backward compatibility
  const oldSessions = JSON.parse(localStorage.getItem('focusHistory') || '[]');
  oldSessions.push({
    id: newSession.id,
    category: newSession.category,
    duration: newSession.duration,
    date: newSession.date
  });
  localStorage.setItem('focusHistory', JSON.stringify(oldSessions));

  return newSession;
};

// Reset all sessions and categories
export const resetAllSessionsAndCategories = () => {
  // Clear all sessions
  localStorage.removeItem(ENHANCED_SESSIONS_KEY);
  localStorage.removeItem('focusHistory');

  // Reset categories to predefined only
  const initialCategories = PREDEFINED_CATEGORIES.map(cat => ({
    ...cat,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  }));
  saveCategories(initialCategories);
};
