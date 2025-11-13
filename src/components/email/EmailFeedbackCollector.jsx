import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import useTranslations from '../../hooks/useTranslations';
import { performanceMonitor } from '../../services/PerformanceMonitor';

const EmailFeedbackCollector = ({ onSubmit, isMinimized = false, emailId = null }) => {
  const { t } = useTranslations();
  const tEmail = (key, options) => t(key, { ns: 'email', ...options });

  const [formData, setFormData] = useState({
    rating: 0,
    usability: null,
    performance: null,
    features: [],
    improvement: '',
    featureRequest: '',
  });
  const [step, setStep] = useState(1);
  const [isExpanded, setIsExpanded] = useState(!isMinimized);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const featureOptions = [
    { id: 'alias', label: tEmail('feedback.options.features.alias') },
    { id: 'templates', label: tEmail('feedback.options.features.templates') },
    { id: 'tracking', label: tEmail('feedback.options.features.tracking') },
    { id: 'events', label: tEmail('feedback.options.features.events') },
    { id: 'search', label: tEmail('feedback.options.features.search') },
    { id: 'notifications', label: tEmail('feedback.options.features.notifications') },
  ];

  const performanceOptions = [
    { value: 'very_slow', label: tEmail('feedback.options.performance.verySlow') },
    { value: 'slow', label: tEmail('feedback.options.performance.slow') },
    { value: 'acceptable', label: tEmail('feedback.options.performance.acceptable') },
    { value: 'fast', label: tEmail('feedback.options.performance.fast') },
    { value: 'very_fast', label: tEmail('feedback.options.performance.veryFast') },
  ];

  const usabilityOptions = [
    { value: 'very_difficult', label: tEmail('feedback.options.usability.veryDifficult') },
    { value: 'difficult', label: tEmail('feedback.options.usability.difficult') },
    { value: 'neutral', label: tEmail('feedback.options.usability.neutral') },
    { value: 'easy', label: tEmail('feedback.options.usability.easy') },
    { value: 'very_easy', label: tEmail('feedback.options.usability.veryEasy') },
  ];

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (type === 'checkbox') {
      const updatedFeatures = checked
        ? [...formData.features, value]
        : formData.features.filter((feature) => feature !== value);
      setFormData((prev) => ({ ...prev, features: updatedFeatures }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSetRating = (ratingValue) => {
    setFormData((prev) => ({ ...prev, rating: ratingValue }));
  };

  const handleNextStep = () => setStep((prev) => prev + 1);
  const handlePrevStep = () => setStep((prev) => prev - 1);
  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      performanceMonitor.logEvent('email_feedback_submitted', {
        rating: formData.rating,
        usability: formData.usability,
        performance: formData.performance,
        emailId,
      });

      if (onSubmit) {
        await onSubmit({
          ...formData,
          timestamp: new Date().toISOString(),
          emailId,
        });
      }

      setIsSubmitted(true);

      setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
    } catch (error) {
      // console.error('Error al enviar feedback:', error);
      performanceMonitor.logError('feedback_submission', error, { emailId });
      alert(tEmail('feedback.messages.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        data-testid="feedback-toggle"
        onClick={toggleExpanded}
        className="fixed bottom-4 right-4 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 z-50"
        aria-label={tEmail('feedback.header.toggleAria')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 w-80 md:w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden"
      data-testid="feedback-form"
    >
      <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-medium text-lg">{tEmail('feedback.header.title')}</h3>
        <button
          onClick={toggleExpanded}
          className="text-white hover:text-indigo-200 focus:outline-none"
          aria-label={tEmail('feedback.header.closeAria')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="p-4">
        {isSubmitted ? (
          <div className="text-center py-6" data-testid="feedback-thanks">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h4 className="mt-3 text-xl font-medium text-gray-800">
              {tEmail('feedback.thanks.title')}
            </h4>
            <p className="mt-1 text-gray-600">{tEmail('feedback.thanks.subtitle')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} data-testid="feedback-form-inner">
            {step === 1 && (
              <div>
                <h4 className="font-medium mb-3">
                  {tEmail('feedback.steps.rating.question')}
                </h4>
                <div className="flex justify-center space-x-4 mb-4">
                  {[1, 2, 3, 4, 5].map((ratingValue) => (
                    <button
                      key={ratingValue}
                      type="button"
                      onClick={() => handleSetRating(ratingValue)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                        formData.rating === ratingValue
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-label={tEmail('feedback.steps.rating.ratingAria', {
                        value: ratingValue,
                      })}
                    >
                      {ratingValue}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-500 px-2 mb-4">
                  <span>{tEmail('feedback.steps.rating.scaleStart')}</span>
                  <span>{tEmail('feedback.steps.rating.scaleEnd')}</span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={formData.rating === 0}
                    className={`px-4 py-2 rounded-md ${
                      formData.rating === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {tEmail('feedback.common.next')}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h4 className="font-medium mb-3">
                  {tEmail('feedback.steps.usability.title')}
                </h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tEmail('feedback.steps.usability.usabilityLabel')}
                  </label>
                  <select
                    name="usability"
                    value={formData.usability || ''}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">{tEmail('feedback.common.selectOption')}</option>
                    {usabilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tEmail('feedback.steps.usability.performanceLabel')}
                  </label>
                  <select
                    name="performance"
                    value={formData.performance || ''}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">{tEmail('feedback.common.selectOption')}</option>
                    {performanceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    {tEmail('feedback.common.back')}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!formData.usability || !formData.performance}
                    className={`px-4 py-2 rounded-md ${
                      !formData.usability || !formData.performance
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {tEmail('feedback.common.next')}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h4 className="font-medium mb-3">
                  {tEmail('feedback.steps.features.title')}
                </h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tEmail('feedback.steps.features.featureLabel')}
                  </label>
                  <div className="space-y-2">
                    {featureOptions.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={option.id}
                          name="features"
                          value={option.id}
                          checked={formData.features.includes(option.id)}
                          onChange={handleChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={option.id} className="ml-2 block text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="improvement"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {tEmail('feedback.steps.features.improvementLabel')}
                  </label>
                  <textarea
                    id="improvement"
                    name="improvement"
                    value={formData.improvement}
                    onChange={handleChange}
                    rows="2"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={tEmail('feedback.steps.features.improvementPlaceholder')}
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="featureRequest"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {tEmail('feedback.steps.features.featureRequestLabel')}
                  </label>
                  <textarea
                    id="featureRequest"
                    name="featureRequest"
                    value={formData.featureRequest}
                    onChange={handleChange}
                    rows="2"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={tEmail('feedback.steps.features.featureRequestPlaceholder')}
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    {tEmail('feedback.common.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-md ${
                      isSubmitting
                        ? 'bg-indigo-400 cursor-not-allowed text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                        {tEmail('feedback.common.sending')}
                      </>
                    ) : (
                      tEmail('feedback.steps.features.submit')
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

EmailFeedbackCollector.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isMinimized: PropTypes.bool,
  emailId: PropTypes.string,
};

export default EmailFeedbackCollector;
