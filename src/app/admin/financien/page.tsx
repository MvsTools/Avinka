import AdminFinancien from "@/components/admin/AdminFinancien";

export default function AdminFinancienPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Financiën</h1>
        <p className="mt-2 text-lg text-ink/70">Omzet en abonnementen.</p>
      </div>
      <AdminFinancien />
    </div>
  );
}
