import AdminVerbruik from "@/components/admin/AdminVerbruik";

export default function AdminVerbruikPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Verbruik</h1>
        <p className="mt-2 text-lg text-ink/70">AI-kosten en gebruik per tool.</p>
      </div>
      <AdminVerbruik />
    </div>
  );
}
