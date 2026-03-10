import { Link } from "react-router-dom";

export function ApplySuccessPage() {
  return (
    <section className="apply-success">
      <div className="apply-success-card">
        <div className="apply-success-icon" aria-hidden="true">
          ✓
        </div>
        <h2>Lamaran Berhasil Dikirim</h2>
        <p className="muted">
          Terima kasih sudah melamar. Tim rekrutmen akan meninjau lamaran Anda dan menghubungi jika
          ada tahap berikutnya.
        </p>
        <div className="actions">
          <Link className="link-btn" to="/apply">
            Kirim Lamaran Lain
          </Link>
        </div>
      </div>
    </section>
  );
}
