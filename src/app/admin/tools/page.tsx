import AdminTools from "@/components/admin/AdminTools";

export default function AdminToolsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Tools</h1>
        <p className="mt-2 text-lg text-ink/70">Welke tools worden het meest gebruikt.</p>
      </div>
      <AdminTools />
    </div>
  );
}
