import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="404"
        title="That page is still in concept"
        description="The route you tried isn't part of this demo workspace yet. Jump back to the dashboard to keep exploring."
      />
      <div className="px-4 md:px-6 lg:px-8 mt-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-soft backdrop-blur-md grid place-items-center text-center">
          <Sparkles className="h-6 w-6 text-brand-300" />
          <Badge variant="info" className="mt-3">
            Demo workspace
          </Badge>
          <p className="mt-2 text-sm text-slate-300 max-w-md">
            The Campaign Agent ships with five workspaces today: Overview,
            Builder, Validation, Content, Creative, and Approval Center.
          </p>
          <Link href="/" className="mt-4">
            <Button>Return to overview</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
