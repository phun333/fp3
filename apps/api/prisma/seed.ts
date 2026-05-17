import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { UserRole } from "../src/generated/prisma/enums";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Önce mevcut verileri temizle
  await prisma.savedMatch.deleteMany();
  await prisma.teamInvite.deleteMany();
  await prisma.teamIdeaTag.deleteMany();
  await prisma.teamIdea.deleteMany();
  await prisma.publicationTag.deleteMany();
  await prisma.projectTag.deleteMany();
  await prisma.userTag.deleteMany();
  await prisma.application.deleteMany();
  await prisma.projectInvite.deleteMany();
  await prisma.projectMember.deleteMany();
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

  // Şifreler
  const PROF_PASSWORD = "Hoca1234!";
  const STUDENT_PASSWORD = "Ogrenci1234!";
  const hashedProfPwd = await hashPassword(PROF_PASSWORD);
  const hashedStudentPwd = await hashPassword(STUDENT_PASSWORD);

  // =====================
  // PROFESSORS (5)
  // =====================
  const professorsData = [
    {
      email: "ahmet.yilmaz@ostimteknik.edu.tr",
      name: "Prof. Dr. Ahmet Yılmaz",
      department: "Bilgisayar Mühendisliği",
      bio: "10+ yıl yapay zeka ve doğal dil işleme araştırmacısı. Türkçe dil modelleri üzerine çalışıyor.",
      tags: ["Machine Learning", "Deep Learning", "NLP", "LLM"],
    },
    {
      email: "fatma.demir@ostimteknik.edu.tr",
      name: "Doç. Dr. Fatma Demir",
      department: "Yazılım Mühendisliği",
      bio: "Siber güvenlik ve uygulamalı kriptografi alanında çalışıyor. Bug bounty programlarına aktif katılıyor.",
      tags: ["Siber Güvenlik", "Kriptografi", "Ağ Güvenliği", "Penetrasyon Testi"],
    },
    {
      email: "mehmet.kaya@ostimteknik.edu.tr",
      name: "Dr. Öğr. Üyesi Mehmet Kaya",
      department: "Bilgisayar Mühendisliği",
      bio: "Otonom sistemler, IoT ve robotik araştırmaları. TÜBİTAK 1001 projesi yürütücüsü.",
      tags: ["IoT", "Gömülü Sistemler", "Robotik", "FPGA"],
    },
    {
      email: "ayse.ozturk@ostimteknik.edu.tr",
      name: "Prof. Dr. Ayşe Öztürk",
      department: "Yazılım Mühendisliği",
      bio: "Büyük veri analitiği ve istatistiksel modelleme. Sağlık verileri üzerinde çalışıyor.",
      tags: ["Büyük Veri", "Veri Madenciliği", "İstatistik", "Veri Analizi"],
    },
    {
      email: "ali.celik@ostimteknik.edu.tr",
      name: "Doç. Dr. Ali Çelik",
      department: "Bilgisayar Mühendisliği",
      bio: "Cloud-native mimari, mikroservis tasarımı ve DevOps pratikleri. Kubernetes Certified.",
      tags: ["Cloud Computing", "DevOps", "Mikro Servisler", "Backend"],
    },
  ];

  const professors: { id: string; name: string; tags: string[] }[] = [];

  for (const prof of professorsData) {
    const { tags: profTags, ...profData } = prof;
    const user = await prisma.user.create({
      data: {
        ...profData,
        role: UserRole.PROFESSOR,
        emailVerified: true,
      },
    });

    await prisma.account.create({
      data: {
        id: `account_${user.id}`,
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedProfPwd,
      },
    });

    for (const tagName of profTags) {
      const tagId = tags[tagName];
      if (tagId) {
        await prisma.userTag.create({ data: { userId: user.id, tagId } });
      }
    }

    professors.push({ id: user.id, name: user.name, tags: profTags });
  }
  console.log(`✅ ${professors.length} hoca oluşturuldu`);

  // =====================
  // STUDENTS (15)
  // =====================
  const studentsData = [
    {
      email: "zeynep.arslan@ostimteknik.edu.tr",
      name: "Zeynep Arslan",
      department: "Bilgisayar Mühendisliği",
      year: 3,
      bio: "Yapay zeka ve dil modelleri ile ilgileniyorum. Açık kaynak projelere katkı veriyorum.",
      tags: ["Machine Learning", "NLP", "Python", "LLM"],
    },
    {
      email: "emre.korkmaz@ostimteknik.edu.tr",
      name: "Emre Korkmaz",
      department: "Yazılım Mühendisliği",
      year: 4,
      bio: "Full-stack geliştirici. Next.js ve Node.js ekosistemine hakim. Startup deneyimi var.",
      tags: ["Frontend", "Backend", "Full Stack", "API Tasarımı"],
    },
    {
      email: "elif.sahin@ostimteknik.edu.tr",
      name: "Elif Şahin",
      department: "Bilgisayar Mühendisliği",
      year: 2,
      bio: "Siber güvenlik tutkusu olan bir öğrenci. CTF yarışmalarına katılıyorum.",
      tags: ["Siber Güvenlik", "Penetrasyon Testi", "Ağ Güvenliği"],
    },
    {
      email: "burak.aydin@ostimteknik.edu.tr",
      name: "Burak Aydın",
      department: "Bilgisayar Mühendisliği",
      year: 3,
      bio: "Mobil uygulama geliştirme üzerine çalışıyorum. React Native ile 3 yayınlanmış uygulamam var.",
      tags: ["React Native", "Cross-Platform", "iOS", "Android"],
    },
    {
      email: "merve.yildiz@ostimteknik.edu.tr",
      name: "Merve Yıldız",
      department: "Yazılım Mühendisliği",
      year: 4,
      bio: "Veri bilimi ve görselleştirme alanında ilerliyorum. Kaggle'da aktifim.",
      tags: ["Veri Analizi", "Machine Learning", "İstatistik", "Büyük Veri"],
    },
    {
      email: "kerem.dogan@ostimteknik.edu.tr",
      name: "Kerem Doğan",
      department: "Bilgisayar Mühendisliği",
      year: 3,
      bio: "Bilgisayarlı görü ve derin öğrenme. Görüntü işleme tabanlı projelerde yer aldım.",
      tags: ["Computer Vision", "Deep Learning", "Machine Learning"],
    },
    {
      email: "ceren.aksoy@ostimteknik.edu.tr",
      name: "Ceren Aksoy",
      department: "Bilgisayar Mühendisliği",
      year: 2,
      bio: "Robotik kulübü üyesi. Embedded sistemler ve mikrodenetleyici programlama.",
      tags: ["Robotik", "Gömülü Sistemler", "IoT"],
    },
    {
      email: "mert.can@ostimteknik.edu.tr",
      name: "Mert Can",
      department: "Yazılım Mühendisliği",
      year: 4,
      bio: "Cloud altyapı ve DevOps konularında deneyim sahibiyim. AWS Certified.",
      tags: ["Cloud Computing", "DevOps", "Mikro Servisler", "Backend"],
    },
    {
      email: "selin.koc@ostimteknik.edu.tr",
      name: "Selin Koç",
      department: "Bilgisayar Mühendisliği",
      year: 3,
      bio: "UI/UX ve frontend geliştirme. Tasarım sistemi geliştirmeyi seviyorum.",
      tags: ["Frontend", "Full Stack"],
    },
    {
      email: "onur.tas@ostimteknik.edu.tr",
      name: "Onur Taş",
      department: "Bilgisayar Mühendisliği",
      year: 4,
      bio: "Blokzincir ve akıllı sözleşmeler. Solidity ile dApp geliştiriyorum.",
      tags: ["Blokzincir", "Backend", "Web Güvenliği"],
    },
    {
      email: "deniz.yalcin@ostimteknik.edu.tr",
      name: "Deniz Yalçın",
      department: "Yazılım Mühendisliği",
      year: 2,
      bio: "Oyun geliştirme ve grafik programlama. Unity ve Unreal Engine.",
      tags: ["Oyun Geliştirme", "AR/VR"],
    },
    {
      email: "cansu.guler@ostimteknik.edu.tr",
      name: "Cansu Güler",
      department: "Bilgisayar Mühendisliği",
      year: 3,
      bio: "Biyoenformatik ve hesaplamalı biyoloji. Genomik veri analizine ilgi duyuyorum.",
      tags: ["Biyoinformatik", "Veri Analizi", "Machine Learning"],
    },
    {
      email: "yusuf.aktas@ostimteknik.edu.tr",
      name: "Yusuf Aktaş",
      department: "Bilgisayar Mühendisliği",
      year: 4,
      bio: "Pekiştirmeli öğrenme ve otonom ajanlar üzerine bitirme projesi yapıyorum.",
      tags: ["Reinforcement Learning", "Deep Learning", "Machine Learning"],
    },
    {
      email: "irem.polat@ostimteknik.edu.tr",
      name: "İrem Polat",
      department: "Yazılım Mühendisliği",
      year: 3,
      bio: "API tasarımı, mikroservis ve sistem mimarisi. Açık kaynak Fastify katkıcısı.",
      tags: ["Backend", "API Tasarımı", "Mikro Servisler"],
    },
    {
      email: "tolga.eren@ostimteknik.edu.tr",
      name: "Tolga Eren",
      department: "Bilgisayar Mühendisliği",
      year: 2,
      bio: "Kriptografi ve güvenli sistemler üzerine çalışıyorum. Matematik tabanım güçlü.",
      tags: ["Kriptografi", "Siber Güvenlik", "Ağ Güvenliği"],
    },
  ];

  const students: { id: string; name: string; tags: string[] }[] = [];

  for (const stu of studentsData) {
    const { tags: stuTags, ...stuData } = stu;
    const user = await prisma.user.create({
      data: {
        ...stuData,
        role: UserRole.STUDENT,
        emailVerified: true,
      },
    });

    await prisma.account.create({
      data: {
        id: `account_${user.id}`,
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedStudentPwd,
      },
    });

    for (const tagName of stuTags) {
      const tagId = tags[tagName];
      if (tagId) {
        await prisma.userTag.create({ data: { userId: user.id, tagId } });
      }
    }

    students.push({ id: user.id, name: user.name, tags: stuTags });
  }
  console.log(`✅ ${students.length} öğrenci oluşturuldu`);

  // =====================
  // ÖZET
  // =====================
  console.log("\n" + "═".repeat(60));
  console.log("📋 DEMO HESAPLAR");
  console.log("═".repeat(60));
  console.log("\n🎓 Hocalar (şifre: " + PROF_PASSWORD + "):");
  for (const p of professorsData) {
    console.log(`   ${p.email}  — ${p.name}`);
  }
  console.log("\n👨‍🎓 Öğrenciler (şifre: " + STUDENT_PASSWORD + "):");
  for (const s of studentsData) {
    console.log(`   ${s.email}  — ${s.name} (${s.year}. sınıf)`);
  }
  console.log("\n" + "═".repeat(60));
  console.log("🎉 Seed tamamlandı!");
  console.log("═".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
