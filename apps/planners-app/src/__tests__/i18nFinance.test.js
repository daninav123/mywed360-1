import en from '../i18n/locales/en/common.json';
import es from '../i18n/locales/es/common.json';
import fr from '../i18n/locales/fr/common.json';

const hasPath = (obj, path) =>
  path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj) !== undefined;

describe('i18n finance keys', () => {
  const requiredPaths = [
    // Overview
    'finance.overview.title',
    'finance.overview.subtitle',
    'finance.overview.lastSync',
    'finance.overview.synced',
    'finance.overview.offline',
    'finance.overview.totalBudget',
    'finance.overview.totalSpent',
    'finance.overview.ofBudget',
    'finance.overview.currentBalance',
    'finance.overview.expectedIncome',
    'finance.overview.used',
    'finance.overview.categoryStatus',
    // Transactions (subset)
    'finance.transactions.title',
    'finance.transactions.headers.date',
    'finance.transactions.headers.concept',
    'finance.transactions.headers.category',
    'finance.transactions.headers.type',
    'finance.transactions.headers.amount',
    'finance.transactions.headers.actions',
    // Form
    'finance.form.type',
    'finance.form.concept',
    'finance.form.amount',
    'finance.form.date',
    'finance.form.category',
    'finance.form.description',
    'finance.form.errors.conceptRequired',
    'finance.form.errors.amountPositive',
    'finance.form.errors.dateRequired',
    'finance.form.errors.categoryRequired',
    // Contributions (subset)
    'finance.contributions.title',
    'finance.contributions.initial.title',
    'finance.contributions.monthly.title',
    'finance.contributions.gifts.title',
    // Bank connect (subset)
    'finance.bank.title',
    'finance.bank.country',
    'finance.bank.bankLabel',
    'finance.bank.loadBanks',
    'finance.bank.connect',
    // Charts (subset)
    'finance.charts.title',
    'finance.charts.subtitle',
    'finance.charts.totalTransactions',
    'finance.charts.activeCategories',
  ];

  it('ES locale contains required finance keys', () => {
    for (const p of requiredPaths) {
      expect(hasPath(es, p)).toBe(true);
    }
  });

  it('EN locale contains required finance keys', () => {
    for (const p of requiredPaths) {
      expect(hasPath(en, p)).toBe(true);
    }
  });

  it('FR locale contains required finance keys', () => {
    for (const p of requiredPaths) {
      expect(hasPath(fr, p)).toBe(true);
    }
  });
});
