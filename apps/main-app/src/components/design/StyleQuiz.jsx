/**
 * StyleQuiz - Quiz interactivo de estilo visual
 * FASE 1.3 del WORKFLOW-USUARIO.md
 */
import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { STYLE_QUIZ_QUESTIONS, getTopStyles } from '../../data/styleQuizData';

const QuizOption = ({ option, selected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(option.id)}
      className={`relative p-6 rounded-xl border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div className="text-center">
        <div className="text-5xl mb-3">{option.image}</div>
        <p className="font-medium text-gray-800">{option.label}</p>
        
        {selected && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </button>
  );
};

const ProgressBar = ({ current, total }) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Pregunta {current + 1} de {total}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const ResultCard = ({ style, rank }) => {
  const medals = ['🥇', '🥈', '🥉'];
  const medal = medals[rank] || '⭐';

  return (
    <div className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{medal}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {rank === 0 && '🎯 '}
            {style.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3">{style.description}</p>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Palabras clave: </span>
              <span className="text-gray-600">{style.keywords.join(', ')}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Lugares ideales: </span>
              <span className="text-gray-600">{style.venues.join(', ')}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Colores: </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {style.colors.map((color, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white rounded text-xs border border-gray-200"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Flores: </span>
              <span className="text-gray-600">{style.flowers.join(', ')}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Decoración: </span>
              <span className="text-gray-600">{style.decor.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StyleQuiz({ onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  const question = STYLE_QUIZ_QUESTIONS[currentQuestion];
  const currentAnswer = answers.find(a => a.questionId === question?.id);
  const canGoNext = !!currentAnswer;
  const isLastQuestion = currentQuestion === STYLE_QUIZ_QUESTIONS.length - 1;

  const handleSelectOption = useCallback((optionId) => {
    setAnswers((prev) => {
      const filtered = prev.filter(a => a.questionId !== question.id);
      return [...filtered, { questionId: question.id, optionId }];
    });
  }, [question]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      const topStyles = getTopStyles(answers, 3);
      setResults(topStyles);
      setShowResults(true);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  }, [isLastQuestion, answers]);

  const handleBack = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  const handleRestart = useCallback(() => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setResults(null);
  }, []);

  const handleFinish = useCallback(() => {
    if (onComplete && results) {
      onComplete({
        topStyle: results[0],
        allResults: results,
        answers,
      });
    }
  }, [onComplete, results, answers]);

  if (showResults && results) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Resultados del Quiz!
          </h2>
          <p className="text-gray-600">
            Tus 3 estilos más compatibles
          </p>
        </div>

        <div className="space-y-4">
          {results.map((style, index) => (
            <ResultCard key={style.id} style={style} rank={index} />
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleRestart}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Repetir quiz
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Guardar resultados
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            💡 Estos resultados se guardarán en tu perfil de boda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar current={currentQuestion} total={STYLE_QUIZ_QUESTIONS.length} />

      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {question.question}
        </h3>
        <p className="text-sm text-gray-600">
          Selecciona la opción que más te represente
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {question.options.map((option) => (
          <QuizOption
            key={option.id}
            option={option}
            selected={currentAnswer?.optionId === option.id}
            onSelect={handleSelectOption}
          />
        ))}
      </div>

      <div className="flex gap-3 pt-6">
        <button
          onClick={handleBack}
          disabled={currentQuestion === 0}
          className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Anterior
        </button>
        
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLastQuestion ? 'Ver resultados' : 'Siguiente'}
          {!isLastQuestion && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {!canGoNext && (
        <p className="text-center text-sm text-orange-600">
          Selecciona una opción para continuar
        </p>
      )}
    </div>
  );
}
