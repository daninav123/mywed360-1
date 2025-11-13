import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { getBackendBase } from '@/utils/backendBase.js';

import ExternalImage from './ExternalImage';
import Input from './Input';
import Nav from './Nav';
import PlannerDashboard from './PlannerDashboard';
import ProviderSearchModal from './ProviderSearchModal';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';

import {
  User,
  DollarSign,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
} from 'lucide-react';

import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth'; // Nuevo sistema
import useTranslations from '../hooks/useTranslations';
import { useWedding } from '../context/WeddingContext';
import { fetchBlogPosts } from '../services/blogContentService';
import { fetchWall } from '../services/wallService';
import { getSummary as getGamificationSummary } from '../services/GamificationService';
import { isConfirmedStatus } from '../utils/supplierStatus';
import useFinance from '../hooks/useFinance';
import useWeddingTasksHierarchy from '../hooks/useWeddingTasksHierarchy';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

const normalizeLang = (l) =>
  String(l || 'es')
    .toLowerCase()
    .match(/^[a-z]{2}/)?.[0] || 'es';

const dedupeServiceList = (entries) => {
  if (!Array.isArray(entries)) return [];
  const unique = [];
  const seen = new Set();
  for (const entry of entries) {
    let value = '';
    if (typeof entry === 'string') {
      value = entry.trim();
    } else if (entry && typeof entry === 'object') {
      if (typeof entry.name === 'string') value = entry.name.trim();
      else if (typeof entry.label === 'string') value = entry.label.trim();
      else if (typeof entry.value === 'string') value = entry.value.trim();
    }
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique;
};

const safeParseLocalStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const readGuestsFromLocalStorage = (weddingId) => {
  const namespaced = weddingId ? safeParseLocalStorage(`maloveapp_${weddingId}_guests`, []) : [];
  if (Array.isArray(namespaced) && namespaced.length) return namespaced;
  const legacy = safeParseLocalStorage('mywed360Guests', []);
  return Array.isArray(legacy) ? legacy : [];
};

const confirmedAttendanceTokens = [
  'confirmado',
  'confirmada',
  'confirmed',
  'attending',
  'asiste',
  'asistira',
  'sí',
  'si',
  'yes',
];

const isConfirmedAttendance = (value) => {
  if (value === true) return true;
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  if (confirmedAttendanceTokens.includes(normalized)) return true;
  return ['confirm', 'assist', 'attend', 'yes'].some((token) => normalized.includes(token));
};

const isGuestConfirmed = (guest) => {
  if (!guest) return false;
  if (typeof guest.confirmed === 'boolean') return guest.confirmed;
  if (typeof guest.isConfirmed === 'boolean') return guest.isConfirmed;
  if (guest.status === true) return true;
  const statusCandidates = [
    guest.response,
    guest.status,
    guest.rsvpStatus,
    guest.rsvp,
    guest.attendance,
    guest.estado,
  ];
  return statusCandidates.some((value) => isConfirmedAttendance(value));
};

const readTasksCompletedFromLocalStorage = (weddingId) => {
  const namespacedKey = weddingId ? `maloveapp_${weddingId}_tasksCompleted` : '';
  const namespaced = namespacedKey ? safeParseLocalStorage(namespacedKey, []) : [];
  let collection = [];
  if (Array.isArray(namespaced) && namespaced.length) {
    collection = namespaced;
  }
  if (!collection.length) {
    const legacy = safeParseLocalStorage('tasksCompleted', {});
    if (Array.isArray(legacy)) {
      collection = legacy;
    } else if (legacy && typeof legacy === 'object') {
      collection = Object.entries(legacy).map(([id, entry]) => ({
        id,
        ...(entry || {}),
        taskId: entry?.taskId || id,
      }));
    }
  }
  return Array.isArray(collection) ? collection : [];
};

// Las categorÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as se traducirÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡n usando el hook useTranslations
const getInspirationCategories = (t) => [
  { slug: 'decoracion', label: t('categories.decoration') },
  { slug: 'coctel', label: t('categories.cocktail') },
  { slug: 'banquete', label: t('categories.banquet') },
  { slug: 'ceremonia', label: t('categories.ceremony') },
  { slug: 'flores', label: t('categories.flowers') },
  { slug: 'vestido', label: t('categories.dress') },
  { slug: 'pastel', label: t('categories.cake') },
  { slug: 'fotografia', label: t('categories.photography') },
];

const PROGRESS_STORAGE_KEY = 'maloveapp_progress';
// 2500 coincide con el lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­mite superior del nivel 6 (Experto Wedding) en backend/services/gamificationService.js.
const PROGRESS_COMPLETION_TARGET = 2500;
// Diferencia mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­nima (en puntos porcentuales) para considerar que se va adelantado o retrasado.
const PROGRESS_DIFF_TOLERANCE = 5;
const YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const readStoredProgress = () => {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = Number.parseFloat(raw);
    return clampPercent(parsed);
  } catch {
    return 0;
  }
};

