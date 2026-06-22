import FeedbackModule from "@/components/dashboard/FeedbackModule";

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">Feedback</h1>
        <p className="mt-2 text-lg text-ink/70">
          Help ons Avinka beter maken. Eén idee, een probleem of een complimentje: we lezen alles zelf.
        </p>
      </div>
      <FeedbackModule />
    </div>
  );
}
