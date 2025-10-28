import React from 'react';

const AdminSuppliers = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Proveedores</h1>
        <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
          Esta sección estará disponible próximamente. Aquí gestionaremos el directorio,
          verificaciones y seguimiento operativo de los proveedores.
        </p>
      </header>

      <section className="rounded-xl border border-dashed border-soft bg-surface px-4 py-12 text-center text-sm text-[var(--color-text-soft,#6b7280)]">
        Aún no hay contenido publicado. Estamos preparando el módulo de proveedores.
      </section>
    </div>
  );
};

export default AdminSuppliers;
