"use client";

import Link from "next/link";
import { buttonVariants } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "../../components/ui/card";

export function ApplySuccessPage() {
  return (
    <section className="apply-success">
      <Card className="apply-success-card">
        <CardContent>
          <div className="apply-success-icon" aria-hidden="true">
            âœ“
          </div>
          <h2>Lamaran Berhasil Dikirim</h2>
          <p className="muted">
            Terima kasih sudah melamar. Tim rekrutmen akan meninjau lamaran Anda dan menghubungi jika
            ada tahap berikutnya.
          </p>
          <div className="actions">
            <Link href="/apply" className={cn(buttonVariants({ variant: "outline" }))}>
              Kirim Lamaran Lain
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

