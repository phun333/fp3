import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  UserRole,
  ProjectStatus,
  ApplicationStatus,
  TeamIdeaStatus,
  TeamInviteRole,
  TeamInviteStatus,
} from "../src/generated/prisma/enums";
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
  // PROJECTS (10) — hocalar tarafından açılır
  // =====================
  const projectsData = [
    {
      ownerIdx: 0, // Ahmet Yılmaz — NLP/LLM
      title: "Türkçe için Düşük Kaynak LLM Fine-Tuning",
      description:
        "Türkçe dil görevlerinde açık kaynak LLM'leri (Llama 3, Mistral) LoRA ile fine-tune ederek düşük donanım maliyetiyle yüksek başarım elde etmeyi hedefliyoruz. Hazır veri seti toplama, değerlendirme metrikleri ve model dağıtımı dahil.",
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      tags: ["NLP", "LLM", "Deep Learning", "Machine Learning"],
    },
    {
      ownerIdx: 0,
      title: "Akademik Makale Özetleme Asistanı",
      description:
        "Türkçe akademik makaleler için BERT tabanlı abstractive summarization modeli. Web arayüzü ile birlikte tam bir ürün haline getirilecek.",
      status: ProjectStatus.OPEN,
      maxMembers: 3,
      tags: ["NLP", "Machine Learning", "Frontend"],
    },
    {
      ownerIdx: 1, // Fatma Demir — Güvenlik
      title: "Web Uygulamaları için Otomatik Zafiyet Tarayıcı",
      description:
        "OWASP Top 10 zafiyetlerini tespit eden, headless browser tabanlı, akıllı bir tarayıcı geliştiriyoruz. Sonuçları CI/CD pipeline'larına entegre edilebilir formatta sunacağız.",
      status: ProjectStatus.OPEN,
      maxMembers: 3,
      tags: ["Web Güvenliği", "Siber Güvenlik", "Penetrasyon Testi"],
    },
    {
      ownerIdx: 1,
      title: "Post-Kuantum Kriptografi Algoritmalarının Performans Karşılaştırması",
      description:
        "NIST PQC finalisti algoritmalarının (Kyber, Dilithium) gerçek dünya uygulamalarındaki performansını ölçen kapsamlı bir çalışma. Yayın çıkarmayı hedefliyoruz.",
      status: ProjectStatus.IN_PROGRESS,
      maxMembers: 2,
      tags: ["Kriptografi", "Siber Güvenlik"],
    },
    {
      ownerIdx: 2, // Mehmet Kaya — IoT/Robotik
      title: "Tarımsal İHA için Çoklu Sensör Füzyonu",
      description:
        "Tarımsal alanlarda gözlem yapan İHA'lar için kamera, LIDAR ve termal sensör verilerini birleştiren bir füzyon sistemi. Açık alan deneyleri yapılacak.",
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      tags: ["Robotik", "Computer Vision", "Gömülü Sistemler", "IoT"],
    },
    {
      ownerIdx: 2,
      title: "FPGA Üzerinde Gerçek Zamanlı Görüntü İşleme",
      description:
        "Verilog/VHDL ile FPGA üzerinde gerçek zamanlı kenar tespiti ve nesne takibi. Hedef: 60+ FPS performans.",
      status: ProjectStatus.OPEN,
      maxMembers: 2,
      tags: ["FPGA", "Computer Vision", "Gömülü Sistemler"],
    },
    {
      ownerIdx: 3, // Ayşe Öztürk — Veri
      title: "Sağlık Verileri Üzerinde Tahminsel Modelleme",
      description:
        "Hastane verileri üzerinde diyabet ve kardiyovasküler hastalık risk tahmini için ML pipeline. Etik kurul onayı alınmış veri setiyle çalışılacak.",
      status: ProjectStatus.OPEN,
      maxMembers: 3,
      tags: ["Machine Learning", "Veri Analizi", "İstatistik", "Biyoinformatik"],
    },
    {
      ownerIdx: 3,
      title: "Türkiye Hava Kalitesi için Zaman Serisi Analizi",
      description:
        "Türkiye'deki büyük şehirlerin hava kalitesi verileri üzerinde LSTM tabanlı tahmin modelleri. Sonuçlar açık veri olarak yayınlanacak.",
      status: ProjectStatus.OPEN,
      maxMembers: 3,
      tags: ["Veri Analizi", "Deep Learning", "Büyük Veri"],
    },
    {
      ownerIdx: 4, // Ali Çelik — Cloud
      title: "Kubernetes Üzerinde Otomatik Ölçeklenebilir ML Servisleri",
      description:
        "K8s + KServe ile model dağıtımı, otomatik canary release ve A/B testing altyapısı. Tüm pipeline IaC olarak yazılacak.",
      status: ProjectStatus.OPEN,
      maxMembers: 3,
      tags: ["Cloud Computing", "DevOps", "Mikro Servisler", "Machine Learning"],
    },
    {
      ownerIdx: 4,
      title: "Event-Driven Mikroservis Mimarisi Şablonu",
      description:
        "Kafka tabanlı, çoklu dil destekli (Node.js, Go, Python) bir mikroservis referans mimarisi. Açık kaynak olarak yayımlanacak.",
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      tags: ["Mikro Servisler", "Backend", "API Tasarımı", "DevOps"],
    },
  ];

  const projects: { id: string; title: string; ownerIdx: number; tags: string[] }[] = [];

  for (const proj of projectsData) {
    const { ownerIdx, tags: projTags, ...projData } = proj;
    const project = await prisma.project.create({
      data: {
        ...projData,
        ownerId: professors[ownerIdx].id,
      },
    });

    for (const tagName of projTags) {
      const tagId = tags[tagName];
      if (tagId) {
        await prisma.projectTag.create({ data: { projectId: project.id, tagId } });
      }
    }

    projects.push({ id: project.id, title: project.title, ownerIdx, tags: projTags });
  }
  console.log(`✅ ${projects.length} proje oluşturuldu`);

  // =====================
  // PUBLICATIONS (8)
  // =====================
  const publicationsData = [
    {
      authorIdx: 0,
      title: "Low-Resource Turkish NLP with Transformer Models: A Comprehensive Survey",
      abstract:
        "Bu çalışmada düşük kaynaklı Türkçe NLP görevleri için transformer tabanlı yaklaşımları karşılaştırmalı olarak inceledik. Sonuçlarımız fine-tuning stratejilerinin doğru seçilmesi durumunda %15'e varan iyileşme sağladığını göstermektedir.",
      url: "https://arxiv.org/abs/2403.example1",
      year: 2024,
      tags: ["NLP", "Deep Learning", "LLM"],
    },
    {
      authorIdx: 0,
      title: "Cross-Lingual Transfer Learning for Turkish Question Answering",
      abstract:
        "Çapraz-dilli transfer öğrenme yöntemleriyle Türkçe soru-cevap sistemlerini iyileştiren bir yaklaşım önerdik.",
      url: "https://arxiv.org/abs/2310.example2",
      year: 2023,
      tags: ["NLP", "Machine Learning"],
    },
    {
      authorIdx: 1,
      title: "Practical Side-Channel Attacks on Post-Quantum Signature Schemes",
      abstract:
        "Post-kuantum imza şemalarına yönelik pratik yan kanal saldırılarını analiz ettik ve karşı önlemler önerdik.",
      url: "https://eprint.iacr.org/2024/example",
      year: 2024,
      tags: ["Kriptografi", "Siber Güvenlik"],
    },
    {
      authorIdx: 1,
      title: "Automated Vulnerability Detection in Modern JavaScript Frameworks",
      abstract:
        "React, Vue ve Angular uygulamalarındaki yaygın zafiyetleri tespit eden otomatik bir tarama aracı geliştirdik.",
      year: 2023,
      tags: ["Web Güvenliği", "Siber Güvenlik"],
    },
    {
      authorIdx: 2,
      title: "Real-Time Multi-Sensor Fusion for Autonomous UAVs",
      abstract:
        "Otonom İHA'lar için düşük gecikmeli çoklu sensör füzyon mimarisi önerdik. Saha testlerinde %94 başarı elde ettik.",
      url: "https://ieeexplore.ieee.org/document/example",
      year: 2024,
      tags: ["Robotik", "Computer Vision", "Gömülü Sistemler"],
    },
    {
      authorIdx: 3,
      title: "Predictive Modeling of Diabetes Risk Using Multi-Modal Health Data",
      abstract:
        "Çok kipli sağlık verilerini birleştirerek diyabet risk tahmininde ROC-AUC 0.91 başarımı elde ettik.",
      url: "https://www.nature.com/articles/example",
      year: 2024,
      tags: ["Machine Learning", "Veri Analizi", "Biyoinformatik"],
    },
    {
      authorIdx: 3,
      title: "Air Quality Forecasting in Turkish Cities Using Deep Learning",
      abstract:
        "Türkiye'deki büyük şehirlerin hava kalitesi tahmininde LSTM ve Transformer modellerinin karşılaştırması.",
      year: 2023,
      tags: ["Deep Learning", "Veri Analizi", "Büyük Veri"],
    },
    {
      authorIdx: 4,
      title: "Auto-Scaling ML Workloads on Kubernetes: A Cost-Performance Analysis",
      abstract:
        "Kubernetes üzerinde ML çıkarım yüklerinin otomatik ölçeklendirilmesinde maliyet-performans dengesi üzerine bir çalışma.",
      url: "https://dl.acm.org/doi/example",
      year: 2024,
      tags: ["Cloud Computing", "Machine Learning", "DevOps"],
    },
  ];

  for (const pub of publicationsData) {
    const { authorIdx, tags: pubTags, ...pubData } = pub;
    const publication = await prisma.publication.create({
      data: {
        ...pubData,
        authorId: professors[authorIdx].id,
      },
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

  // =====================
  // APPLICATIONS — öğrencilerden projelere
  // =====================
  const applicationsData: {
    studentIdx: number;
    projectIdx: number;
    status: ApplicationStatus;
    message: string;
  }[] = [
    {
      studentIdx: 0, // Zeynep — NLP
      projectIdx: 0, // Türkçe LLM Fine-Tuning
      status: ApplicationStatus.PENDING,
      message:
        "Merhaba hocam, LoRA fine-tuning konusunda Hugging Face üzerinde 2 deneyim yaptım. Türkçe görevlerde çalışmak istiyorum.",
    },
    {
      studentIdx: 0,
      projectIdx: 1, // Makale Özetleme
      status: ApplicationStatus.ACCEPTED,
      message:
        "Bitirme projem için bu konuyu çok uygun görüyorum. BERT modelleri üzerine çalıştım daha önce.",
    },
    {
      studentIdx: 12, // Yusuf — RL/DL
      projectIdx: 0,
      status: ApplicationStatus.PENDING,
      message: "Derin öğrenme tarafında deneyimliyim, projeye katkıda bulunmak isterim.",
    },
    {
      studentIdx: 5, // Kerem — Computer Vision
      projectIdx: 4, // Tarımsal İHA
      status: ApplicationStatus.PENDING,
      message:
        "Görüntü işleme ve nesne tespiti üzerine 1 yıl çalıştım, projeye katılmak istiyorum.",
    },
    {
      studentIdx: 6, // Ceren — Robotik
      projectIdx: 4,
      status: ApplicationStatus.ACCEPTED,
      message:
        "Robotik kulübünde İHA platformları üzerinde çalışıyorum. Saha deneyimim mevcut.",
    },
    {
      studentIdx: 2, // Elif — Güvenlik
      projectIdx: 2, // Zafiyet Tarayıcı
      status: ApplicationStatus.ACCEPTED,
      message: "CTF tecrübelerimi gerçek bir araca dönüştürmek istiyorum.",
    },
    {
      studentIdx: 14, // Tolga — Kriptografi
      projectIdx: 3, // PQC
      status: ApplicationStatus.ACCEPTED,
      message: "Matematik tabanım güçlü, kriptografik analiz konusunda çalışmak istiyorum.",
    },
    {
      studentIdx: 4, // Merve — Veri
      projectIdx: 6, // Sağlık verisi
      status: ApplicationStatus.PENDING,
      message: "Sağlık verileri benim için ilgi çekici bir alan, projeye dahil olmak isterim.",
    },
    {
      studentIdx: 11, // Cansu — Biyoinformatik
      projectIdx: 6,
      status: ApplicationStatus.ACCEPTED,
      message: "Biyoenformatik konusunda yüksek lisans hedefliyorum, bu proje benim için ideal.",
    },
    {
      studentIdx: 4, // Merve
      projectIdx: 7, // Hava kalitesi
      status: ApplicationStatus.ACCEPTED,
      message: "Zaman serisi analizinde Kaggle yarışmalarında çalıştım.",
    },
    {
      studentIdx: 7, // Mert — Cloud
      projectIdx: 8, // K8s ML
      status: ApplicationStatus.PENDING,
      message: "AWS Certified'ım ve K8s tecrübem var, ML servislerine ilgi duyuyorum.",
    },
    {
      studentIdx: 13, // İrem — API
      projectIdx: 9, // Event-Driven Microservices
      status: ApplicationStatus.PENDING,
      message: "Fastify katkıcısıyım, açık kaynak deneyimimi bu projeye taşımak istiyorum.",
    },
    {
      studentIdx: 1, // Emre — Full Stack
      projectIdx: 1, // Akademik Özetleme
      status: ApplicationStatus.REJECTED,
      message: "Frontend tarafı için yardımcı olabilirim.",
    },
    {
      studentIdx: 12, // Yusuf
      projectIdx: 8, // K8s ML
      status: ApplicationStatus.PENDING,
      message: "RL servislerinin dağıtımıyla ilgilenmek isterim.",
    },
  ];

  for (const app of applicationsData) {
    await prisma.application.create({
      data: {
        projectId: projects[app.projectIdx].id,
        applicantId: students[app.studentIdx].id,
        status: app.status,
        message: app.message,
      },
    });
  }
  console.log(`✅ ${applicationsData.length} başvuru oluşturuldu`);

  // =====================
  // TEAM IDEAS — öğrenciler de açabilir
  // =====================
  const teamIdeasData = [
    {
      ownerIdx: 1, // Emre (öğrenci) — Full Stack
      ownerType: "student" as const,
      title: "Üniversite İçi Etkinlik Platformu",
      description:
        "Öğrenci kulüplerinin etkinliklerini, bildirimleri ve katılım takibini yapan bir platform. Production'a almayı hedefliyoruz.",
      professorSlots: 1,
      studentSlots: 3,
      status: TeamIdeaStatus.OPEN,
      tags: ["Full Stack", "Frontend", "Backend", "API Tasarımı"],
      invites: [
        {
          targetIdx: 4, // Ali Çelik (hoca)
          targetType: "professor" as const,
          role: TeamInviteRole.PROFESSOR,
          status: TeamInviteStatus.PENDING,
          matchScore: 78,
          handoffNote:
            "Hocam, mikroservis ve cloud deployment tarafında danışmanlığınıza ihtiyacımız var.",
        },
        {
          targetIdx: 8, // Selin (öğrenci, frontend)
          targetType: "student" as const,
          role: TeamInviteRole.STUDENT,
          status: TeamInviteStatus.ACCEPTED,
          matchScore: 92,
          handoffNote: "UI tasarımını birlikte götürmek istiyorum.",
        },
        {
          targetIdx: 13, // İrem (öğrenci, API)
          targetType: "student" as const,
          role: TeamInviteRole.STUDENT,
          status: TeamInviteStatus.PENDING,
          matchScore: 87,
          handoffNote: "Backend tarafında ekibe katılmak ister misin?",
        },
      ],
    },
    {
      ownerIdx: 0, // Zeynep (öğrenci) — NLP
      ownerType: "student" as const,
      title: "Türkçe Akademik Asistan Chatbot",
      description:
        "Üniversite öğrencileri için Türkçe akademik soruları yanıtlayan RAG tabanlı asistan. Açık kaynak yayımlanacak.",
      professorSlots: 1,
      studentSlots: 4,
      status: TeamIdeaStatus.OPEN,
      tags: ["NLP", "LLM", "Machine Learning", "Backend"],
      invites: [
        {
          targetIdx: 0, // Ahmet Yılmaz
          targetType: "professor" as const,
          role: TeamInviteRole.PROFESSOR,
          status: TeamInviteStatus.ACCEPTED,
          matchScore: 95,
          handoffNote: "Hocam, NLP danışmanlığınızı çok isteriz.",
        },
        {
          targetIdx: 5, // Kerem
          targetType: "student" as const,
          role: TeamInviteRole.STUDENT,
          status: TeamInviteStatus.PENDING,
          matchScore: 73,
          handoffNote: "Embedding ve vektör arama tarafında çalışmak ister misin?",
        },
        {
          targetIdx: 12, // Yusuf
          targetType: "student" as const,
          role: TeamInviteRole.STUDENT,
          status: TeamInviteStatus.PENDING,
          matchScore: 81,
          handoffNote: "RL ile fine-tuning kısmında deneyimini paylaşır mısın?",
        },
      ],
    },
    {
      ownerIdx: 2, // Mehmet Kaya (hoca)
      ownerType: "professor" as const,
      title: "Akıllı Sera için IoT Tabanlı Otomasyon",
      description:
        "Toprak nem, sıcaklık, ışık sensörleri ile beslenen otonom bir sera kontrol sistemi. Sponsor: TÜBİTAK.",
      professorSlots: 1,
      studentSlots: 3,
      status: TeamIdeaStatus.OPEN,
      tags: ["IoT", "Gömülü Sistemler", "Machine Learning"],
      invites: [
        {
          targetIdx: 6, // Ceren
          targetType: "student" as const,
          role: TeamInviteRole.STUDENT,
          status: TeamInviteStatus.ACCEPTED,
          matchScore: 89,
          handoffNote: "Embedded tarafını birlikte götürelim.",
        },
        {
          targetIdx: 11, // Cansu
          targetType: "student" as const,
          role: TeamInviteRole.STUDENT,
          status: TeamInviteStatus.PENDING,
          matchScore: 64,
          handoffNote: "Veri analizinde yer almak ister misin?",
        },
      ],
    },
    {
      ownerIdx: 1, // Fatma Demir (hoca)
      ownerType: "professor" as const,
      title: "Güvenli Mesajlaşma için E2E Kripto Protokolü",
      description:
        "Signal protokolünün modern bir varyantını formel doğrulamayla birlikte tasarlayıp uygulayan bir araştırma.",
      professorSlots: 1,
      studentSlots: 2,
      status: TeamIdeaStatus.OPEN,
      tags: ["Kriptografi", "Siber Güvenlik", "Ağ Güvenliği"],
      invites: [
        {
          targetIdx: 14, // Tolga
          targetType: "student" as const,
          role: TeamInviteRole.STUDENT,
          status: TeamInviteStatus.ACCEPTED,
          matchScore: 94,
          handoffNote: "Kripto matematiği için seninle çalışmak istiyorum.",
        },
        {
          targetIdx: 2, // Elif
          targetType: "student" as const,
          role: TeamInviteRole.STUDENT,
          status: TeamInviteStatus.DECLINED,
          matchScore: 76,
          handoffNote: "Pentest tarafında yardımcı olur musun?",
        },
      ],
    },
  ];

  for (const idea of teamIdeasData) {
    const owner = idea.ownerType === "professor" ? professors[idea.ownerIdx] : students[idea.ownerIdx];
    const teamIdea = await prisma.teamIdea.create({
      data: {
        title: idea.title,
        description: idea.description,
        professorSlots: idea.professorSlots,
        studentSlots: idea.studentSlots,
        status: idea.status,
        ownerId: owner.id,
      },
    });

    for (const tagName of idea.tags) {
      const tagId = tags[tagName];
      if (tagId) {
        await prisma.teamIdeaTag.create({ data: { teamIdeaId: teamIdea.id, tagId } });
      }
    }

    for (const inv of idea.invites) {
      const target =
        inv.targetType === "professor" ? professors[inv.targetIdx] : students[inv.targetIdx];
      await prisma.teamInvite.create({
        data: {
          teamIdeaId: teamIdea.id,
          userId: target.id,
          role: inv.role,
          status: inv.status,
          matchScore: inv.matchScore,
          handoffNote: inv.handoffNote,
        },
      });
    }
  }
  console.log(`✅ ${teamIdeasData.length} takım fikri ve davetler oluşturuldu`);

  // =====================
  // SAVED MATCHES — öğrenciler hocaları kaydetmiş
  // =====================
  const savedMatchesData = [
    {
      studentIdx: 0, // Zeynep
      professorIdx: 0, // Ahmet Yılmaz
      purpose: "ARTICLE",
      description: "Türkçe LLM konusunda makale ortaklığı için iletişime geçeceğim.",
      matchScore: 95,
    },
    {
      studentIdx: 0,
      professorIdx: 3, // Ayşe Öztürk
      purpose: "PROJECT",
      description: "Veri analizi tarafında bir proje düşünüyorum.",
      matchScore: 72,
    },
    {
      studentIdx: 4, // Merve
      professorIdx: 3,
      purpose: "PROJECT",
      description: "Sağlık verileri konusunda staj/proje fırsatı.",
      matchScore: 91,
    },
    {
      studentIdx: 5, // Kerem
      professorIdx: 2, // Mehmet Kaya
      purpose: "PROJECT",
      description: "İHA görüntü işleme projesi için.",
      matchScore: 88,
    },
    {
      studentIdx: 7, // Mert
      professorIdx: 4, // Ali Çelik
      purpose: "ARTICLE",
      description: "Kubernetes maliyet analizi makalesinde yer almak isterim.",
      matchScore: 93,
    },
    {
      studentIdx: 2, // Elif
      professorIdx: 1, // Fatma Demir
      purpose: "PROJECT",
      description: "Pentest aracı geliştirme.",
      matchScore: 89,
    },
    {
      studentIdx: 14, // Tolga
      professorIdx: 1,
      purpose: "ARTICLE",
      description: "PQC analizi.",
      matchScore: 94,
    },
    {
      studentIdx: 12, // Yusuf
      professorIdx: 0,
      purpose: "PROJECT",
      description: "RL tabanlı LLM optimizasyonu.",
      matchScore: 82,
    },
  ];

  for (const sm of savedMatchesData) {
    await prisma.savedMatch.create({
      data: {
        userId: students[sm.studentIdx].id,
        professorId: professors[sm.professorIdx].id,
        purpose: sm.purpose,
        description: sm.description,
        matchScore: sm.matchScore,
      },
    });
  }
  console.log(`✅ ${savedMatchesData.length} kayıtlı eşleşme oluşturuldu`);

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
