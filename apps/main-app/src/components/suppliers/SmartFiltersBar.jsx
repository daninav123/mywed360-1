import React, { useState, useEffect } from 'react';
import { Sparkles, Edit2, RotateCcw, DollarSign, Users, Palette, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../Input';
import useTranslations from '../../hooks/useTranslations';

const detectFiltersFromProfile = (weddingProfile) => {
  if (!weddingProfile) {
    return { budget: null, guests: null, style: null, location: null, ceremonyType: null };
  }

  const profile = weddingProfile.weddingInfo || weddingProfile;
  const eventProfile = weddingProfile.eventProfile || profile.eventProfile;

  // Detectar estilo (puede venir de preferences o eventProfile)
  const style =
    profile.style ||
    profile.weddingStyle ||
    profile.theme ||
    weddingProfile.preferences?.style ||
    null;

  // Detectar tipo de ceremonia
  const ceremonyType = eventProfile?.ceremonyType || profile.ceremonyType || null;

  return {
    budget:
      profile.budget ||
      profile.estimatedBudget ||
      profile.totalBudget ||
      profile.presupuesto ||
      null,
    guests:
      profile.guestCount ||
      profile.guestEstimate ||
      profile.expectedGuests ||
      profile.guests ||
      eventProfile?.guestCountRange ||
      null,
    style,
    location:
      profile.location?.city ||
      profile.city ||
      profile.celebrationPlace ||
      profile.receptionVenue ||
      profile.ceremonyPlace ||
      profile.ceremonyLocation ||
      null,
    ceremonyType,
  };
};

const SmartFiltersBar = ({ weddingProfile, onFiltersChange, className = '' }) => {
  const { t, format } = useTranslations();

  const [filters, setFilters] = useState({
    budget: null,
    guests: null,
    style: null,
    location: null,
  });

  const [editing, setEditing] = useState({
    budget: false,
    guests: false,
    style: false,
    location: false,
  });

  const [tempValues, setTempValues] = useState({
    budget: '',
    guests: '',
    style: '',
    location: '',
  });

  useEffect(() => {
    if (!weddingProfile) {
      return;
    }

    const detected = detectFiltersFromProfile(weddingProfile);
    setFilters(detected);

    if (onFiltersChange) {
      onFiltersChange(detected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingProfile]);

  const handleStartEdit = (field) => {
    setEditing((prev) => ({ ...prev, [field]: true }));
    setTempValues((prev) => ({
      ...prev,
      [field]:
        filters[field] !== null && filters[field] !== undefined ? String(filters[field]) : '',
    }));
  };

  const handleSaveEdit = (field) => {
    const value = tempValues[field].trim();
    let parsedValue = null;

    if (value.length > 0) {
      if (field === 'budget' || field === 'guests') {
        const numericValue = Number(value);
        parsedValue = Number.isFinite(numericValue) ? numericValue : null;
      } else {
        parsedValue = value;
      }
    }

    const newFilters = { ...filters, [field]: parsedValue };
    setFilters(newFilters);
    setEditing((prev) => ({ ...prev, [field]: false }));
    setTempValues((prev) => ({ ...prev, [field]: '' }));

    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleCancelEdit = (field) => {
    setEditing((prev) => ({ ...prev, [field]: false }));
    setTempValues((prev) => ({ ...prev, [field]: '' }));
  };

  const handleReset = () => {
    const detected = detectFiltersFromProfile(weddingProfile);
    setFilters(detected);
    setEditing({ budget: false, guests: false, style: false, location: false });
    setTempValues({ budget: '', guests: '', style: '', location: '' });

    if (onFiltersChange) {
      onFiltersChange(detected);
    }
  };

  const handleClear = () => {
    const empty = { budget: null, guests: null, style: null, location: null };
    setFilters(empty);
    setEditing({ budget: false, guests: false, style: false, location: false });
    setTempValues({ budget: '', guests: '', style: '', location: '' });

    if (onFiltersChange) {
      onFiltersChange(empty);
    }
  };

  if (!weddingProfile) {
    return null;
  }

  const hasValue = (value) => value !== null && value !== undefined && value !== '';
  const hasActiveFilters = Object.values(filters).some((value) => hasValue(value));
  const financeSection = t('navigation.finance');

  const containerClassName =
    `bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 ${className}`.trim();

  return (
    <Card className={containerClassName}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">{t('suppliers.smartFilters.title')}</h3>
            <span className="text-xs text-muted">{t('suppliers.smartFilters.subtitle')}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title={t('suppliers.smartFilters.buttons.resetTitle')}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">{t('suppliers.smartFilters.buttons.reset')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              title={t('suppliers.smartFilters.buttons.clearTitle')}
            >
              {t('suppliers.smartFilters.buttons.clear')}
            </Button>
          </div>
        </div>

        {!hasActiveFilters && (
          <div className="text-sm text-muted">
            <p>{t('suppliers.smartFilters.empty.title')}</p>
            <p className="mt-1">
              {t('suppliers.smartFilters.empty.hint', { section: financeSection })}
            </p>
          </div>
        )}

        {hasActiveFilters && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {hasValue(filters.budget) && (
                <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-3 border border-soft">
                  <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                  {editing.budget ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="number"
                        value={tempValues.budget}
                        onChange={(e) =>
                          setTempValues((prev) => ({ ...prev, budget: e.target.value }))
                        }
                        placeholder={t('suppliers.smartFilters.fields.budget.placeholder')}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSaveEdit('budget')}>
                        {t('app.save')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleCancelEdit('budget')}>
                        {t('app.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="text-xs text-muted">
                          {t('suppliers.smartFilters.fields.budget.label')}
                        </div>
                        <div className="font-medium text-foreground">
                          {format.number(Number(filters.budget))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEdit('budget')}
                        className="text-muted hover:text-primary transition-colors"
                        title={t('suppliers.smartFilters.fields.budget.editTitle')}
                        aria-label={t('suppliers.smartFilters.fields.budget.editTitle')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {hasValue(filters.guests) && (
                <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-3 border border-soft">
                  <Users className="h-4 w-4 text-primary flex-shrink-0" />
                  {editing.guests ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="number"
                        value={tempValues.guests}
                        onChange={(e) =>
                          setTempValues((prev) => ({ ...prev, guests: e.target.value }))
                        }
                        placeholder={t('suppliers.smartFilters.fields.guests.placeholder')}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSaveEdit('guests')}>
                        {t('app.save')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleCancelEdit('guests')}>
                        {t('app.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="text-xs text-muted">
                          {t('suppliers.smartFilters.fields.guests.label')}
                        </div>
                        <div className="font-medium text-foreground">
                          {format.number(Number(filters.guests))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEdit('guests')}
                        className="text-muted hover:text-primary transition-colors"
                        title={t('suppliers.smartFilters.fields.guests.editTitle')}
                        aria-label={t('suppliers.smartFilters.fields.guests.editTitle')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {hasValue(filters.style) && (
                <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-3 border border-soft">
                  <Palette className="h-4 w-4 text-primary flex-shrink-0" />
                  {editing.style ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="text"
                        value={tempValues.style}
                        onChange={(e) =>
                          setTempValues((prev) => ({ ...prev, style: e.target.value }))
                        }
                        placeholder={t('suppliers.smartFilters.fields.style.placeholder')}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSaveEdit('style')}>
                        {t('app.save')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleCancelEdit('style')}>
                        {t('app.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="text-xs text-muted">
                          {t('suppliers.smartFilters.fields.style.label')}
                        </div>
                        <div className="font-medium text-foreground capitalize">
                          {filters.style}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEdit('style')}
                        className="text-muted hover:text-primary transition-colors"
                        title={t('suppliers.smartFilters.fields.style.editTitle')}
                        aria-label={t('suppliers.smartFilters.fields.style.editTitle')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {hasValue(filters.location) && (
                <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-3 border border-soft">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  {editing.location ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="text"
                        value={tempValues.location}
                        onChange={(e) =>
                          setTempValues((prev) => ({ ...prev, location: e.target.value }))
                        }
                        placeholder={t('suppliers.smartFilters.fields.location.placeholder')}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSaveEdit('location')}>
                        {t('app.save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelEdit('location')}
                      >
                        {t('app.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="text-xs text-muted">
                          {t('suppliers.smartFilters.fields.location.label')}
                        </div>
                        <div className="font-medium text-foreground capitalize">
                          {filters.location}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEdit('location')}
                        className="text-muted hover:text-primary transition-colors"
                        title={t('suppliers.smartFilters.fields.location.editTitle')}
                        aria-label={t('suppliers.smartFilters.fields.location.editTitle')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-muted">{t('suppliers.smartFilters.hints.automated')}</p>
          </>
        )}
      </div>
    </Card>
  );
};

export default SmartFiltersBar;
