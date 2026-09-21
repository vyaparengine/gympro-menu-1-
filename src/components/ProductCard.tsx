import React from 'react';
import { Product } from '../types';
import { Plus, Check, ShoppingBag, Flame } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  cartQuantity
}) => {
  return (
    <div 
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
        product.isTrending 
          ? 'border-amber-500/30 bg-neutral-900/60 shadow-[0_4px_24px_rgba(245,158,11,0.05)] hover:border-amber-500/60 hover:shadow-[0_0_24px_rgba(245,158,11,0.22)]' 
          : 'border-neutral-800 bg-neutral-900/40 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]'
      }`}
    >
      {/* Category Tag */}
      <span className="absolute top-3 left-3 z-10 rounded-full bg-neutral-950/80 px-3 py-1 text-[11px] font-semibold tracking-wider text-amber-400 border border-neutral-800">
        {product.category}
      </span>

      {/* Status Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
        {product.isTrending && (
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-neutral-950 shadow-[0_2px_8px_rgba(245,158,11,0.4)] animate-pulse">
            <Flame className="h-3 w-3 fill-neutral-950 stroke-[2.5]" />
            Trending
          </span>
        )}
        {!product.inStock && (
          <span className="rounded-full bg-red-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Out of Stock
          </span>
        )}
      </div>

      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-950">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-60" />
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold tracking-tight text-neutral-100 group-hover:text-amber-400 transition-colors duration-200">
          {product.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-neutral-400">
          {product.description}
        </p>

        {/* Pricing and Action */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-800/60 pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500">Price</span>
            <span className="text-lg font-bold tracking-tight text-white">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            id={`add-btn-${product.id}`}
            onClick={() => product.inStock && onAddToCart(product)}
            disabled={!product.inStock}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all duration-300 ${
              !product.inStock
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : cartQuantity > 0
                ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-bold'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            {cartQuantity > 0 ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Added ({cartQuantity})</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
