export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-zinc-50">
      {children}
    </div>
  );
}
