/**
 * Auth Test Script
 * Kullanım: tsx src/test/auth-test.ts
 *
 * NOT: API sunucusunun çalışıyor olması gerekir (pnpm dev)
 * NOT: Veritabanı bağlantısı gereklidir
 */

const API_URL = process.env.API_URL || "http://localhost:3001";

interface ApiResponse {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

let cookies: string[] = [];

async function request(
  method: string,
  path: string,
  body?: any
): Promise<{ status: number; data: any; headers: Headers }> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies.join("; "),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Cookie'leri sakla
  const setCookies = res.headers.getSetCookie?.() || [];
  if (setCookies.length > 0) {
    cookies = setCookies.map((c) => c.split(";")[0]);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data, headers: res.headers };
}

function log(test: string, passed: boolean, detail?: string) {
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${test}${detail ? ` — ${detail}` : ""}`);
}

async function runTests() {
  console.log("\n🧪 FP3 Auth Test Suite\n");
  console.log(`API URL: ${API_URL}\n`);

  // 1. Health check
  try {
    const { status, data } = await request("GET", "/health");
    log("Health check", status === 200 && data.status === "ok");
  } catch (e: any) {
    log("Health check", false, `API'ye bağlanılamadı: ${e.message}`);
    console.log("\n⚠️  API sunucusu çalışmıyor. Önce 'pnpm dev' çalıştırın.\n");
    process.exit(1);
  }

  // 2. Geçersiz domain ile signup
  {
    const { status, data } = await request("POST", "/api/auth/sign-up/email", {
      email: "test@gmail.com",
      password: "Test123456!",
      name: "Test User",
      role: "STUDENT",
      department: "Bilgisayar Mühendisliği",
    });
    log(
      "Geçersiz domain reddi",
      status === 400,
      `Status: ${status}`
    );
  }

  // 3. Geçerli domain ile signup (PROFESSOR)
  const profEmail = `test.prof.${Date.now()}@ostimteknik.edu.tr`;
  {
    const { status, data } = await request("POST", "/api/auth/sign-up/email", {
      email: profEmail,
      password: "Test123456!",
      name: "Test Profesör",
      role: "PROFESSOR",
      department: "Bilgisayar Mühendisliği",
    });
    log(
      "Profesör kaydı",
      status === 200 && data?.user,
      `Email: ${profEmail}, Status: ${status}`
    );
  }

  // 4. Signin
  cookies = []; // Cookie'leri temizle
  {
    const { status, data } = await request("POST", "/api/auth/sign-in/email", {
      email: profEmail,
      password: "Test123456!",
    });
    log(
      "Profesör girişi",
      status === 200 && data?.session,
      `Status: ${status}`
    );
  }

  // 5. Session kontrolü
  {
    const { status, data } = await request("GET", "/api/auth/get-session");
    log(
      "Session kontrolü",
      status === 200 && data?.user?.email === profEmail,
      `User: ${data?.user?.email || "yok"}, Role: ${data?.user?.role || "yok"}`
    );
  }

  // 6. Öğrenci kaydı
  const studentEmail = `test.student.${Date.now()}@ostimteknik.edu.tr`;
  cookies = []; // Cookie'leri temizle
  {
    const { status, data } = await request("POST", "/api/auth/sign-up/email", {
      email: studentEmail,
      password: "Test123456!",
      name: "Test Öğrenci",
      role: "STUDENT",
      department: "Yazılım Mühendisliği",
    });
    log(
      "Öğrenci kaydı",
      status === 200 && data?.user,
      `Email: ${studentEmail}, Status: ${status}`
    );
  }

  // 7. Öğrenci signin
  cookies = [];
  {
    const { status, data } = await request("POST", "/api/auth/sign-in/email", {
      email: studentEmail,
      password: "Test123456!",
    });
    log(
      "Öğrenci girişi",
      status === 200 && data?.session,
      `Status: ${status}`
    );
  }

  // 8. Session - öğrenci rolü kontrolü
  {
    const { status, data } = await request("GET", "/api/auth/get-session");
    log(
      "Öğrenci session & rol kontrolü",
      status === 200 && data?.user?.role === "STUDENT",
      `Role: ${data?.user?.role || "yok"}`
    );
  }

  // 9. Signout
  {
    const { status } = await request("POST", "/api/auth/sign-out");
    log("Çıkış", status === 200, `Status: ${status}`);
  }

  // 10. Çıkış sonrası session kontrolü
  {
    const { status, data } = await request("GET", "/api/auth/get-session");
    log(
      "Çıkış sonrası session yok",
      !data?.session,
      `Session: ${data?.session ? "var" : "yok"}`
    );
  }

  console.log("\n🏁 Test tamamlandı!\n");
}

runTests().catch(console.error);
