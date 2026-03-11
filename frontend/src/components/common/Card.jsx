export default function Card({ 
  title, 
  children, 
  className = '',
  headerAction,
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {title && (
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 flex items-center justify-between gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h3>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}