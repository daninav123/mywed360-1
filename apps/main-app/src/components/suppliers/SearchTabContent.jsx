import React from 'react';
import { Search, Grid, List, Filter, ArrowUpDown, Sliders } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../Input';
import SupplierCard from './SupplierCard';

const SearchTabContent = ({
  searchInput,
  setSearchInput,
  handleSearchSubmit,
  handleClearSearch,
  onOpenFilters,
  activeFiltersCount = 0,
  aiLoading,
  aiError,
  searchCompleted,
  filteredResults,
  paginatedResults,
  searchResultsPage,
  totalSearchPages,
  handlePrevSearchPage,
  handleNextSearchPage,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  onViewDetails,
  onContact,
  onMarkAsConfirmed,
  t,
}) => {
  return (
    <div className="space-y-6">
      {/* Buscador Compacto */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Input de búsqueda */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar fotógrafo, catering, local..."
                className="pl-11 pr-4 py-3 text-base"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2">
              <Button type="submit" size="md" leftIcon={<Search size={18} />} disabled={aiLoading}>
                {aiLoading ? 'Buscando...' : 'Buscar'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                leftIcon={<Filter size={18} />}
                onClick={onOpenFilters}
              >
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {searchInput && (
                <Button type="button" variant="ghost" size="md" onClick={handleClearSearch}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Resultados */}
      {searchCompleted && (
        <div className="space-y-4">
          {/* Header de resultados */}
          {filteredResults.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filteredResults.length}</span>{' '}
                proveedor{filteredResults.length !== 1 ? 'es' : ''} encontrado
                {filteredResults.length !== 1 ? 's' : ''}
              </p>

              <div className="flex items-center gap-3">
                {/* Ordenar */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="relevance">Relevancia</option>
                    <option value="rating">Mejor valorados</option>
                    <option value="price">Precio (menor a mayor)</option>
                    <option value="reviews">Más reseñas</option>
                  </select>
                </div>

                {/* Vista Grid/Lista */}
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Vista en cuadrícula"
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Vista en lista"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid/List de resultados */}
          {aiLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-40 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : aiError ? (
            <Card className="p-6 border-red-200 bg-red-50">
              <p className="text-sm text-red-700">
                {aiError.message || 'Error al buscar proveedores'}
              </p>
            </Card>
          ) : paginatedResults.length === 0 && searchCompleted ? (
            <Card className="p-8 text-center">
              <div className="space-y-2">
                <Search className="w-12 h-12 mx-auto text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No se encontraron resultados</h3>
                <p className="text-sm text-gray-600">Intenta ajustar tu búsqueda o los filtros</p>
              </div>
            </Card>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'
                }
              >
                {paginatedResults.map((supplier) => (
                  <SupplierCard
                    key={supplier.id || supplier.slug || Math.random()}
                    supplier={supplier}
                    viewMode={viewMode}
                    onContact={(contactInfo) => onContact(contactInfo)}
                    onViewDetails={(s) => onViewDetails(s)}
                    onMarkAsConfirmed={onMarkAsConfirmed}
                  />
                ))}
              </div>

              {/* Paginación */}
              {totalSearchPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handlePrevSearchPage}
                    disabled={searchResultsPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {searchResultsPage} de {totalSearchPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleNextSearchPage}
                    disabled={searchResultsPage === totalSearchPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Estado inicial sin búsqueda */}
      {!searchCompleted && !aiLoading && (
        <Card className="p-12 text-center">
          <div className="space-y-4 max-w-md mx-auto">
            <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Encuentra a tus proveedores ideales
            </h3>
            <p className="text-sm text-gray-600">
              Busca entre miles de proveedores verificados para tu boda. Compara precios, lee
              reseñas y contacta directamente.
            </p>
            <div className="pt-2">
              <Button size="lg" onClick={() => handleSearchSubmit()}>
                <Search className="w-5 h-5 mr-2" />
                Comenzar búsqueda
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SearchTabContent;
