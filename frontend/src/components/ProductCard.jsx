export default function ProductCard({ product }) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price);

  return (
    <article className="glass-card overflow-hidden group hover:border-white/20 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] bg-slate-800/60">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-500 to-violet-500 text-white shadow-lg">
          {formattedPrice}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-100 text-base mb-1.5 line-clamp-1">
          {product.title}
        </h3>
        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed mb-3">
          {product.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-violet-400 flex items-center justify-center text-xs font-bold text-white">
              {product.createdBy?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-xs text-slate-500 truncate max-w-[100px]">
              {product.createdBy?.name || 'Unknown'}
            </span>
          </div>
          <span className="text-xs text-slate-600">
            {new Date(product.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </article>
  );
}
