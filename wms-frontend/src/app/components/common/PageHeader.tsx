export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}
