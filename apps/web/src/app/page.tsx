export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">FP3</h1>
        <p className="text-xl text-muted-foreground mb-2">
          Finding Publication Project Partner
        </p>
        <p className="text-muted-foreground">
          Akademik ortaklık platformu — Ostim Teknik Üniversitesi
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Giriş Yap
          </a>
          <a
            href="/register"
            className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
          >
            Kayıt Ol
          </a>
        </div>
      </div>
    </div>
  );
}