const writeStoredProgress = (value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, String(clampPercent(value)));
  } catch {
    // Ignorar errores de almacenamiento (modo incÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³gnito, etc.)
  }
};

const parseDateLike = (input) => {
  if (!input) return null;
  try {
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? null : input;
    }
    if (typeof input?.toDate === 'function') {
      const d = input.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'object' && typeof input.seconds === 'number') {
      const d = new Date(input.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'number') {
      const d = new Date(input);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) return null;
      const date = new Date(trimmed);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  } catch {
    return null;
  }
  return null;
};

const computeExpectedProgress = (weddingData) => {
  if (!weddingData) return null;
  const eventDate =
    parseDateLike(
      weddingData.weddingDate ||
        weddingData.date ||
        weddingData.eventDate ||
        weddingData.ceremonyDate
    ) || null;

  if (!eventDate) return null;

  const planningStartCandidates = [
    weddingData.planningStart,
    weddingData.planningStartDate,
    weddingData.projectStart,
    weddingData.createdAt,
    weddingData.creationDate,
    weddingData.registeredAt,
    weddingData.created_at,
    weddingData.updatedAt, // fallback adicional si la boda fue migrada recientemente
  ];

  let planningStart = null;
  for (const candidate of planningStartCandidates) {
    const parsed = parseDateLike(candidate);
    if (parsed) {
      planningStart = parsed;
      break;
    }
  }

  if (!planningStart || planningStart >= eventDate) {
    const fallback = new Date(eventDate.getTime() - YEAR_IN_MS);
    planningStart = fallback;
  }

  const now = new Date();
  if (now <= planningStart) return 0;
  if (now >= eventDate) return 100;

  const totalSpan = eventDate.getTime() - planningStart.getTime();
  if (totalSpan <= 0) return 100;

  const elapsed = now.getTime() - planningStart.getTime();
  return clampPercent(Math.round((elapsed / totalSpan) * 100));
};

