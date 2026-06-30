import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { View, DiagnosisMeta } from '../types';

interface RecommendationsProps {
  onNavigate: (view: View) => void;
  meta?: DiagnosisMeta;
}

// ─── Tipo de producto VTEX (mapeado en /api/tire-search) ─────────────────────
interface VtexProduct {
  id: string;
  name: string;
  brand: string;
  brandImage: string;
  image: string;
  price: number;
  listPrice: number;
  available: boolean;
  link: string;
  ancho: string;
  perfil: string;
  rin: string;
}

// ─── Skeleton mientras carga ──────────────────────────────────────────────────
const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-avante-gray-100 p-6 animate-pulse">
    <div className="mx-auto w-36 h-36 bg-avante-gray-100 rounded-xl mb-4" />
    <div className="h-4 bg-avante-gray-100 rounded w-3/4 mx-auto mb-2" />
    <div className="h-4 bg-avante-gray-100 rounded w-1/2 mx-auto mb-6" />
    <div className="h-10 bg-avante-gray-100 rounded-lg" />
  </div>
);

// ─── Tarjeta de producto real VTEX ────────────────────────────────────────────
const ProductCard: React.FC<{ product: VtexProduct }> = ({ product }) => {
  const hasDiscount = product.listPrice > product.price;
  const discount = hasDiscount
    ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-avante-gray-100 flex flex-col hover:shadow-md transition-shadow duration-200">
      <div className="relative p-6 pb-2">
        {hasDiscount && (
          <span className="absolute top-4 right-4 bg-[#ba0c2f] text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        <img
          src={product.image}
          alt={product.name}
          className="mx-auto h-40 w-40 object-contain"
          onError={e => { (e.target as HTMLImageElement).src = '/avante-icono.png'; }}
        />
      </div>

      <div className="px-6 pb-2 flex-1 flex flex-col">
        {/* Marca */}
        <p className="text-xs font-semibold text-avante-gray-200 uppercase tracking-wide mb-1">
          {product.brand}
        </p>
        {/* Nombre */}
        <h3 className="text-sm font-bold text-avante-gray-300 leading-snug mb-3 line-clamp-2">
          {product.name}
        </h3>

        {/* Medida badge */}
        {(product.ancho || product.rin) && (
          <span className="self-start bg-avante-blue/10 text-avante-blue text-xs font-bold px-2 py-1 rounded mb-3">
            {product.ancho}/{product.perfil}R{product.rin}
          </span>
        )}

        {/* Precio */}
        <div className="mt-auto">
          {hasDiscount && (
            <p className="text-xs text-avante-gray-200 line-through">
              ${product.listPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-2xl font-extrabold text-avante-blue">
            ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-avante-gray-200 mb-4">c/u · IVA incluido</p>
        </div>
      </div>

      {/* CTA — manda directo a grupoavante.org */}
      <div className="px-6 pb-6">
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-avante-blue hover:bg-[#002070] text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 text-sm"
        >
          Comprar en grupoavante.org →
        </a>
      </div>
    </div>
  );
};

// ─── Vista principal ──────────────────────────────────────────────────────────
export const Recommendations: React.FC<RecommendationsProps> = ({ onNavigate, meta }) => {
  const [products, setProducts] = useState<VtexProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Medida que trajo el cuestionario, normalizada
  const tireSize = meta?.tireSize?.trim() ?? '';

  // Al montar, si hay medida buscamos automáticamente
  useEffect(() => {
    if (tireSize) {
      setSearchQuery(tireSize);
      fetchProducts(tireSize);
    }
  }, [tireSize]);

  const fetchProducts = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setProducts([]);
    try {
      const res = await fetch(`/api/tire-search?q=${encodeURIComponent(query.trim())}&_from=0&_to=5`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Error al buscar productos');
      setProducts(data.products);
      if (data.products.length === 0) {
        setError(`No encontramos llantas para "${query}" en el catálogo. Intenta con otra medida.`);
      }
    } catch (err) {
      setError('No pudimos conectar con el catálogo. Intenta de nuevo o visita grupoavante.org directamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(searchQuery);
  };

  const vehicle = [meta?.vehicleBrand, meta?.vehicleModel].filter(Boolean).join(' ');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Encabezado */}
      <h1 className="text-4xl font-extrabold text-avante-blue text-center mb-2">
        Llantas para tu vehículo
      </h1>
      <p className="text-center text-avante-gray-200 max-w-2xl mx-auto mb-8">
        {vehicle
          ? `Resultados del catálogo AVANTE para tu ${vehicle}.`
          : 'Busca por medida de llanta en el catálogo completo de AVANTE.'}
      </p>

      {/* Buscador por medida */}
      <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-10">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Ej. 205/55R16 o 225/45R17"
            className="flex-1 rounded-lg border border-avante-gray-100 px-4 py-3 text-sm focus:outline-none focus:border-avante-blue"
          />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="bg-avante-blue hover:bg-[#002070] disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors duration-200 whitespace-nowrap"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        <p className="text-xs text-avante-gray-200 mt-2 text-center">
          La medida está en el flanco de tu llanta — ej. <strong>205/55R16</strong>
        </p>
      </form>

      {/* Skeletons mientras carga */}
      {loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[0, 1, 2].map(i => <ProductSkeleton key={i} />)}
        </div>
      )}

      {/* Error o sin resultados */}
      {!loading && error && (
        <Card className="max-w-xl mx-auto text-center py-8 mb-12">
          <span className="text-4xl">🔍</span>
          <p className="text-avante-gray-300 mt-3 mb-4">{error}</p>
          <a
            href="https://www.grupoavante.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-avante-blue text-white font-bold px-6 py-3 rounded-lg text-sm hover:bg-[#002070] transition-colors"
          >
            Ver catálogo completo →
          </a>
        </Card>
      )}

      {/* Productos */}
      {!loading && products.length > 0 && (
        <>
          <p className="text-sm text-avante-gray-200 text-center mb-6">
            {products.length} resultado{products.length !== 1 ? 's' : ''} para <strong>{searchQuery}</strong>
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          {/* Ver más en la tienda */}
          <div className="text-center mb-12">
            <a
              href={`https://www.grupoavante.org/${encodeURIComponent(searchQuery.replace(/\s+/g, '-').toLowerCase())}?map=ft`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border-2 border-avante-blue text-avante-blue font-bold px-8 py-3 rounded-lg text-sm hover:bg-avante-blue hover:text-white transition-colors duration-200"
            >
              Ver más resultados en grupoavante.org →
            </a>
          </div>
        </>
      )}

      {/* Estado inicial: sin búsqueda y sin medida del cuestionario */}
      {!loading && !error && products.length === 0 && !tireSize && (
        <Card className="max-w-xl mx-auto text-center py-10 mb-12">
          <span className="text-5xl">🛞</span>
          <p className="text-avante-gray-300 font-semibold mt-4 mb-2">
            Ingresa la medida de tu llanta para ver opciones
          </p>
          <p className="text-sm text-avante-gray-200">
            O visita el catálogo completo de AVANTE
          </p>
          <a
            href="https://www.grupoavante.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 bg-avante-blue text-white font-bold px-6 py-3 rounded-lg text-sm hover:bg-[#002070] transition-colors"
          >
            Ver catálogo completo →
          </a>
        </Card>
      )}

      {/* Servicios adicionales */}
      <Card className="mb-12">
        <h2 className="text-2xl font-bold text-avante-blue mb-4">Completa tu servicio</h2>
        <p className="text-avante-gray-200 mb-6">
          Aprovecha el cambio de llantas para realizar estos servicios y maximizar su vida útil.
        </p>
        <div className="divide-y divide-avante-gray-100">
          <div className="py-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-avante-gray-300">Alineación y Balanceo</p>
              <p className="text-sm text-avante-gray-200">Esencial para un desgaste parejo.</p>
            </div>
            <a
              href="https://wa.me/528183963593?text=Hola%20tío%20Avante%2C%20quiero%20cotizar%20alineación%20y%20balanceo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-avante-blue text-avante-blue font-semibold px-4 py-2 rounded-lg text-sm hover:bg-avante-blue hover:text-white transition-colors"
            >
              Cotizar
            </a>
          </div>
          <div className="py-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-avante-gray-300">Garantía Extendida AVANTE</p>
              <p className="text-sm text-avante-gray-200">Protección contra baches y pinchaduras.</p>
            </div>
            <a
              href="https://wa.me/528183963593?text=Hola%20tío%20Avante%2C%20quiero%20info%20sobre%20garantía%20extendida"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-avante-blue text-avante-blue font-semibold px-4 py-2 rounded-lg text-sm hover:bg-avante-blue hover:text-white transition-colors"
            >
              Cotizar
            </a>
          </div>
        </div>
      </Card>

      {/* CTA WhatsApp final */}
      <div className="text-center">
        <a
          href="https://wa.me/528183963593"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors duration-200 shadow-md"
        >
          💬 Cotiza con el tío Avante
        </a>
      </div>

    </div>
  );
};
