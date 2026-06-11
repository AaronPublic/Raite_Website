import { db } from "@/lib/db";

export async function seedSchools() {
  const schools = [
    { name: "ASIA PACIFIC COLLEGE OF ADVANCED STUDIES, INC.", abbreviation: "APCAS" },
    { name: "BALIUAG UNIVERSITY", abbreviation: "BU" },
    { name: "BULACAN STATE UNIVERSITY - BUSTOS CAMPUS", abbreviation: "BSU-B" },
    { name: "BULACAN STATE UNIVERSITY - HAGONOY CAMPUS", abbreviation: "BSU-H" },
    { name: "BULACAN STATE UNIVERSITY - MAIN CAMPUS", abbreviation: "BSU-MA" },
    { name: "BULACAN STATE UNIVERSITY - MENESES CAMPUS", abbreviation: "BSU-ME" },
    { name: "BULACAN STATE UNIVERSITY - SARMIENTO CAMPUS", abbreviation: "BSU-S" },
    { name: "CITY COLLEGE OF SAN FERNANDO PAMPANGA", abbreviation: "CCSF" },
    { name: "COLEGIO DE CALUMPIT INC.", abbreviation: "CDC" },
    { name: "COLLEGE OF THE IMMACULATE CONCEPTION", abbreviation: "CIC" },
    { name: "COMTEQ COMPUTER AND BUSINESS COLLEGE, INC.", abbreviation: "CCBC" },
    { name: "DR. YANGA'S COLLEGES, INC.", abbreviation: "DYC" },
    { name: "GENERAL DE JESUS COLLEGE", abbreviation: "GDJC" },
    { name: "GOLDEN MINDS COLLEGES OF PANDI BULACAN, INC.", abbreviation: "GMCPB" },
    { name: "HOLY ANGEL UNIVERSITY", abbreviation: "HAU" },
    { name: "HOLY CROSS COLLEGE", abbreviation: "HCC" },
    { name: "LA CONSOLACION UNIVERSITY PHILIPPINES", abbreviation: "LCUP" },
    { name: "MABALACAT CITY COLLEGE", abbreviation: "MCC" },
    { name: "MANUEL V. GALLEGO FOUNDATION COLLEGES, INC.", abbreviation: "MVGFC" },
    { name: "NORZAGARAY COLLEGE", abbreviation: "NC" },
    { name: "NATIONAL UNIVERSITY - CLARK", abbreviation: "NU-C" },
    { name: "NATIONAL UNIVERSITY - BALIUAG", abbreviation: "NU-B" },
    { name: "PAMPANGA STATE UNIVERSITY - MAIN CAMPUS", abbreviation: "PSU-M" },
    { name: "PAMPANGA STATE UNIVERSITY - LUBAO CAMPUS", abbreviation: "PSU-L" },
    { name: "POLYTECHNIC COLLEGE OF BOTOLAN", abbreviation: "PCB" },
    { name: "RICHWELL COLLEGES INCOPORATED", abbreviation: "RCI" },
    { name: "ST. PAUL COLLEGES FOUNDATION PANIQUI TARLAC INC", abbreviation: "SPCFPT" },
    { name: "STI COLLEGE - ANGELES", abbreviation: "STI-A" },
    { name: "STI COLLEGE - BALIUAG", abbreviation: "STI-B" },
    { name: "SYSTEMS PLUS COLLEGE FOUNDATION", abbreviation: "SPCF" },
    { name: "TARLAC STATE UNIVERSITY", abbreviation: "TSU" },
    { name: "UNIVERSITY OF THE ASSUMPTION", abbreviation: "UA" },
    { name: "WESLEYAN UNIVERSITY-PHILIPPINES", abbreviation: "WUP" },
  ];

  for (const school of schools) {
    await db.school.upsert({
      where: { name: school.name },
      update: { abbreviation: school.abbreviation },
      create: school,
    });
  }
}
