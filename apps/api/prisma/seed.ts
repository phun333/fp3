import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { UserRole } from "../src/generated/prisma/enums";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Önce mevcut verileri temizle
  await prisma.publicationTag.deleteMany();
  await prisma.projectTag.deleteMany();
  await prisma.userTag.deleteMany();
  await prisma.application.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tag.deleteMany();
  console.log("🗑️  Mevcut veriler temizlendi");

  // =====================
  // TAGS
  // =====================
  const tagsData = [
    { name: "Machine Learning", category: "AI/ML" },
    { name: "Deep Learning", category: "AI/ML" },
    { name: "NLP", category: "AI/ML" },
    { name: "Computer Vision", category: "AI/ML" },
    { name: "Reinforcement Learning", category: "AI/ML" },
    { name: "LLM", category: "AI/ML" },
    { name: "Veri Analizi", category: "Data" },
    { name: "Büyük Veri", category: "Data" },
    { name: "Veri Madenciliği", category: "Data" },
    { name: "İstatistik", category: "Data" },
    { name: "Frontend", category: "Web" },
    { name: "Backend", category: "Web" },
    { name: "Full Stack", category: "Web" },
    { name: "Web Güvenliği", category: "Web" },
    { name: "API Tasarımı", category: "Web" },
    { name: "iOS", category: "Mobil" },
    { name: "Android", category: "Mobil" },
    { name: "Cross-Platform", category: "Mobil" },
    { name: "React Native", category: "Mobil" },
    { name: "Siber Güvenlik", category: "Güvenlik" },
    { name: "Kriptografi", category: "Güvenlik" },
    { name: "Ağ Güvenliği", category: "Güvenlik" },
    { name: "Penetrasyon Testi", category: "Güvenlik" },
    { name: "IoT", category: "Donanım" },
    { name: "Gömülü Sistemler", category: "Donanım" },
    { name: "Robotik", category: "Donanım" },
    { name: "FPGA", category: "Donanım" },
    { name: "Yazılım Mühendisliği", category: "Yazılım" },
    { name: "DevOps", category: "Yazılım" },
    { name: "Cloud Computing", category: "Yazılım" },
    { name: "Mikro Servisler", category: "Yazılım" },
    { name: "Blokzincir", category: "Diğer" },
    { name: "Oyun Geliştirme", category: "Diğer" },
    { name: "AR/VR", category: "Diğer" },
    { name: "Biyoinformatik", category: "Diğer" },
  ];

  const tags: Record<string, string> = {};
  for (const tagData of tagsData) {
    const tag = await prisma.tag.create({ data: tagData });
    tags[tag.name] = tag.id;
  }
  console.log(`✅ ${tagsData.length} tag oluşturuldu`);

  // =====================
  // PROFESSORS (5) — Giriş yapılabilir hesaplar
  // =====================
  // Tüm hocaların şifresi: Hoca1234!
  const SHARED_PASSWORD = "Hoca1234!";
  const hashedPassword = await hashPassword(SHARED_PASSWORD);

  const professors = [
    {
      email: "ahmet.yilmaz@ostimteknik.edu.tr",
      name: "Prof. Dr. Ahmet Yılmaz",
      department: "Bilgisayar Mühendisliği",
      bio: "",
      tags: ["Machine Learning", "Deep Learning", "NLP", "LLM"],
    },
    {
      email: "fatma.demir@ostimteknik.edu.tr",
      name: "Doç. Dr. Fatma Demir",
      department: "Yazılım Mühendisliği",
      bio: "",
      tags: ["Siber Güvenlik", "Kriptografi", "Ağ Güvenliği"],
    },
    {
      email: "mehmet.kaya@ostimteknik.edu.tr",
      name: "Dr. Öğr. Üyesi Mehmet Kaya",
      department: "Bilgisayar Mühendisliği",
      bio: "",
      tags: ["IoT", "Gömülü Sistemler", "Robotik"],
    },
    {
      email: "ayse.ozturk@ostimteknik.edu.tr",
      name: "Prof. Dr. Ayşe Öztürk",
      department: "Yazılım Mühendisliği",
      bio: "",
      tags: ["Büyük Veri", "Veri Madenciliği", "İstatistik"],
    },
    {
      email: "ali.celik@ostimteknik.edu.tr",
      name: "Doç. Dr. Ali Çelik",
      department: "Bilgisayar Mühendisliği",
      bio: "",
      tags: ["Cloud Computing", "DevOps", "Mikro Servisler"],
    },
  ];

  console.log("\n📋 Hoca Hesapları:");
  console.log("─".repeat(60));

  for (const prof of professors) {
    const { tags: profTags, ...profData } = prof;

    // User oluştur
    const user = await prisma.user.create({
      data: {
        ...profData,
        role: UserRole.PROFESSOR,
        emailVerified: true,
      },
    });

    // Better Auth Account oluştur (şifre ile giriş yapılabilir)
    await prisma.account.create({
      data: {
        id: `account_${user.id}`,
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    // Tag bağlantıları
    for (const tagName of profTags) {
      const tagId = tags[tagName];
      if (tagId) {
        await prisma.userTag.create({
          data: { userId: user.id, tagId },
        });
      }
    }

    console.log(`  📧 ${prof.email}`);
    console.log(`     ${prof.name} | ${prof.department}`);
  }

  console.log("─".repeat(60));
  console.log(`  🔑 Şifre (tümü): ${SHARED_PASSWORD}`);
  console.log("─".repeat(60));

  console.log(`\n✅ ${professors.length} hoca oluşturuldu (giriş yapılabilir)`);
  console.log("✅ Öğrenci yok — kendin kayıt olacaksın");
  console.log("✅ Proje yok — hocalar oluştururacak");
  console.log("✅ Yayın yok — hocalar ekleyecek");
  console.log("\n🎉 Seed tamamlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
