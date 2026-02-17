import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { UserRole, ProjectStatus } from "../src/generated/prisma/enums";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // =====================
  // TAGS (30+)
  // =====================
  const tagsData = [
    // AI/ML
    { name: "Machine Learning", category: "AI/ML" },
    { name: "Deep Learning", category: "AI/ML" },
    { name: "NLP", category: "AI/ML" },
    { name: "Computer Vision", category: "AI/ML" },
    { name: "Reinforcement Learning", category: "AI/ML" },
    { name: "LLM", category: "AI/ML" },
    // Data
    { name: "Veri Analizi", category: "Data" },
    { name: "Büyük Veri", category: "Data" },
    { name: "Veri Madenciliği", category: "Data" },
    { name: "İstatistik", category: "Data" },
    // Web
    { name: "Frontend", category: "Web" },
    { name: "Backend", category: "Web" },
    { name: "Full Stack", category: "Web" },
    { name: "Web Güvenliği", category: "Web" },
    { name: "API Tasarımı", category: "Web" },
    // Mobil
    { name: "iOS", category: "Mobil" },
    { name: "Android", category: "Mobil" },
    { name: "Cross-Platform", category: "Mobil" },
    { name: "React Native", category: "Mobil" },
    // Güvenlik
    { name: "Siber Güvenlik", category: "Güvenlik" },
    { name: "Kriptografi", category: "Güvenlik" },
    { name: "Ağ Güvenliği", category: "Güvenlik" },
    { name: "Penetrasyon Testi", category: "Güvenlik" },
    // Donanım
    { name: "IoT", category: "Donanım" },
    { name: "Gömülü Sistemler", category: "Donanım" },
    { name: "Robotik", category: "Donanım" },
    { name: "FPGA", category: "Donanım" },
    // Yazılım
    { name: "Yazılım Mühendisliği", category: "Yazılım" },
    { name: "DevOps", category: "Yazılım" },
    { name: "Cloud Computing", category: "Yazılım" },
    { name: "Mikro Servisler", category: "Yazılım" },
    // Diğer
    { name: "Blokzincir", category: "Diğer" },
    { name: "Oyun Geliştirme", category: "Diğer" },
    { name: "AR/VR", category: "Diğer" },
    { name: "Biyoinformatik", category: "Diğer" },
  ];

  const tags: Record<string, string> = {};
  for (const tagData of tagsData) {
    const tag = await prisma.tag.upsert({
      where: { name: tagData.name },
      update: {},
      create: tagData,
    });
    tags[tag.name] = tag.id;
  }
  console.log(`✅ ${tagsData.length} tag oluşturuldu`);

  // =====================
  // PROFESSORS (5)
  // =====================
  const professors = [
    {
      email: "ahmet.yilmaz@ostimteknik.edu.tr",
      name: "Prof. Dr. Ahmet Yılmaz",
      role: UserRole.PROFESSOR,
      department: "Bilgisayar Mühendisliği",
      bio: "Yapay zeka ve makine öğrenmesi alanında 15 yıllık deneyim. Derin öğrenme ve doğal dil işleme üzerine çalışmalar.",
      emailVerified: true,
      tags: ["Machine Learning", "Deep Learning", "NLP", "LLM"],
    },
    {
      email: "fatma.demir@ostimteknik.edu.tr",
      name: "Doç. Dr. Fatma Demir",
      role: UserRole.PROFESSOR,
      department: "Yazılım Mühendisliği",
      bio: "Siber güvenlik ve kriptografi uzmanı. Ağ güvenliği ve penetrasyon testi konularında araştırmalar.",
      emailVerified: true,
      tags: ["Siber Güvenlik", "Kriptografi", "Ağ Güvenliği", "Web Güvenliği", "Penetrasyon Testi"],
    },
    {
      email: "mehmet.kaya@ostimteknik.edu.tr",
      name: "Dr. Öğr. Üyesi Mehmet Kaya",
      role: UserRole.PROFESSOR,
      department: "Bilgisayar Mühendisliği",
      bio: "IoT ve gömülü sistemler alanında uzman. Akıllı şehir ve robotik projeleri yürütmektedir.",
      emailVerified: true,
      tags: ["IoT", "Gömülü Sistemler", "Robotik"],
    },
    {
      email: "ayse.ozturk@ostimteknik.edu.tr",
      name: "Prof. Dr. Ayşe Öztürk",
      role: UserRole.PROFESSOR,
      department: "Yazılım Mühendisliği",
      bio: "Büyük veri ve veri madenciliği uzmanı. İstatistiksel analiz ve biyoinformatik çalışmaları.",
      emailVerified: true,
      tags: ["Büyük Veri", "Veri Madenciliği", "İstatistik", "Biyoinformatik", "Veri Analizi"],
    },
    {
      email: "ali.celik@ostimteknik.edu.tr",
      name: "Doç. Dr. Ali Çelik",
      role: UserRole.PROFESSOR,
      department: "Bilgisayar Mühendisliği",
      bio: "Cloud computing ve mikro servis mimarileri konusunda uzman. DevOps pratikleri üzerine araştırmalar.",
      emailVerified: true,
      tags: ["Cloud Computing", "Mikro Servisler", "DevOps"],
    },
  ];

  const professorIds: string[] = [];
  for (const prof of professors) {
    const { tags: profTags, ...profData } = prof;
    const user = await prisma.user.upsert({
      where: { email: profData.email },
      update: {},
      create: profData,
    });
    professorIds.push(user.id);

    // Tag bağlantıları
    for (const tagName of profTags) {
      const tagId = tags[tagName];
      if (tagId) {
        await prisma.userTag.upsert({
          where: { userId_tagId: { userId: user.id, tagId } },
          update: {},
          create: { userId: user.id, tagId },
        });
      }
    }
  }
  console.log(`✅ ${professors.length} hoca oluşturuldu`);

  // =====================
  // STUDENTS (10)
  // =====================
  const students = [
    {
      email: "ogrenci1@ostimteknik.edu.tr",
      name: "Zeynep Arslan",
      role: UserRole.STUDENT,
      department: "Bilgisayar Mühendisliği",
      bio: "Yapay zeka ve NLP alanına ilgi duyan 3. sınıf öğrencisi.",
      emailVerified: true,
      tags: ["Machine Learning", "NLP", "Deep Learning"],
    },
    {
      email: "ogrenci2@ostimteknik.edu.tr",
      name: "Emre Yıldırım",
      role: UserRole.STUDENT,
      department: "Yazılım Mühendisliği",
      bio: "Full stack web geliştirme ve API tasarımı üzerine çalışıyorum.",
      emailVerified: true,
      tags: ["Full Stack", "Backend", "API Tasarımı", "Frontend"],
    },
    {
      email: "ogrenci3@ostimteknik.edu.tr",
      name: "Elif Şahin",
      role: UserRole.STUDENT,
      department: "Bilgisayar Mühendisliği",
      bio: "Siber güvenlik alanında kariyer yapmak istiyorum.",
      emailVerified: true,
      tags: ["Siber Güvenlik", "Ağ Güvenliği", "Kriptografi"],
    },
    {
      email: "ogrenci4@ostimteknik.edu.tr",
      name: "Can Aydın",
      role: UserRole.STUDENT,
      department: "Bilgisayar Mühendisliği",
      bio: "Mobil uygulama geliştirme ve cross-platform teknolojilere ilgiliyim.",
      emailVerified: true,
      tags: ["React Native", "Cross-Platform", "Android"],
    },
    {
      email: "ogrenci5@ostimteknik.edu.tr",
      name: "Selin Korkmaz",
      role: UserRole.STUDENT,
      department: "Yazılım Mühendisliği",
      bio: "Veri bilimi ve istatistik alanında çalışıyorum.",
      emailVerified: true,
      tags: ["Veri Analizi", "İstatistik", "Machine Learning"],
    },
    {
      email: "ogrenci6@ostimteknik.edu.tr",
      name: "Burak Özkan",
      role: UserRole.STUDENT,
      department: "Bilgisayar Mühendisliği",
      bio: "IoT ve gömülü sistemler üzerine projeler geliştiriyorum.",
      emailVerified: true,
      tags: ["IoT", "Gömülü Sistemler"],
    },
    {
      email: "ogrenci7@ostimteknik.edu.tr",
      name: "Deniz Kılıç",
      role: UserRole.STUDENT,
      department: "Yazılım Mühendisliği",
      bio: "Cloud computing ve DevOps pratiklerine ilgi duyuyorum.",
      emailVerified: true,
      tags: ["Cloud Computing", "DevOps", "Mikro Servisler"],
    },
    {
      email: "ogrenci8@ostimteknik.edu.tr",
      name: "İrem Çetin",
      role: UserRole.STUDENT,
      department: "Bilgisayar Mühendisliği",
      bio: "Computer vision ve derin öğrenme alanında çalışmalar yapıyorum.",
      emailVerified: true,
      tags: ["Computer Vision", "Deep Learning", "Machine Learning"],
    },
    {
      email: "ogrenci9@ostimteknik.edu.tr",
      name: "Oğuz Han Yılmaz",
      role: UserRole.STUDENT,
      department: "Yazılım Mühendisliği",
      bio: "Blokzincir teknolojisi ve akıllı sözleşmeler üzerine çalışıyorum.",
      emailVerified: true,
      tags: ["Blokzincir", "Web Güvenliği", "Kriptografi"],
    },
    {
      email: "ogrenci10@ostimteknik.edu.tr",
      name: "Melis Aktaş",
      role: UserRole.STUDENT,
      department: "Bilgisayar Mühendisliği",
      bio: "Oyun geliştirme ve AR/VR teknolojilerine meraklıyım.",
      emailVerified: true,
      tags: ["Oyun Geliştirme", "AR/VR"],
    },
  ];

  const studentIds: string[] = [];
  for (const student of students) {
    const { tags: studentTags, ...studentData } = student;
    const user = await prisma.user.upsert({
      where: { email: studentData.email },
      update: {},
      create: studentData,
    });
    studentIds.push(user.id);

    for (const tagName of studentTags) {
      const tagId = tags[tagName];
      if (tagId) {
        await prisma.userTag.upsert({
          where: { userId_tagId: { userId: user.id, tagId } },
          update: {},
          create: { userId: user.id, tagId },
        });
      }
    }
  }
  console.log(`✅ ${students.length} öğrenci oluşturuldu`);

  // =====================
  // PROJECTS (3)
  // =====================
  const projectsData = [
    {
      title: "Türkçe NLP ile Duygu Analizi Sistemi",
      description:
        "Türkçe metinler üzerinde derin öğrenme tabanlı duygu analizi yapan bir sistem geliştirilecektir. Sosyal medya verileri kullanılarak eğitim ve test yapılacaktır.",
      status: ProjectStatus.OPEN,
      maxMembers: 3,
      ownerId: professorIds[0], // Ahmet Yılmaz
      tags: ["NLP", "Deep Learning", "Machine Learning", "Veri Analizi"],
    },
    {
      title: "Akıllı Kampüs IoT Platformu",
      description:
        "Üniversite kampüsünde IoT sensörleri kullanarak enerji tüketimi, doluluk oranı ve çevresel verileri toplayan ve analiz eden bir platform.",
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      ownerId: professorIds[2], // Mehmet Kaya
      tags: ["IoT", "Gömülü Sistemler", "Cloud Computing", "Veri Analizi"],
    },
    {
      title: "Siber Güvenlik Tehdit Tespit Sistemi",
      description:
        "Ağ trafiğini makine öğrenmesi ile analiz ederek siber saldırıları gerçek zamanlı tespit eden bir sistem. Anomali tespiti ve sınıflandırma algoritmaları kullanılacaktır.",
      status: ProjectStatus.OPEN,
      maxMembers: 3,
      ownerId: professorIds[1], // Fatma Demir
      tags: ["Siber Güvenlik", "Machine Learning", "Ağ Güvenliği"],
    },
  ];

  for (const proj of projectsData) {
    const { tags: projTags, ...projData } = proj;
    const project = await prisma.project.create({
      data: projData,
    });

    for (const tagName of projTags) {
      const tagId = tags[tagName];
      if (tagId) {
        await prisma.projectTag.create({
          data: { projectId: project.id, tagId },
        });
      }
    }
  }
  console.log(`✅ ${projectsData.length} proje oluşturuldu`);

  // =====================
  // PUBLICATIONS (2)
  // =====================
  const publicationsData = [
    {
      title: "Transformer Tabanlı Türkçe Metin Sınıflandırma: Karşılaştırmalı Bir Çalışma",
      abstract:
        "Bu çalışmada, BERT ve GPT tabanlı transformer modellerinin Türkçe metin sınıflandırma görevlerindeki performansları karşılaştırılmıştır. Sonuçlar, Türkçe'ye özel ön-eğitimli modellerin genel modellere göre %12 daha yüksek doğruluk sağladığını göstermektedir.",
      url: "https://dergipark.org.tr/example/article1",
      year: 2024,
      authorId: professorIds[0], // Ahmet Yılmaz
      tags: ["NLP", "Deep Learning", "LLM", "Machine Learning"],
    },
    {
      title: "IoT Tabanlı Akıllı Tarım Sistemlerinde Anomali Tespiti",
      abstract:
        "Tarımsal IoT sensör verilerinde anomali tespiti için hibrit bir yaklaşım önerilmiştir. Önerilen yöntem, klasik istatistiksel yöntemlere göre %18 daha yüksek F1 skoru elde etmiştir.",
      url: "https://dergipark.org.tr/example/article2",
      year: 2025,
      authorId: professorIds[2], // Mehmet Kaya
      tags: ["IoT", "Machine Learning", "Veri Analizi"],
    },
  ];

  for (const pub of publicationsData) {
    const { tags: pubTags, ...pubData } = pub;
    const publication = await prisma.publication.create({
      data: pubData,
    });

    for (const tagName of pubTags) {
      const tagId = tags[tagName];
      if (tagId) {
        await prisma.publicationTag.create({
          data: { publicationId: publication.id, tagId },
        });
      }
    }
  }
  console.log(`✅ ${publicationsData.length} yayın oluşturuldu`);

  console.log("🎉 Seed tamamlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
