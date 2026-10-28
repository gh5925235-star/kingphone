import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { supabase, type Category, type Product } from '@/lib/supabase';
import { pickName } from '@/lib/i18n';
import { useSeo } from '@/components/Seo';
import { ProductCard } from '@/components/ProductCard';
import { SkeletonGrid, ErrorState, EmptyState } from '@/components/States';

type SortKey = 'newest' | 'priceLow' | 'priceHigh';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const { lang, t } = useLang();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');

  useSeo({
    title: category ? pickName(lang, category.name_ar, category.name_en) : undefined,
    description:
      lang === 'ar'
        ? 'تسوق أحدث المنتجات في هذا القسم من كنج للهواتف.'
        : 'Shop the latest products in this category from King Phone.',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(false);
      const catRes = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!active) return;
      if (catRes.error || !catRes.data) {
        setError(true);
        setLoading(false);
        return;
      }
      setCategory(catRes.data as Category);
      const prodRes = await supabase
        .from('products')
        .select('*')
        .eq('category_id', (catRes.data as Category).id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (prodRes.error) {
        setError(true);
      } else {
        setProducts(prodRes.data as Product[]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand));
    return ['all', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (brand !== 'all') list = list.filter((p) => p.brand === brand);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        p.name_ar.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    if (sort === 'priceLow') sorted.sort((a, b) => a.base_price - b.base_price);
    else if (sort === 'priceHigh') sorted.sort((a, b) => b.base_price - a.base_price);
    return sorted;
  }, [products, brand, search, sort]);

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="mb-6 h-8 w-48 shimmer rounded bg-ink-700" />
        <SkeletonGrid count={8} />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container-page py-10">
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">
          {pickName(lang, category.name_ar, category.name_en)}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {t('cat.productsCount', { count: filtered.length })}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('cat.searchPlaceholder')}
            className="input-field ps-9"
          />
        </div>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="input-field sm:w-40"
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              {b === 'all' ? t('cat.allBrands') : b}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="input-field sm:w-48"
        >
          <option value="newest">{t('cat.sort.newest')}</option>
          <option value="priceLow">{t('cat.sort.priceLow')}</option>
          <option value="priceHigh">{t('cat.sort.priceHigh')}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('error.noProducts')} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} lang={lang} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link to="/" className="btn-ghost">
          {t('cta.backHome')}
        </Link>
      </div>
    </div>
  );
}
