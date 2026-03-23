/**
 * Multi-tenant entity layer.
 *
 * Every record is scoped to a qbank_id so data is isolated per qbank
 * even though it lives in one shared Supabase database.
 *
 * The qbank_id comes from the active config (VITE_QBANK_ID env var).
 */

import { supabase } from './supabaseClient';
import { qbank } from '@/configs';

const QBANK_ID = qbank.id;

// ---------------------------------------------------------------------------
// Generic entity factory — all operations scoped by qbank_id
// ---------------------------------------------------------------------------
function createEntity(tableName) {
  return {
    async list(orderBy) {
      let query = supabase.from(tableName).select('*').eq('qbank_id', QBANK_ID);
      query = applyOrder(query, orderBy);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async filter(filters = {}, orderBy, limit) {
      let query = supabase.from(tableName).select('*').eq('qbank_id', QBANK_ID);
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      query = applyOrder(query, orderBy);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async create(record) {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        ...record,
        qbank_id: QBANK_ID,
        created_by: user?.email || null,
        created_date: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .eq('qbank_id', QBANK_ID)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('qbank_id', QBANK_ID);
      if (error) throw error;
    },
  };
}

function applyOrder(query, orderBy) {
  if (!orderBy) return query;
  const desc = orderBy.startsWith('-');
  const column = desc ? orderBy.slice(1) : orderBy;
  return query.order(column, { ascending: !desc });
}

// ---------------------------------------------------------------------------
// User entity — wraps Supabase Auth + profiles table, scoped per qbank
// ---------------------------------------------------------------------------
const UserEntity = {
  ...createEntity('profiles'),

  async me() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw authError || new Error('Not authenticated');

    // Look for profile scoped to this qbank
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .eq('qbank_id', QBANK_ID)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile for this qbank yet — create one
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          auth_id: user.id,
          qbank_id: QBANK_ID,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          subscription_status: 'trial',
          questions_answered_count: 0,
          role: 'user',
          created_date: new Date().toISOString(),
        })
        .select()
        .single();
      if (createError) throw createError;
      profile = newProfile;
    } else if (error) {
      throw error;
    }

    return profile;
  },

  async updateMyUserData(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('auth_id', user.id)
      .eq('qbank_id', QBANK_ID)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async logout() {
    await supabase.auth.signOut();
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export const Question        = createEntity('questions');
export const QuestionReport  = createEntity('question_reports');
export const SessionAnswer   = createEntity('session_answers');
export const StudySession    = createEntity('study_sessions');
export const TestSession     = createEntity('test_sessions');
export const UserProgress    = createEntity('user_progress');
export const User            = UserEntity;
