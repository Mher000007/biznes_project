import { MessageSquare } from "lucide-react";

const INQUIRIES = [
  { id: 1, name: "Armen Grigoryan", email: "armen@example.com", subject: "Partnership inquiry", message: "We are interested in partnering for a joint technology project.", time: "2 hours ago", status: "new" as const },
  { id: 2, name: "Seda Hovhannisyan", email: "seda@example.com", subject: "Service pricing", message: "Could you provide a quote for your cloud migration service?", time: "5 hours ago", status: "read" as const },
  { id: 3, name: "David Mkrtchyan", email: "david@example.com", subject: "Collaboration proposal", message: "Our company would like to explore B2B collaboration opportunities.", time: "1 day ago", status: "replied" as const },
  { id: 4, name: "Anna Petrosyan", email: "anna@example.com", subject: "Custom solution request", message: "We need a custom ERP solution for our manufacturing business.", time: "2 days ago", status: "new" as const },
  { id: 5, name: "Hovhannes Avetisyan", email: "hovhannes@example.com", subject: "Technical consultation", message: "Looking for technical consultation on migrating to the cloud.", time: "3 days ago", status: "archived" as const },
];

const STATUS_STYLES = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  read: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  replied: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  archived: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
};

export default function InquiriesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Inquiries</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage messages from potential customers and partners.</p>
      </div>

      <div className="space-y-3">
        {INQUIRIES.map((inq) => (
          <div key={inq.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-colors hover:border-[hsl(var(--primary))]/20">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-bold">
                  {inq.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <span className="text-sm font-semibold">{inq.name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">{inq.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[inq.status]}`}>
                  {inq.status}
                </span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{inq.time}</span>
              </div>
            </div>
            <h3 className="text-sm font-medium mb-1">{inq.subject}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{inq.message}</p>
          </div>
        ))}

        {INQUIRIES.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-10 w-10 text-[hsl(var(--muted-foreground))]/40 mb-3" />
            <h3 className="text-sm font-semibold mb-1">No inquiries yet</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Messages from customers will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
