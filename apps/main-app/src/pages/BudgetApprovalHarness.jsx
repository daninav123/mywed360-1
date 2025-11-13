/**
 * BudgetApprovalHarness
 * ---------------------
 * Este componente se reservaba únicamente para test E2E. Se ha movido a `src/pages/test/BudgetApprovalHarness.jsx`
 * y ya no debe importarse desde la aplicación. Se mantiene el archivo como guardarraíl.
 */

if (import.meta.env.DEV) {
  // console.warn('[BudgetApprovalHarness] Este archivo es un guardarraíl; usa src/pages/test/BudgetApprovalHarness.jsx');
}

export default function BudgetApprovalHarnessGuardRail() {
  if (import.meta.env.DEV) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>BudgetApprovalHarness</h1>
        <p>
          Este componente ahora vive en <code>src/pages/test/BudgetApprovalHarness.jsx</code>.
        </p>
      </div>
    );
  }

  return null;
}
