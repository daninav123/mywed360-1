import AccessTime from '@mui/icons-material/AccessTime';
import Category from '@mui/icons-material/Category';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Edit from '@mui/icons-material/Edit';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Lightbulb from '@mui/icons-material/Lightbulb';
import Schedule from '@mui/icons-material/Schedule';
import Subject from '@mui/icons-material/Subject';
import TipsAndUpdates from '@mui/icons-material/TipsAndUpdates';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import {
  Box,
  Typography,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Tooltip,
  Rating,
  Grid,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import EmailRecommendationService from '../../services/EmailRecommendationService';
import useTranslations from '../../hooks/useTranslations';

const EmailRecommendationsPanel = ({ category, searchQuery, onApplyRecommendation }) => {
  const { t, tVars } = useTranslations();
  const tEmail = useCallback((key, options) => t(key, { ns: 'email', ...options }), [t]);
  const tEmailVars = useCallback(
    (key, variables) => tVars(key, { ns: 'email', ...variables }),
    [tVars]
  );

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

  const recommendationService = useMemo(() => new EmailRecommendationService(), []);

  useEffect(() => {
    const generateRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = recommendationService.generateRecommendations(category, searchQuery);
        setRecommendations(data);
      } catch (err) {
        console.error('Error generating recommendations:', err);
        setError(tEmail('recommendations.errors.generate'));
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [category, searchQuery, recommendationService, tEmail]);

  const handleApplyRecommendation = (type, data) => {
    if (onApplyRecommendation) {
      onApplyRecommendation(type, data);
    }
  };

  const renderConfidenceIndicator = () => {
    if (!recommendations) return null;

    const score = recommendations.confidenceScore || 0;
    const level =
      score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    const chipColor =
      level === 'high' ? 'success' : level === 'medium' ? 'warning' : 'error';
    const label = tEmail(`recommendations.confidence.levels.${level}`);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" mr={1}>
          {tEmail('recommendations.confidence.label')}
        </Typography>
        <Chip
          size="small"
          label={tEmailVars('recommendations.confidence.chip', { label, score })}
          color={chipColor}
          icon={<VerifiedUser fontSize="small" />}
        />
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          {tEmail('recommendations.loading')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!recommendations) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        {tEmail('recommendations.empty')}
      </Alert>
    );
  }

  const bestTime = recommendations.bestTimeToSend;
  const subjectLine = recommendations.subjectLineRecommendations;
  const customization = recommendations.customizationImpact;
  const templateRecommendations = recommendations.templateRecommendations;
  const responseTimes = recommendations.responseTimeExpectations;
  const categorySpecific = recommendations.categorySpecific;
  const querySpecific = recommendations.querySpecific;

  const categoryLabel = category || tEmail('recommendations.sections.categorySpecific.generic');

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {tEmail('recommendations.title')}
        </Typography>
        <Tooltip title={tEmail('recommendations.tooltip')}>
          <TipsAndUpdates color="primary" />
        </Tooltip>
      </Box>

      {renderConfidenceIndicator()}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <AccessTime color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                {tEmail('recommendations.sections.bestTime.title')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {bestTime?.hasSufficientData ? (
                  <>
                    <Typography variant="body1">
                      {tEmailVars('recommendations.sections.bestTime.result', {
                        time: bestTime.bestTimeSlotName,
                        rate: bestTime.bestRate,
                      })}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Schedule />}
                        onClick={() => handleApplyRecommendation('time', bestTime)}
                      >
                        {tEmail('recommendations.sections.bestTime.button')}
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {tEmail('recommendations.sections.bestTime.fallback')}
                  </Alert>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Subject color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                {tEmail('recommendations.sections.subject.title')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {tEmail('recommendations.sections.subject.label')}
              </Typography>
              <List dense disablePadding>
                {subjectLine?.recommendedPatterns?.map((pattern, idx) => (
                  <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CheckCircle fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText primary={pattern} primaryTypographyProps={{ variant: 'body2' }} />
                    <Button size="small" onClick={() => handleApplyRecommendation('subject', pattern)}>
                      {tEmail('recommendations.sections.subject.button')}
                    </Button>
                  </ListItem>
                ))}
              </List>

              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                {tEmailVars('recommendations.sections.subject.length', {
                  min: subjectLine?.optimalLength?.min ?? 0,
                  max: subjectLine?.optimalLength?.max ?? 0,
                })}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Edit color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                {tEmail('recommendations.sections.customization.title')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {customization?.hasSufficientData ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" mr={1}>
                      {tEmailVars('recommendations.sections.customization.summary', {
                        customized: customization.customized?.rate ?? 0,
                        plain: customization.nonCustomized?.rate ?? 0,
                      })}
                    </Typography>
                    <Rating
                      value={customization.impactScore || 0}
                      max={5}
                      readOnly
                      size="small"
                      precision={0.1}
                    />
                  </Box>
                  <Divider sx={{ mx: 2 }} />
                  <Box sx={{ display: 'flex', mt: 2, justifyContent: 'space-around' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">{customization.customized?.rate ?? 0}%</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tEmail('recommendations.sections.customization.labels.customized')}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">
                        {customization.nonCustomized?.rate ?? 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tEmail('recommendations.sections.customization.labels.nonCustomized')}
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  {customization?.recommendCustomization
                    ? tEmail('recommendations.sections.customization.fallback.recommend')
                    : tEmail('recommendations.sections.customization.fallback.insufficient')}
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Category color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                {tEmail('recommendations.sections.templates.title')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {templateRecommendations?.hasSufficientData ? (
                <>
                  <Typography variant="body1">
                    {tEmailVars('recommendations.sections.templates.summary', {
                      template: templateRecommendations.bestOverallTemplate,
                      rate: templateRecommendations.bestOverallResponseRate,
                    })}
                  </Typography>

                  {templateRecommendations.categorySpecificTemplate && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        {tEmailVars('recommendations.sections.templates.category', {
                          category:
                            templateRecommendations.categorySpecificTemplate.category || categoryLabel,
                          rate: templateRecommendations.categorySpecificTemplate.responseRate,
                        })}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        handleApplyRecommendation(
                          'template',
                          templateRecommendations.bestOverallTemplate
                        )
                      }
                    >
                      {tEmail('recommendations.sections.templates.button')}
                    </Button>
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  {tEmail('recommendations.sections.templates.fallback')}
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Schedule color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                {tEmail('recommendations.sections.responseTime.title')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {responseTimes?.hasSufficientData ? (
                <>
                  <Typography variant="body1">
                    {tEmailVars('recommendations.sections.responseTime.average', {
                      value: responseTimes.averageTime,
                    })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {tEmailVars('recommendations.sections.responseTime.median', {
                      value: responseTimes.medianTime,
                    })}
                  </Typography>
                  <Box sx={{ display: 'flex', mt: 1, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {tEmailVars('recommendations.sections.responseTime.fastest', {
                        value: responseTimes.fastestResponse,
                      })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tEmailVars('recommendations.sections.responseTime.slowest', {
                        value: responseTimes.slowestResponse,
                      })}
                    </Typography>
                  </Box>
                  {responseTimes.categoryAverageTime && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {tEmailVars('recommendations.sections.responseTime.category', {
                        value: responseTimes.categoryAverageTime,
                      })}
                    </Typography>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  {tEmail('recommendations.sections.responseTime.fallback')}
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {categorySpecific && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Lightbulb color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  {tEmailVars('recommendations.sections.categorySpecific.title', {
                    category: categoryLabel,
                  })}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {categorySpecific.hasSufficientData ? (
                  <>
                    <Typography variant="body2" gutterBottom>
                      {tEmailVars('recommendations.sections.categorySpecific.responseRate', {
                        rate: categorySpecific.responseRate,
                      })}
                    </Typography>
                    <List dense>
                      {categorySpecific.recommendations.map((rec, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                ) : (
                  <Alert severity="info">
                    {tEmail('recommendations.sections.categorySpecific.fallback')}
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        {querySpecific && querySpecific.recommendations.length > 0 && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Lightbulb color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  {tEmail('recommendations.sections.querySpecific.title')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {querySpecific.recommendations.map((rec, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EmailRecommendationsPanel;
