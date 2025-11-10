import React, { useMemo } from 'react';

import useFinance from '../../../hooks/useFinance';

export const BudgetWidget = ({ config = {} }) => {
  const { currency = '€' } = config;
  const { stats, budgetUsage } = useFinance();

  const { total, spent, remaining, categories } = useMemo(() => {
    const total = Number(stats?.totalBudget || 0);
    const spent = Number(stats?.totalSpent || 0);
    const remaining = Math.max(total - spent, 0);
    // Mapear categorías desde budgetUsage
    const categories = Array.isArray(budgetUsage)
      ? budgetUsage.map((c) => ({ name: c.name, budget: c.amount, spent: c.spent }))
      : [];
    return { total, spent, remaining, categories };
  }, [stats, budgetUsage]);

  const percentageSpent = total > 0 ? Math.round((spent / total) * 100) : 0;
  const percentageRemaining = 100 - percentageSpent;

  return (
    <div className="h-full">
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Presupuesto total</span>
          <span className="text-sm font-semibold">
            {total.toLocaleString()}
            {currency}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${percentageSpent}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{percentageSpent}% gastado</span>
          <span>{percentageRemaining}% restante</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm">Total gastado:</span>
          <span className="font-medium">
            {spent.toLocaleString()}
            {currency}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Restante:</span>
          <span className="font-medium">
            {remaining.toLocaleString()}
            {currency}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Por categoría:</h4>
        <div className="space-y-2">
          {categories.map((category, index) => {
            const categoryPercentage = Math.round((category.spent / category.budget) * 100) || 0;
            const isOverBudget = category.spent > category.budget;

            return (
              <div key={index} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>{category.name}</span>
                  <span className={isOverBudget ? 'text-red-600' : ''}>
                    {category.spent.toLocaleString()}
                    {currency} / {category.budget.toLocaleString()}
                    {currency}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(categoryPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-right">
        <a href="/finance#budget" className="text-sm text-blue-600 hover:text-blue-800">
          Ver presupuesto detallado →
        </a>
      </div>
    </div>
  );
};