export default function HomePage() {
  const { t, format } = useTranslations();
  const INSPIRATION_CATEGORIES = useMemo(() => getInspirationCategories(t), [t]);
  const navigate = useNavigate();

  // Todo se maneja con modales locales
  const [noteText, setNoteText] = useState('');
  const [guest, setGuest] = useState({ name: '', side: 'novia', contact: '' });
  const [newMovement, setNewMovement] = useState({
    concept: '',
    amount: 0,
    date: '',
    type: 'expense',
  });
  const [activeModal, setActiveModal] = useState(null);
  // Hook de autenticacin unificado
  const { hasRole, userProfile, currentUser } = useAuth();
  const { activeWedding, activeWeddingData } = useWedding();
  const { parents: taskParents, childrenByParent: taskChildrenByParent } =
    useWeddingTasksHierarchy(activeWedding);

  // Derivados equivalentes al antiguo UserContext
  const role = userProfile?.role || 'particular';
  const displayName =
    userProfile?.name ||
    userProfile?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    '';
  const [progressPercent, setProgressPercent] = useState(() => readStoredProgress());
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(null);

  const expectedProgress = useMemo(
    () => computeExpectedProgress(activeWeddingData),
    [activeWeddingData]
  );

  useEffect(() => {
    const uid = currentUser?.uid || userProfile?.uid || null;
    const weddingId = activeWeddingData?.id || activeWedding || null;
    if (!uid || !weddingId) {
      setProgressLoading(false);
      return;
    }

    let cancelled = false;
    setProgressLoading(true);

    (async () => {
      try {
        const summary = await getGamificationSummary({ uid, weddingId });
        const rawPoints = Number(summary?.points ?? summary?.totalPoints ?? 0);
        const percent =
          PROGRESS_COMPLETION_TARGET > 0
            ? clampPercent(Math.round((rawPoints / PROGRESS_COMPLETION_TARGET) * 100))
            : 0;
        if (!cancelled) {
          setProgressPercent(percent);
          writeStoredProgress(percent);
          setProgressError(null);
        }
      } catch (error) {
        if (!cancelled) {
          // console.warn('[HomePage] No se pudo obtener el resumen de gamificación.', error);
          setProgressError(error);
        }
      } finally {
        if (!cancelled) {
          setProgressLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid, userProfile?.uid, activeWedding, activeWeddingData?.id]);

  const progressDiff =
    expectedProgress == null ? null : Math.round(progressPercent - expectedProgress);

  const progressVariant = useMemo(() => {
    if (progressPercent >= 100) return 'success';
    if (expectedProgress == null) {
      return progressPercent >= 80 ? 'primary' : 'destructive';
    }
    if (progressDiff !== null && progressDiff > PROGRESS_DIFF_TOLERANCE) {
      return 'success';
    }
    if (progressDiff !== null && progressDiff < -PROGRESS_DIFF_TOLERANCE) {
      return 'destructive';
    }
    return 'warning';
  }, [expectedProgress, progressDiff, progressPercent]);

  const progressStatusText = useMemo(() => {
    if (progressPercent >= 100) return t('home.progress.status.complete');
    if (expectedProgress == null) {
      return '';
    }
    if (progressDiff !== null && progressDiff > PROGRESS_DIFF_TOLERANCE) {
      return t('home.progress.status.ahead');
    }
    if (progressDiff !== null && progressDiff < -PROGRESS_DIFF_TOLERANCE) {
      return t('home.progress.status.behind');
    }
    return t('home.progress.status.onTrack');
  }, [expectedProgress, progressDiff, progressPercent, t]);

  const resolvedWeddingName = useMemo(() => {
    if (!activeWeddingData) return '';

    const normalizeName = (value) =>
      String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const splitComposite = (value) => {
      if (!value || typeof value !== 'string') return [];
      const cleaned = value.trim();
      if (!cleaned) return [];
      const parts = cleaned
        .split(/\s*(?:&|y|and|\+|\/)\s*/i)
        .map((part) => part.trim())
        .filter(Boolean);
      return parts.length > 1 ? parts : [cleaned];
    };

    const rawNames = [];
    const stringCandidates = [
      activeWeddingData.coupleName,
      activeWeddingData.couple,
      activeWeddingData.brideAndGroom,
      activeWeddingData.name,
    ];

    stringCandidates.forEach((value) => {
      splitComposite(value).forEach((name) => rawNames.push(name));
    });

    const arrayCandidates = [
      Array.isArray(activeWeddingData.coupleNames) ? activeWeddingData.coupleNames : [],
      [activeWeddingData.brideFirstName, activeWeddingData.groomFirstName],
      [activeWeddingData.bride, activeWeddingData.groom],
    ];

    arrayCandidates.forEach((arr) => {
      arr
        .flat()
        .filter(Boolean)
        .forEach((name) => {
          if (typeof name === 'string') rawNames.push(name.trim());
        });
    });

    const seen = new Set();
    const filtered = [];
    const displayNameNormalized = displayName ? normalizeName(displayName) : null;

    rawNames.forEach((name) => {
      const normalized = normalizeName(name);
      if (!normalized) return;
      if (displayNameNormalized && normalized === displayNameNormalized) return;
      if (seen.has(normalized)) return;
      seen.add(normalized);
      filtered.push(name.trim());
    });

    if (filtered.length > 1) return filtered.join(' y ');
    if (filtered.length === 1) return filtered[0];

    const fallbackString = stringCandidates
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .find((value) => value.length > 0);
    return fallbackString || '';
  }, [activeWeddingData, displayName]);
  const legacyWeddingName =
    typeof window !== 'undefined'
      ? localStorage.getItem('maloveapp_active_wedding_name') || ''
      : '';
  const weddingName = resolvedWeddingName || legacyWeddingName || displayName;
  const logoUrl = userProfile?.logoUrl || '';
  const displayWeddingName = weddingName || t('home.header.titleFallback');
  const headerTitle = t('home.header.title', { name: displayWeddingName });
  const headerSubtitle = t('home.header.subtitle');
  const headerLogoAlt = t('home.header.logoAlt');
  const progressTasksLabel = t('home.progress.tasksLabel');
  const progressLoadingLabel = t('home.progress.loading');
  const progressErrorLabel = t('home.progress.error');
  const progressCompletionLabel = t('home.progress.completion', { value: progressPercent });
  const expectedProgressLabel =
    expectedProgress != null ? t('home.progress.expected', { value: expectedProgress }) : '';

  // Finance stats - DEBE estar ANTES del useMemo que lo usa
  const { stats: financeStats } = useFinance();
  const financeSpent = Number(financeStats?.totalSpent || 0);
  const budgetTotal = Number(financeStats?.totalBudget || 0);

  const budgetValueDisplay = useMemo(() => {
    const spent = format.currency(financeSpent || 0);
    if (budgetTotal) {
      return t('home.stats.budgetValueWithTotal', {
        spent,
        total: format.currency(budgetTotal),
      });
    }
    return t('home.stats.budgetValue', { spent });
  }, [financeSpent, budgetTotal, format, t]);
  const quickActions = useMemo(
    () => [
      { key: 'proveedor', label: t('home.quickActions.provider'), icon: User },
      { key: 'invitado', label: t('home.quickActions.guest'), icon: Users },
      { key: 'movimiento', label: t('home.quickActions.movement'), icon: DollarSign },
      { key: 'nota', label: t('home.quickActions.note'), icon: Plus },
    ],
    [t]
  );

  // Datos derivados ya calculados ms arriba
  const email = currentUser?.email || '';
  const isPlanner = role === 'planner';
  const galleryRef = useRef(null);
  const [newsPosts, setNewsPosts] = useState([]);
  const [newsError, setNewsError] = useState(null);
  const [categoryImages, setCategoryImages] = useState([]);
  const { i18n } = useTranslation();
  const lang = normalizeLang(i18n.language);
  const backendBase = getBackendBase();

  useEffect(() => {
    if (!resolvedWeddingName) return;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('maloveapp_active_wedding_name', resolvedWeddingName);
    } catch {
      /* ignore storage errors */
    }
  }, [resolvedWeddingName]);

  // Cargar primera imagen de cada categorÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a destacada
  useEffect(() => {
    Promise.all(INSPIRATION_CATEGORIES.map(({ slug }) => fetchWall(1, slug)))
      .then((results) => {
        const imgs = results
          .map((arr, index) => {
            const first = arr?.[0];
            if (!first) return null;
            const { slug, label } = INSPIRATION_CATEGORIES[index];
            return {
              src: first.url || first.thumb,
              alt: label,
              slug,
            };
          })
          .filter(Boolean);
        setCategoryImages(imgs);
      })
      .catch((error) => {
        // console.error('[HomePage] No se pudo precargar la galería de inspiración:', error);
      });
  }, []);

  // Cargar últimas noticias desde el nuevo blog
  useEffect(() => {
    let cancelled = false;
    async function loadNews() {
      try {
        const { posts: latestPosts } = await fetchBlogPosts({ language: lang, limit: 4 });
        if (cancelled) return;
        const cleanPosts = (latestPosts || []).map((post) => ({
          ...post,
          coverUrl: post.coverImage?.url || null,
        }));
        setNewsPosts(cleanPosts);
        setNewsError(cleanPosts.length ? null : t('home.news.error'));
      } catch (error) {
        if (cancelled) return;
        // console.error('[HomePage] blog posts failed', error);
        setNewsPosts([]);
        setNewsError(t('home.news.error'));
      }
    }
    loadNews();
    return () => {
      cancelled = true;
    };
  }, [lang, t]);

  const handleRedoTutorial = useCallback(async () => {
    if (!confirm(t('home.header.redo.confirm'))) return;
    try {
      // 1. Limpiar almacenamiento y marcar flag para mostrar tutorial
      localStorage.clear();
      localStorage.setItem('forceOnboarding', '1');

      toast.success(t('home.header.redo.success'));
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      // console.error(err);
      toast.error(t('home.header.redo.error'));
    }
  }, [t]);
  const scrollAmount = 300;

  const scrollPrev = useCallback(() => {
    galleryRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }, []);

  const scrollNext = useCallback(() => {
    galleryRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  const { data: guestsCollection = [] } = useFirestoreCollection('guests', []);
  const { data: tasksCompletedDocs = [] } = useFirestoreCollection('tasksCompleted', []);

  const [localGuestsVersion, setLocalGuestsVersion] = useState(0);
  const [localTasksVersion, setLocalTasksVersion] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const increment = () => setLocalGuestsVersion((value) => value + 1);
    window.addEventListener('maloveapp-guests', increment);
    window.addEventListener('maloveapp-guests-updated', increment);
    return () => {
      window.removeEventListener('maloveapp-guests', increment);
      window.removeEventListener('maloveapp-guests-updated', increment);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !activeWedding) return undefined;
    const eventName = `mywed360-${activeWedding}-guests`;
    const handler = () => setLocalGuestsVersion((value) => value + 1);
    window.addEventListener(eventName, handler);
    return () => {
      window.removeEventListener(eventName, handler);
    };
  }, [activeWedding]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const increment = () => setLocalTasksVersion((value) => value + 1);
    window.addEventListener('maloveapp-tasks', increment);
    return () => {
      window.removeEventListener('maloveapp-tasks', increment);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !activeWedding) return undefined;
    const eventName = `mywed360-${activeWedding}-tasksCompleted`;
    const handler = () => setLocalTasksVersion((value) => value + 1);
    window.addEventListener(eventName, handler);
    return () => {
      window.removeEventListener(eventName, handler);
    };
  }, [activeWedding]);

  // --- Métricas dinámicas (memoizadas para performance) ---
  const guestsMetrics = useMemo(() => {
    const firestoreGuests = Array.isArray(guestsCollection) ? guestsCollection : [];
    const sourceGuests =
      firestoreGuests.length > 0 ? firestoreGuests : readGuestsFromLocalStorage(activeWedding);
    const confirmedCount = sourceGuests.reduce(
      (acc, guest) => acc + (isGuestConfirmed(guest) ? 1 : 0),
      0
    );
    return {
      confirmedCount,
      totalGuests: sourceGuests.length,
    };
  }, [guestsCollection, localGuestsVersion, activeWedding]);

  const guestStatValue = useMemo(() => {
    const confirmedText = format.number(guestsMetrics.confirmedCount || 0);
    const totalGuests = guestsMetrics.totalGuests || 0;
    return totalGuests > 0 ? `${confirmedText} / ${format.number(totalGuests)}` : confirmedText;
  }, [guestsMetrics, format]);

  const completedTaskIds = useMemo(() => {
    const set = new Set();
    const addEntry = (entry) => {
      if (!entry) return;
      const candidates = [entry.id, entry.taskId, entry.taskID, entry.subtaskId, entry.subTaskId];
      candidates.forEach((value) => {
        if (value !== undefined && value !== null && value !== '') {
          set.add(String(value));
        }
      });
      if (Array.isArray(entry.ids)) {
        entry.ids.forEach((value) => {
          if (value !== undefined && value !== null && value !== '') {
            set.add(String(value));
          }
        });
      }
    };
    (Array.isArray(tasksCompletedDocs) ? tasksCompletedDocs : []).forEach(addEntry);
    readTasksCompletedFromLocalStorage(activeWedding).forEach(addEntry);
    return set;
  }, [tasksCompletedDocs, activeWedding, localTasksVersion]);

  const tasksMetrics = useMemo(() => {
    const parents = Array.isArray(taskParents) ? taskParents : [];
    const childrenMap =
      taskChildrenByParent && typeof taskChildrenByParent === 'object' ? taskChildrenByParent : {};
    let tasksTotal = 0;
    let tasksCompleted = 0;

    const isStatusDone = (status) => {
      const normalized = String(status || '')
        .trim()
        .toLowerCase();
      if (!normalized) return false;
      if (
        [
          'completado',
          'completada',
          'completado total',
          'terminado',
          'finalizado',
          'finalizada',
          'done',
        ].includes(normalized)
      ) {
        return true;
      }
      return normalized.startsWith('complet');
    };

    const isTaskCompleted = (task) => {
      if (!task) return false;
      if (typeof task.completed === 'boolean') return task.completed;
      if (typeof task.isDone === 'boolean') return task.isDone;
      if (typeof task.done === 'boolean') return task.done;
      const taskId = task?.id != null ? String(task.id) : null;
      if (taskId && completedTaskIds.has(taskId)) return true;
      return isStatusDone(task.status || task.estado || task.state);
    };

    parents.forEach((task) => {
      tasksTotal += 1;
      if (isTaskCompleted(task)) tasksCompleted += 1;

      const subtasks = Array.isArray(childrenMap[task.id]) ? childrenMap[task.id] : [];
      subtasks.forEach((subtask) => {
        tasksTotal += 1;
        if (isTaskCompleted(subtask)) tasksCompleted += 1;
      });
    });

    return { tasksTotal, tasksCompleted };
  }, [taskParents, taskChildrenByParent, completedTaskIds]);

  const [providersMetrics, setProvidersMetrics] = useState({
    providersAssigned: 0,
    providersTotalNeeded: 0,
    providersFallbackNeeded: 0,
  });

  useEffect(() => {
    if (!db) {
      return undefined;
    }

    if (!activeWedding) {
      setProvidersMetrics({
        providersAssigned: 0,
        providersTotalNeeded: 0,
        providersFallbackNeeded: 0,
      });
      return undefined;
    }

    let unsubscribeSuppliers;
    let unsubscribeWedding;

    const weddingRef = doc(db, 'weddings', activeWedding);
    unsubscribeWedding = onSnapshot(
      weddingRef,
      (snap) => {
        if (!snap.exists()) {
          setProvidersMetrics((prev) => ({ ...prev, providersTotalNeeded: 0 }));
          return;
        }
        const data = snap.data() || {};
        const rawList =
          Array.isArray(data?.wantedServices) && data.wantedServices.length
            ? data.wantedServices
            : Array.isArray(data?.neededServices) && data.neededServices.length
              ? data.neededServices
              : Array.isArray(data?.requiredServices) && data.requiredServices.length
                ? data.requiredServices
                : [];
        const deduped = dedupeServiceList(rawList);
        setProvidersMetrics((prev) => ({
          ...prev,
          providersTotalNeeded: deduped.length,
        }));
      },
      (error) => {
        // console.warn('[HomePage] No se pudo cargar wantedServices:', error);
      }
    );

    const suppliersRef = collection(db, 'weddings', activeWedding, 'suppliers');
    unsubscribeSuppliers = onSnapshot(
      suppliersRef,
      (snap) => {
        let confirmed = 0;
        const serviceNames = new Set();
        snap.forEach((docSnap) => {
          const data = docSnap.data() || {};
          if (isConfirmedStatus(data.status) || isConfirmedStatus(data.estado)) confirmed += 1;

          const serviceCandidate =
            typeof data.service === 'string'
              ? data.service
              : typeof data.category === 'string'
                ? data.category
                : typeof data.servicio === 'string'
                  ? data.servicio
                  : '';
          const normalizedService =
            typeof serviceCandidate === 'string' ? serviceCandidate.trim() : '';
          if (normalizedService) {
            serviceNames.add(normalizedService.toLowerCase());
          }
        });
        setProvidersMetrics((prev) => ({
          ...prev,
          providersAssigned: confirmed,
          providersFallbackNeeded: serviceNames.size,
        }));
      },
      (error) => {
        // console.warn('[HomePage] No se pudieron cargar proveedores:', error);
      }
    );

    return () => {
      if (typeof unsubscribeWedding === 'function') unsubscribeWedding();
      if (typeof unsubscribeSuppliers === 'function') unsubscribeSuppliers();
    };
  }, [activeWedding]);

  const statsNovios = useMemo(() => {
    const neededProviders =
      providersMetrics.providersTotalNeeded > 0
        ? providersMetrics.providersTotalNeeded
        : providersMetrics.providersFallbackNeeded;

    const providersAssigned = format.number(providersMetrics.providersAssigned || 0);
    const providersValue =
      neededProviders > 0
        ? `${providersAssigned} / ${format.number(neededProviders)}`
        : providersAssigned;

    const tasksCompleted = format.number(tasksMetrics.tasksCompleted || 0);
    const tasksValue =
      tasksMetrics.tasksTotal > 0
        ? `${tasksCompleted} / ${format.number(tasksMetrics.tasksTotal)}`
        : tasksCompleted;

    return [
      { label: t('home.stats.confirmedGuests'), value: guestStatValue, icon: Users },
      { label: t('home.stats.budgetSpent'), value: budgetValueDisplay, icon: DollarSign },
      { label: t('home.stats.providers'), value: providersValue, icon: User },
      { label: t('home.stats.tasksCompleted'), value: tasksValue, icon: Calendar },
    ];
  }, [guestStatValue, budgetValueDisplay, providersMetrics, tasksMetrics, format, t]);

  const statsPlanner = useMemo(() => {
    const tasksAssigned = format.number(tasksMetrics.tasksTotal || 0);
    const tasksCompletedFormatted = format.number(tasksMetrics.tasksCompleted || 0);
    const plannerTasksValue =
      tasksMetrics.tasksTotal > 0 ? `${tasksCompletedFormatted} / ${tasksAssigned}` : tasksAssigned;

    return [
      { label: t('home.stats.tasksAssigned'), value: plannerTasksValue, icon: Calendar },
      {
        label: t('home.stats.providersAssigned'),
        value: format.number(providersMetrics.providersAssigned || 0),
        icon: User,
      },
      { label: t('home.stats.confirmedGuests'), value: guestStatValue, icon: Users },
      {
        label: t('home.stats.budgetSpent'),
        value: budgetValueDisplay,
        icon: DollarSign,
      },
    ];
  }, [budgetValueDisplay, guestStatValue, providersMetrics, tasksMetrics, format, t]);

  const statsCommon = useMemo(
    () => (role === 'particular' ? statsNovios : statsPlanner),
    [role, statsNovios, statsPlanner]
  );

  const handleQuickAddProvider = useCallback(
    (provider) => {
      try {
        const existing = JSON.parse(localStorage.getItem('lovendaProviders') || '[]');
        const normalized = {
          id: provider.id || Date.now(),
          name: provider.title || provider.name || t('home.providers.fallbackName'),
          service: provider.service || '',
          location: provider.location || '',
          priceRange: provider.priceRange || provider.price || '',
          link: provider.link || provider.url || '',
          snippet: provider.snippet || provider.description || '',
          createdAt: Date.now(),
        };
        const updated = [normalized, ...existing].slice(0, 25);
        localStorage.setItem('lovendaProviders', JSON.stringify(updated));
        window.dispatchEvent(new Event('maloveapp-providers'));
        toast.success(t('home.providers.addSuccess'));
      } catch (error) {
        // console.warn('[HomePage] No se pudo guardar el proveedor seleccionado', error);
        toast.error(t('home.providers.addError'));
      }
    },
    [t]
  );

  if (isPlanner) {
    return <PlannerDashboard />;
  }

  return (
    <React.Fragment>
      {/* Botn solo visible en desarrollo */}
      {true && (
        <button
          onClick={handleRedoTutorial}
          className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-[100]"
        >
          {t('home.header.redo.button')}
        </button>
      )}
      <div className="relative flex flex-col h-full bg-[var(--color-bg)] pb-16">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)] rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2" />

        {/* Header */}
        <header className="relative z-10 p-6 flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="page-title">{headerTitle}</h1>
            <p className="text-4xl font-bold text-[color:var(--color-text)]">{headerSubtitle}</p>
          </div>
          <div className="flex items-center">
            <img
              src={`${import.meta.env.BASE_URL}maloveapp-logo.png`}
              alt={headerLogoAlt}
              className="w-32 h-32 object-contain"
            />
          </div>
        </header>

        {/* Progress Section */}
        <section className="z-10 w-full p-6">
          <Card className="bg-[var(--color-surface)]/70 backdrop-blur-md p-4 w-full flex flex-col gap-4">
            <div>
              <p className="text-sm text-[color:var(--color-text)]/70 mb-2">{progressTasksLabel}</p>
              <Progress
                className="h-4 rounded-full w-full"
                value={progressPercent}
                max={100}
                variant={progressVariant}
                data-testid="home-progress-bar"
              />
              <p
                className="mt-2 text-sm font-medium text-[color:var(--color-text)]"
                data-testid="home-progress-label"
              >
                {progressCompletionLabel}
              </p>
              <p
                className="text-xs text-[color:var(--color-text)]/60"
                data-testid="home-progress-status"
              >
                {progressStatusText}
                {expectedProgressLabel}
              </p>
              {progressLoading && (
                <p className="text-xs text-[color:var(--color-text)]/40">{progressLoadingLabel}</p>
              )}
              {progressError && !progressLoading && (
                <p className="text-xs text-[color:var(--color-danger)]">{progressErrorLabel}</p>
              )}
            </div>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="z-10 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Card
                key={idx}
                role="button"
                onClick={() => setActiveModal(action.key)}
                className="flex items-center justify-between p-4 bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="text-[var(--color-primary)]" />
                  <span className="text-[color:var(--color-text)] font-medium">{action.label}</span>
                </div>
                <ChevronRight className="text-[color:var(--color-text)]/50" />
              </Card>
            );
          })}
        </section>

        {/* Stats Cards */}
        <section className="z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 flex-grow">
          {statsCommon.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card
                key={idx}
                className="p-4 bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <Icon className="text-[var(--color-primary)]" />
                  <p className="text-sm text-[color:var(--color-text)]">{stat.label}</p>
                </div>
                <p className="text-2xl font-extrabold text-[var(--color-primary)] mt-2">
                  {stat.value}
                </p>
              </Card>
            );
          })}
        </section>

        {/* Inspiration Gallery */}
        <section className="z-10 p-6 pb-12 relative">
          <div className="flex justify-between items-center mb-4">
            <Link to="/inspiracion">
              <button className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                InspiraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n
                para tu boda
              </button>
            </Link>
            <div className="flex space-x-2">
              <button
                onClick={scrollPrev}
                className="p-2 rounded-full bg-[var(--color-surface)]/80 backdrop-blur-md"
              >
                <ChevronLeft className="text-[var(--color-primary)]" />
              </button>
              <button
                onClick={scrollNext}
                className="p-2 rounded-full bg-[var(--color-surface)]/80 backdrop-blur-md"
              >
                <ChevronRight className="text-[var(--color-primary)]" />
              </button>
            </div>
          </div>
          <div
            ref={galleryRef}
            className="flex space-x-4 overflow-x-auto pb-4 snap-x scrollbar-hide"
          >
            {categoryImages.map((img, idx) => (
              <Link
                key={`${img.slug}-${idx}`}
                to={`/inspiracion?tag=${encodeURIComponent(img.slug)}`}
                className="snap-start flex-shrink-0 w-64 h-64 relative rounded-lg overflow-hidden group"
              >
                <ExternalImage
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white font-medium">{img.alt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section className="z-10 p-6 pb-2">
          <div className="flex justify-between items-center mb-4">
            <Link to="/blog">
              <button className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                {t('home.blog.title')}
              </button>
            </Link>
          </div>
          {newsPosts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {newsPosts.map((post) => {
                const published = post.publishedAt ? new Date(post.publishedAt) : null;
                const publishedLabel = published
                  ? (() => {
                      try {
                        return new Intl.DateTimeFormat(
                          (typeof window !== 'undefined' && window.__I18N_INSTANCE__?.language) ||
                            'es',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        ).format(published);
                      } catch {
                        return published.toDateString();
                      }
                    })()
                  : 'Lovenda';
                return (
                  <Card
                    key={post.id}
                    onClick={() => navigate(post.slug ? `/blog/${post.slug}` : '/blog')}
                    className="cursor-pointer p-0 overflow-hidden bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition"
                  >
                    {post.coverUrl && (
                      <ExternalImage
                        src={post.coverUrl}
                        alt={post.title}
                        className="w-full h-40 object-cover"
                        requireCover={true}
                        minWidth={640}
                        minHeight={360}
                      />
                    )}
                    <div className="p-4 space-y-1">
                      <h3 className="font-semibold text-[color:var(--color-text)] line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-[var(--color-text)]/70 line-clamp-2">
                        {post.excerpt || ''}
                      </p>
                      <div className="pt-2 text-xs text-[var(--color-text)]/60 border-t border-[var(--color-text)]/10 flex items-center justify-between">
                        <span>{t('home.blog.source')} Lovenda</span>
                        <span>{publishedLabel}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          {newsError ? (
            <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {newsError}
            </div>
          ) : null}
        </section>

        <Nav active="home" />
      </div>

      {/* Modales */}
      {activeModal === 'proveedor' && (
        <ProviderSearchModal
          onClose={() => setActiveModal(null)}
          onSelectProvider={handleQuickAddProvider}
        />
      )}

      {activeModal === 'invitado' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">{t('home.modals.guest.title')}</h2>
            <div className="space-y-4">
              <Input
                label={t('home.modals.guest.name')}
                value={guest.name}
                onChange={(e) => setGuest({ ...guest, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('home.modals.guest.side')}
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded"
                    value={guest.side}
                    onChange={(e) => setGuest({ ...guest, side: e.target.value })}
                  >
                    <option value="novia">{t('home.modals.guest.sideBride')}</option>
                    <option value="novio">{t('home.modals.guest.sideGroom')}</option>
                    <option value="ambos">{t('home.modals.guest.sideBoth')}</option>
                  </select>
                </div>
                <Input
                  label={t('home.modals.guest.contact')}
                  value={guest.contact}
                  onChange={(e) => setGuest({ ...guest, contact: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                {t('home.modals.shared.cancel')}
              </button>
              <button
                onClick={() => handleNavigateFromModal('/invitados')}
                className="px-4 py-2 text-[var(--color-primary)] border border-[var(--color-primary)]/40 rounded bg-[var(--color-primary)]/10"
              >
                {t('home.modals.shared.goToGuests')}
              </button>
              <button
                onClick={async () => {
                  const trimmedName = guest.name.trim();
                  if (!trimmedName) {
                    toast.error(t('home.modals.guest.missingName'));
                    return;
                  }

                  const contact = guest.contact.trim();
                  const payload = {
                    name: trimmedName,
                    tags: guest.side ? [guest.side] : [],
                    status: 'pending',
                  };

                  const notes = [];
                  if (contact) {
                    if (contact.includes('@')) {
                      payload.email = contact;
                    } else if (/^\+?\d[\d\s()-]{3,}$/.test(contact)) {
                      payload.phone = contact;
                    } else {
                      notes.push(t('home.modals.guest.contactNote', { value: contact }));
                    }
                  }
                  notes.push(t('home.modals.guest.note'));
                  payload.notes = notes.join(' | ');

                  try {
                    const result = await addGuestRecord(payload);
                    if (result?.success) {
                      const newGuest = result.guest || {
                        ...payload,
                        id: Date.now(),
                        email: payload.email || '',
                        phone: payload.phone || '',
                      };

                      try {
                        const legacy = JSON.parse(localStorage.getItem('mywed360Guests') || '[]');
                        legacy.push({
                          id: newGuest.id,
                          name: newGuest.name,
                          side: guest.side,
                          contact: guest.contact,
                          status: newGuest.status || 'pending',
                          email: newGuest.email || '',
                          phone: newGuest.phone || '',
                          notes: newGuest.notes || '',
                        });
                        localStorage.setItem('mywed360Guests', JSON.stringify(legacy));
                      } catch {}

                      try {
                        await reloadGuests();
                      } catch {}

                      setGuest({ name: '', side: 'novia', contact: '' });
                      setActiveModal(null);
                      toast.success(t('home.modals.guest.success'));
                    } else {
                      toast.error(result?.error || t('home.modals.guest.error'));
                    }
                  } catch (err) {
                    // console.error('[Home] addGuest quick action failed', err);
                    toast.error(t('home.modals.guest.unknownError'));
                  }
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                {t('home.modals.shared.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'movimiento' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">{t('home.modals.movement.title')}</h2>
            <div className="space-y-4">
              <Input
                label={t('home.modals.movement.concept')}
                value={newMovement.concept}
                onChange={(e) => setNewMovement({ ...newMovement, concept: e.target.value })}
              />
              <Input
                label={t('home.modals.movement.amount')}
                type="number"
                value={newMovement.amount}
                onChange={(e) =>
                  setNewMovement({ ...newMovement, amount: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label={t('home.modals.movement.date')}
                type="date"
                value={newMovement.date}
                onChange={(e) => setNewMovement({ ...newMovement, date: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('home.modals.movement.type')}
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={newMovement.type}
                  onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}
                >
                  <option value="expense">{t('home.modals.movement.expense')}</option>
                  <option value="income">{t('home.modals.movement.income')}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                {t('home.modals.shared.cancel')}
              </button>
              <button
                onClick={() => handleNavigateFromModal('/finance')}
                className="px-4 py-2 text-[var(--color-primary)] border border-[var(--color-primary)]/40 rounded bg-[var(--color-primary)]/10"
              >
                {t('home.modals.shared.goToFinance')}
              </button>
              <button
                onClick={() => {
                  const movs = JSON.parse(localStorage.getItem('quickMovements') || '[]');
                  movs.push({ ...newMovement, id: Date.now() });
                  localStorage.setItem('quickMovements', JSON.stringify(movs));
                  setNewMovement({ concept: '', amount: 0, date: '', type: 'expense' });
                  setActiveModal(null);
                  toast.success(t('home.modals.movement.success'));
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                {t('home.modals.shared.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'nota' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">{t('home.modals.note.title')}</h2>
            <div className="space-y-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded h-32"
                placeholder={t('home.modals.note.placeholder')}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                {t('home.modals.shared.cancel')}
              </button>
              <button
                onClick={() => handleNavigateFromModal('/ideas')}
                className="px-4 py-2 text-[var(--color-primary)] border border-[var(--color-primary)]/40 rounded bg-[var(--color-primary)]/10"
              >
                {t('home.modals.shared.goToIdeas')}
              </button>
              <button
                onClick={() => {
                  const notes = JSON.parse(localStorage.getItem('lovendaNotes') || '[]');
                  notes.push({ text: noteText, id: Date.now() });
                  localStorage.setItem('lovendaNotes', JSON.stringify(notes));
                  setNoteText('');
                  setActiveModal(null);
                  toast.success(t('home.modals.note.success'));
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                {t('home.modals.shared.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
