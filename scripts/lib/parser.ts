/**
 * Parsers and source catalog for official Moroccan legal ingestion.
 *
 * The catalog intentionally includes records that may be skipped when
 * their official source is inaccessible or image-only.
 */

export type DocumentStatus = 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
export type SourceEncoding = 'plain' | 'obfuscated';

export interface SourceDocument {
  seed_file: string;
  id: string;
  type: 'statute';
  title: string;
  title_en?: string;
  short_name?: string;
  status: DocumentStatus;
  issued_date?: string;
  in_force_date?: string;
  url: string;
  source_url: string;
  source_authority: string;
  source_encoding: SourceEncoding;
  description?: string;
  law_number?: string;
  start_hint?: string;
  end_hint?: string;
  ocr_page_start?: number;
  ocr_page_end?: number;
}

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParsedDocument {
  id: string;
  type: 'statute';
  title: string;
  title_en?: string;
  short_name?: string;
  status: DocumentStatus;
  issued_date?: string;
  in_force_date?: string;
  url: string;
  description?: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
  ingestion_status?: 'ingested' | 'skipped';
  ingestion_notes?: string;
}

export interface ParseResult {
  parsed: ParsedDocument;
  normalized_source_text: string;
  skip_reason?: string;
}

const ARTICLE_HEADING = /(?:^|[\n\r]|[«"“”]\s*)(?:ARTICLE|Article|ART\.?|Artic[ecll]{1,5})(?:\s+)(premier|PREMIER|1er|unique|UNIQUE|[0-9]+(?:\s*[-–—]\s*[0-9]+)?(?:\s+(?:bis|ter|quater))?)(?:\s*[:.\-–—])?/g;
const CHAPTER_HEADING = /(?:^|\n)\s*(CHAPITRE\s+[A-Z0-9IVX\-]+[^\n]*|Chapitre\s+[A-Za-z0-9IVX\-]+[^\n]*|TITRE\s+[A-Z0-9IVX\-]+[^\n]*|Titre\s+[A-Za-z0-9IVX\-]+[^\n]*|SECTION\s+[A-Z0-9IVX\-]+[^\n]*|Section\s+[A-Za-z0-9IVX\-]+[^\n]*)/g;

export const SOURCE_DOCUMENTS: SourceDocument[] = [
  {
    seed_file: '01-data-protection-law-09-08.json',
    id: 'ma-loi-09-08',
    type: 'statute',
    title: 'Loi n° 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel',
    title_en: 'Law No. 09-08 on the Protection of Individuals with Regard to Personal Data Processing',
    short_name: 'Loi 09-08',
    status: 'in_force',
    issued_date: '2009-02-18',
    url: 'https://www.dgssi.gov.ma/fr/loi-09-08-relative-la-protection-des-personnes-physiques-legard-du-traitement-des',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/loi%2009-08.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'obfuscated',
    law_number: '09-08',
    start_hint: 'CHAPITRE PREMIER',
    description: 'Texte fondateur marocain de protection des données personnelles.',
  },
  {
    seed_file: '02-cybersecurity-law-05-20.json',
    id: 'ma-loi-05-20',
    type: 'statute',
    title: 'Loi n° 05-20 relative à la cybersécurité',
    title_en: 'Law No. 05-20 on Cybersecurity',
    short_name: 'Loi 05-20',
    status: 'in_force',
    issued_date: '2020-07-25',
    url: 'https://www.dgssi.gov.ma/fr/loi-ndeg-0520-relative-la-cybersecurite',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-03/loi%2005-20.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    law_number: '05-20',
    start_hint: 'Chapitre premier',
    description: 'Cadre juridique marocain de cybersécurité pour les entités publiques, IIV et opérateurs.',
  },
  {
    seed_file: '03-telecommunications-law-24-96.json',
    id: 'ma-loi-24-96',
    type: 'statute',
    title: 'Loi n° 24-96 relative à la poste et aux télécommunications (version consolidée)',
    title_en: 'Law No. 24-96 on Postal Services and Telecommunications (consolidated)',
    short_name: 'Loi 24-96',
    status: 'in_force',
    url: 'https://www.dgssi.gov.ma/fr/loi-ndeg24-96-consolidee-relative-la-poste-et-aux-telecommunications-telle-quelle',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/loi%2024-96.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    law_number: '24-96',
    start_hint: 'TITRE 1',
    description: 'Texte cadre régissant le secteur des télécommunications.',
  },
  {
    seed_file: '04-consumer-protection-law-31-08.json',
    id: 'ma-loi-31-08',
    type: 'statute',
    title: 'Loi n° 31-08 édictant des mesures de protection du consommateur',
    title_en: 'Law No. 31-08 Enacting Consumer Protection Measures',
    short_name: 'Loi 31-08',
    status: 'in_force',
    url: 'https://www.dgssi.gov.ma/fr/loi-ndeg31-08-edictant-des-mesures-de-protection-du-consommateur-y-compris-la',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/loi%2031-08.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    law_number: '31-08',
    description: 'Protection des consommateurs, y compris consommateurs en ligne.',
  },
  {
    seed_file: '05-electronic-exchange-law-53-05.json',
    id: 'ma-loi-53-05',
    type: 'statute',
    title: 'Loi n° 53-05 relative à l’échange électronique de données juridiques',
    title_en: 'Law No. 53-05 on Electronic Exchange of Legal Data',
    short_name: 'Loi 53-05',
    status: 'in_force',
    issued_date: '2007-11-30',
    url: 'https://www.dgssi.gov.ma/fr/loi-53-05-relative-lechange-electronique-de-donnees-juridiques',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-03/loi%2053-05.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'obfuscated',
    law_number: '53-05',
    start_hint: 'CHAPITRE PRELIMINAIRE',
    description: 'Cadre juridique marocain des actes et signatures électroniques.',
  },
  {
    seed_file: '06-trust-services-law-43-20.json',
    id: 'ma-loi-43-20',
    type: 'statute',
    title: 'Loi n° 43-20 relative aux services de confiance pour les transactions électroniques',
    title_en: 'Law No. 43-20 on Trust Services for Electronic Transactions',
    short_name: 'Loi 43-20',
    status: 'in_force',
    issued_date: '2020-12-31',
    url: 'https://www.dgssi.gov.ma/fr/loi-ndeg43-20-relative-aux-services-de-confiance-pour-les-transactions',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-03/loi%2043-20.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    law_number: '43-20',
    start_hint: 'TITRE PRELIMINAIRE',
    description: 'Services de confiance, signature électronique et cryptologie.',
  },
  {
    seed_file: '07-cybercrime-law-07-03.json',
    id: 'ma-loi-07-03',
    type: 'statute',
    title: 'Loi n° 07-03 complétant le code pénal en ce qui concerne les infractions relatives aux systèmes de traitement automatisé des données',
    title_en: 'Law No. 07-03 Amending the Penal Code for Offences Relating to Automated Data Processing Systems',
    short_name: 'Loi 07-03',
    status: 'in_force',
    url: 'https://www.dgssi.gov.ma/fr/loi-07-03-completant-le-code-penal-en-ce-qui-concerne-les-infractions-relatives-aux',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-03/loi%2007-03.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    law_number: '07-03',
    description: 'Infractions pénales relatives aux systèmes d’information.',
  },
  {
    seed_file: '08-cloud-critical-infrastructure-decree-2-24-921.json',
    id: 'ma-decret-2-24-921',
    type: 'statute',
    title: 'Décret n° 2-24-921 relatif au recours aux prestataires de services Cloud par les entités et les infrastructures d’importance vitale',
    title_en: 'Decree No. 2-24-921 on the Use of Cloud Service Providers by Entities and Vital Infrastructure',
    short_name: 'Décret 2-24-921',
    status: 'in_force',
    issued_date: '2025-02-20',
    url: 'https://www.dgssi.gov.ma/fr/reglementations/decret-ndeg-2-24-921-relatif-au-recours-aux-prestataires-de-services-cloud-par-les',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2025-04/D%C3%A9cret%202.24.921%20Fr%20.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    start_hint: 'Chapitre premier',
    description: 'Règles de qualification Cloud applicables aux SI sensibles et IIV.',
  },
  {
    seed_file: '09-implementation-decree-2-22-687.json',
    id: 'ma-decret-2-22-687',
    type: 'statute',
    title: 'Décret n° 2-22-687 pris pour l’application de la loi n° 43-20 relative aux services de confiance pour les transactions électroniques',
    title_en: 'Decree No. 2-22-687 Implementing Law No. 43-20 on Trust Services for Electronic Transactions',
    short_name: 'Décret 2-22-687',
    status: 'in_force',
    issued_date: '2023-01-19',
    url: 'https://www.dgssi.gov.ma/fr/reglementations/decret-ndeg-2-22-687-du-21-rabii-ii-1444-16-novembre-2022-pris-pour-lapplication-de',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/Decret%202-22-687%20.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    start_hint: 'ARTICLE PREMIER',
    description: 'Texte d’application de la loi n° 43-20.',
  },
  {
    seed_file: '10-industrial-property-law-17-97.json',
    id: 'ma-loi-17-97',
    type: 'statute',
    title: 'Loi n° 17-97 relative à la protection de la propriété industrielle',
    title_en: 'Law No. 17-97 on Industrial Property Protection',
    short_name: 'Loi 17-97',
    status: 'in_force',
    url: 'https://www.ompic.ma/fr/content/loi-17-97-relative-la-protection-de-la-propriete-industrielle',
    source_url: 'http://www.ompic.ma/sites/default/files/LivreLoiFR20160426.pdf',
    source_authority: 'OMPIC',
    source_encoding: 'plain',
    start_hint: 'LOI n°17-97 relative à la propriété industrielle',
    description: 'Régime de propriété industrielle (texte consolidé OMPIC modifié par les lois 31-05 et 23-13).',
  },
  // --- New entries: DGSSI decrees/arretes + foundational codes ---
  {
    seed_file: '11-cloud-qualification-arrete-3-17-25.json',
    id: 'ma-arrete-3-17-25',
    type: 'statute',
    title: 'Arrêté du Chef du Gouvernement n° 3-17-25 du 7 safar 1447 (1er août 2025) fixant le référentiel des exigences de qualification des prestataires de services Cloud',
    title_en: 'Order No. 3-17-25 Setting Cloud Service Provider Qualification Requirements',
    short_name: 'Arrêté 3-17-25',
    status: 'in_force',
    issued_date: '2025-08-01',
    url: 'https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires/arrete-du-chef-du-gouvernement-ndeg-3-17-25-du-7-safar-1447',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2025-09/Arre%CC%82te%CC%81%20du%20Chef%20du%20gouvernement%20n%C2%B0%203-17-25%20du%207%20safar%201447%20%281er%20aou%CC%82t%202025%29%20fixant%20le%20re%CC%81fe%CC%81rentiel%20des%20exigences%20de%20qualification%20des%20prestataires%20de%20services%20Cloud.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    description: 'Référentiel des exigences de qualification des prestataires de services Cloud (application du décret 2-24-921).',
  },
  {
    seed_file: '12-cybersecurity-implementation-decree-2-21-406.json',
    id: 'ma-decret-2-21-406',
    type: 'statute',
    title: 'Décret n° 2-21-406 du 4 hija 1442 (15 juillet 2021) pris pour l\u2019application de la loi n° 05-20 relative à la cybersécurité',
    title_en: 'Decree No. 2-21-406 Implementing Law No. 05-20 on Cybersecurity',
    short_name: 'Décret 2-21-406',
    status: 'in_force',
    issued_date: '2021-07-15',
    url: 'https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires/decret-ndeg-2-21-406-du-4-hija-1442-15-juillet-2021-pris-pour',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/Decret%20%202-21-406%20.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    start_hint: 'Article premier',
    description: 'Texte d\u2019application de la loi n° 05-20 relative à la cybersécurité.',
  },
  {
    seed_file: '13-cybersecurity-innovation-arrete-1148-25.json',
    id: 'ma-arrete-1148-25',
    type: 'statute',
    title: 'Arrêté conjoint n° 1148/25 portant approbation de la convention instituant le Centre d\u2019Innovation en Cybersécurité',
    title_en: 'Joint Order No. 1148/25 Approving the Convention Establishing the Cybersecurity Innovation Center',
    short_name: 'Arrêté 1148/25',
    status: 'in_force',
    issued_date: '2025-06-01',
    url: 'https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires/publication-de-larrete-conjoint-ndeg-114825-portant',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2025-06/arr%C3%AAt%C3%A9_n_1148.25.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    description: 'Convention instituant le Centre d\u2019Innovation en Cybersécurité.',
  },
  {
    seed_file: '14-data-protection-implementation-decree-2-09-165.json',
    id: 'ma-decret-2-09-165',
    type: 'statute',
    title: 'Décret n° 2-09-165 du 25 joumada I 1430 (21 mai 2009) pris pour l\u2019application de la loi n° 09-08 relative à la protection des personnes physiques à l\u2019égard des traitements des données à caractère personnel',
    title_en: 'Decree No. 2-09-165 Implementing Law No. 09-08 on Personal Data Protection',
    short_name: 'Décret 2-09-165',
    status: 'in_force',
    issued_date: '2009-05-21',
    url: 'https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires/decret-ndeg-2-09-165-du-25-joumada-i-1430-21-mai-2009-pris',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/Decret%202-09-165.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    start_hint: 'Article premier',
    description: 'Texte d\u2019application de la loi n° 09-08 sur la protection des données personnelles.',
  },
  {
    seed_file: '15-electronic-exchange-implementation-decree-2-08-518.json',
    id: 'ma-decret-2-08-518',
    type: 'statute',
    title: 'Décret n° 2-08-518 du 25 joumada I 1430 (21 mai 2009) pris pour l\u2019application des articles 13, 14, 15, 21 et 23 de la loi n° 53-05 relative à l\u2019échange électronique des données juridiques',
    title_en: 'Decree No. 2-08-518 Implementing Articles 13-15, 21, 23 of Law No. 53-05 on Electronic Data Exchange',
    short_name: 'Décret 2-08-518',
    status: 'in_force',
    issued_date: '2009-05-21',
    url: 'https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires/decret-ndeg-2-08-518-du-25-joumada-i-1430-21-mai-2009-pris',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/Decret%20%202-08-518.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    start_hint: 'Article premier',
    description: 'Texte d\u2019application de la loi n° 53-05 relative à l\u2019échange électronique.',
  },
  {
    seed_file: '16-dgssi-creation-decree-2-11-509.json',
    id: 'ma-decret-2-11-509',
    type: 'statute',
    title: 'Décret n° 2-11-509 du 22 chaoual 1432 (21 septembre 2011) complétant le décret n° 2-82-673 relatif à l\u2019organisation de l\u2019ADN et portant création de la DGSSI',
    title_en: 'Decree No. 2-11-509 Establishing the DGSSI (General Directorate of Information Systems Security)',
    short_name: 'Décret 2-11-509',
    status: 'in_force',
    issued_date: '2011-09-21',
    url: 'https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires/decret-ndeg2-11-509-du-22-chaoual-1432-21-septembre-2011',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/Decret%20%202-11-509.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    description: 'Décret portant création de la Direction Générale de la Sécurité des Systèmes d\u2019Information (DGSSI).',
  },
  {
    seed_file: '17-decree-2-13-881-amending-2-08-518.json',
    id: 'ma-decret-2-13-881',
    type: 'statute',
    title: 'Décret n° 2-13-881 du 28 rabii I 1436 (20 janvier 2015) modifiant et complétant le décret n° 2-08-518',
    title_en: 'Decree No. 2-13-881 Amending Decree No. 2-08-518 on Electronic Data Exchange',
    short_name: 'Décret 2-13-881',
    status: 'in_force',
    issued_date: '2015-01-20',
    url: 'https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires/decret-ndeg-2-13-881-du-28-rabii-i-1436-20-janvier-2015',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/Decret%202-13-881%20.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    description: 'Modification du décret 2-08-518 relatif à l\u2019échange électronique.',
  },
  {
    seed_file: '18-circulaire-dnssi-2-2023.json',
    id: 'ma-circulaire-2-2023',
    type: 'statute',
    title: 'Circulaire du chef du gouvernement n\u00b0 2/2023 du 12 janvier 2023 pour l\u2019application de la directive nationale de la SSI',
    title_en: 'Prime Minister Circular No. 2/2023 on Implementing the National Information Systems Security Directive (DNSSI)',
    short_name: 'Circulaire 2/2023',
    status: 'in_force',
    issued_date: '2023-01-12',
    url: 'https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires/circulaire-du-chef-du-gouvernement-ndeg-22023-du-12-janvier',
    source_url: 'https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/Circulaire%2002-2023.pdf',
    source_authority: 'DGSSI',
    source_encoding: 'plain',
    description: 'Circulaire de mise en \u0153uvre de la Directive Nationale de la S\u00e9curit\u00e9 des Syst\u00e8mes d\u2019Information.',
  },
  // --- Foundational Moroccan codes (SGG/Adala sources, may require VPN) ---
  {
    seed_file: '19-constitution-2011.json',
    id: 'ma-constitution-2011',
    type: 'statute',
    title: 'Constitution du Royaume du Maroc (2011)',
    title_en: 'Constitution of the Kingdom of Morocco (2011)',
    short_name: 'Constitution 2011',
    status: 'in_force',
    issued_date: '2011-07-29',
    url: 'https://www.sgg.gov.ma/Portals/0/constitution/constitution_2011_Fr.pdf',
    source_url: 'https://www.sgg.gov.ma/Portals/0/constitution/constitution_2011_Fr.pdf',
    source_authority: 'SGG',
    source_encoding: 'plain',
    start_hint: 'PREAMBULE',
    description: 'Loi fondamentale du Royaume du Maroc, adoptée par référendum le 1er juillet 2011.',
  },
  {
    seed_file: '20-code-penal.json',
    id: 'ma-code-penal',
    type: 'statute',
    title: 'Code pénal marocain (Dahir n° 1-59-413 du 26 novembre 1962)',
    title_en: 'Moroccan Penal Code',
    short_name: 'Code pénal',
    status: 'in_force',
    issued_date: '1962-11-26',
    url: 'http://adala.justice.gov.ma/production/legislation/fr/penal/CodePenal.htm',
    source_url: 'http://adala.justice.gov.ma/production/legislation/fr/penal/CodePenal.htm',
    source_authority: 'Adala (Ministère de la Justice)',
    source_encoding: 'plain',
    start_hint: 'LIVRE PREMIER',
    description: 'Code pénal marocain définissant les infractions et les peines.',
  },
  {
    seed_file: '21-code-commerce.json',
    id: 'ma-code-commerce',
    type: 'statute',
    title: 'Code de commerce (Loi n° 15-95)',
    title_en: 'Commercial Code (Law No. 15-95)',
    short_name: 'Code de commerce',
    status: 'in_force',
    issued_date: '1996-08-01',
    url: 'http://adala.justice.gov.ma/production/legislation/fr/Nouveautes/CodeDeCommerce.htm',
    source_url: 'http://adala.justice.gov.ma/production/legislation/fr/Nouveautes/CodeDeCommerce.htm',
    source_authority: 'Adala (Ministère de la Justice)',
    source_encoding: 'plain',
    law_number: '15-95',
    start_hint: 'LIVRE PREMIER',
    description: 'Code de commerce marocain régissant les activités commerciales.',
  },
  {
    seed_file: '22-code-travail.json',
    id: 'ma-code-travail',
    type: 'statute',
    title: 'Code du travail (Loi n° 65-99)',
    title_en: 'Labor Code (Law No. 65-99)',
    short_name: 'Code du travail',
    status: 'in_force',
    issued_date: '2004-06-08',
    url: 'http://adala.justice.gov.ma/production/legislation/fr/Nouveautes/CodeDuTravail.htm',
    source_url: 'http://adala.justice.gov.ma/production/legislation/fr/Nouveautes/CodeDuTravail.htm',
    source_authority: 'Adala (Ministère de la Justice)',
    source_encoding: 'plain',
    law_number: '65-99',
    start_hint: 'LIVRE PREMIER',
    description: 'Code du travail marocain régissant les relations de travail.',
  },
  {
    seed_file: '23-dahir-obligations-contrats.json',
    id: 'ma-doc',
    type: 'statute',
    title: 'Dahir des Obligations et Contrats (Dahir du 12 août 1913)',
    title_en: 'Code of Obligations and Contracts (Dahir of 12 August 1913)',
    short_name: 'DOC',
    status: 'in_force',
    issued_date: '1913-08-12',
    url: 'http://adala.justice.gov.ma/production/legislation/fr/civil/dahirdesObligationsetcontrats.htm',
    source_url: 'http://adala.justice.gov.ma/production/legislation/fr/civil/dahirdesObligationsetcontrats.htm',
    source_authority: 'Adala (Ministère de la Justice)',
    source_encoding: 'plain',
    start_hint: 'LIVRE PREMIER',
    description: 'Dahir des Obligations et Contrats, droit civil marocain des obligations.',
  },
];

function decodeObfuscatedText(input: string): string {
  const decoded: string[] = [];

  for (const ch of input) {
    const code = ch.charCodeAt(0);

    if (code === 3) {
      decoded.push(' ');
      continue;
    }

    if (code === 12) {
      decoded.push('\n');
      continue;
    }

    // Common punctuation represented by low control codes in these PDFs.
    if (code === 15) {
      decoded.push(',');
      continue;
    }
    if (code === 16) {
      decoded.push('-');
      continue;
    }
    if (code === 17) {
      decoded.push('.');
      continue;
    }
    if (code === 18) {
      decoded.push('/');
      continue;
    }

    // Encoded digits 0-9.
    if (code >= 19 && code <= 28) {
      decoded.push(String(code - 19));
      continue;
    }

    // Alternate uppercase glyph map (ASCII punctuation + 29 => A-Z).
    if (code >= 36 && code <= 61) {
      const mapped = String.fromCharCode(code + 29);
      if (/[A-Z]/.test(mapped)) {
        decoded.push(mapped);
        continue;
      }
    }

    // Caesar-style +3 shift used in many sections.
    if (/[A-Z]/.test(ch)) {
      decoded.push(String.fromCharCode(((code - 65 - 3 + 26) % 26) + 65));
      continue;
    }

    if (/[a-z]/.test(ch)) {
      decoded.push(String.fromCharCode(((code - 97 - 3 + 26) % 26) + 97));
      continue;
    }

    decoded.push(ch);
  }

  return decoded
    .join('')
    .replace(/Â/g, '')
    .replace(/\u0004/g, ' ')
    .replace(/[\u0007\u0008\u000e\u001d\u001e\u007f]/g, ' ')
    .replace(/\u00a0/g, ' ');
}

function normalizeSourceText(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/\f/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeSection(sectionRaw: string): string {
  const cleaned = sectionRaw.replace(/\s+/g, ' ').trim();
  if (/^(premier|1er)$/i.test(cleaned)) return '1';
  return cleaned.replace(/\s+/g, '').replace(/[–—]/g, '-');
}

function findStartIndex(text: string, doc: SourceDocument): number {
  if (doc.law_number) {
    const escaped = doc.law_number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lawPattern = new RegExp(`LOI\\s+N[^\\n]{0,20}${escaped}`, 'gi');
    const matches = [...text.matchAll(lawPattern)];
    if (matches.length > 0) {
      // OCR for BO scans can reorder columns; prefer the first hit in that case.
      if (doc.ocr_page_start || doc.ocr_page_end) {
        return matches[0].index ?? 0;
      }

      // Last match avoids early references in promulgation headers.
      return matches[matches.length - 1].index ?? 0;
    }
  }

  if (doc.start_hint) {
    const hintPattern = new RegExp(doc.start_hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const match = hintPattern.exec(text);
    if (match && typeof match.index === 'number') {
      return match.index;
    }
  }

  return 0;
}

function findEndIndex(text: string, doc: SourceDocument, startIndex: number): number {
  if (!doc.end_hint) {
    return text.length;
  }

  const hintPattern = new RegExp(doc.end_hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const searchWindow = text.slice(startIndex);
  const match = hintPattern.exec(searchWindow);
  if (!match || typeof match.index !== 'number') {
    return text.length;
  }

  return startIndex + match.index;
}

function findChapter(text: string, articleStart: number): string | undefined {
  const windowStart = Math.max(0, articleStart - 2000);
  const before = text.slice(windowStart, articleStart);
  const headings = [...before.matchAll(CHAPTER_HEADING)];
  if (headings.length === 0) return undefined;
  return headings[headings.length - 1][1].trim();
}

function cleanupArticleContent(content: string): string {
  return content
    .replace(/\n\s*\[\[PAGE\s+\d+\]\]\s*\n/gi, '\n')
    .replace(/\n\s*(BULLETIN OFFICIEL|Nº\s*\d+[^\n]*|N°\s*\d+[^\n]*)\s*/gi, '\n')
    .replace(/\n\s*\d+\s*\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractDefinitionsFromArticleTwo(content: string, provisionRef: string): ParsedDefinition[] {
  const defs: ParsedDefinition[] = [];

  const quotePatterns = [
    /[«"]\s*([^»":\n]{2,120})\s*[»"]\s*[:\-–]\s*([^\n]{4,400})/g,
    /[-–]\s*[«"]\s*([^»":\n]{2,120})\s*[»"]\s*[:\-–]\s*([^\n]{4,400})/g,
  ];

  for (const pattern of quotePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const term = match[1].trim();
      const definition = match[2].trim().replace(/[.;]$/, '');
      if (term.length < 2 || definition.length < 4) continue;
      defs.push({ term, definition, source_provision: provisionRef });
    }
  }

  const unique = new Map<string, ParsedDefinition>();
  for (const d of defs) {
    const key = `${d.term.toLowerCase()}::${d.definition.toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, d);
  }

  return [...unique.values()];
}

export function parseOfficialDocument(doc: SourceDocument, rawText: string): ParseResult {
  const decoded = doc.source_encoding === 'obfuscated'
    ? decodeObfuscatedText(rawText)
    : rawText;

  const normalized = normalizeSourceText(decoded);
  const startIndex = findStartIndex(normalized, doc);
  const endIndex = findEndIndex(normalized, doc, startIndex);
  const sliced = normalized.slice(startIndex, endIndex);

  const articleMatches = [...sliced.matchAll(ARTICLE_HEADING)];

  if (articleMatches.length === 0) {
    return {
      parsed: {
        id: doc.id,
        type: doc.type,
        title: doc.title,
        title_en: doc.title_en,
        short_name: doc.short_name,
        status: doc.status,
        issued_date: doc.issued_date,
        in_force_date: doc.in_force_date,
        url: doc.url,
        description: doc.description,
        provisions: [],
        definitions: [],
        ingestion_status: 'skipped',
      },
      normalized_source_text: sliced,
      skip_reason: 'No extractable article headings found (likely image-only PDF or inaccessible source text).',
    };
  }

  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  for (let i = 0; i < articleMatches.length; i++) {
    const current = articleMatches[i];
    const next = articleMatches[i + 1];

    const sectionRaw = current[1];
    if (!sectionRaw) continue;

    const section = normalizeSection(sectionRaw);
    const articleStart = current.index ?? 0;
    const bodyStart = articleStart + current[0].length;
    const bodyEnd = next ? (next.index ?? sliced.length) : sliced.length;
    const body = cleanupArticleContent(sliced.slice(bodyStart, bodyEnd));

    if (body.length < 40) continue;

    const provisionRef = `art${section.replace(/[^0-9A-Za-z\-]/g, '')}`;

    provisions.push({
      provision_ref: provisionRef,
      chapter: findChapter(sliced, articleStart),
      section,
      title: `Article ${section}`,
      content: body,
    });

    if (section === '2') {
      definitions.push(...extractDefinitionsFromArticleTwo(body, provisionRef));
    }
  }

  const uniqueProvisions = new Map<string, ParsedProvision>();
  for (const provision of provisions) {
    if (!uniqueProvisions.has(provision.provision_ref)) {
      uniqueProvisions.set(provision.provision_ref, provision);
    }
  }
  const dedupedProvisions = [...uniqueProvisions.values()];

  if (dedupedProvisions.length === 0) {
    return {
      parsed: {
        id: doc.id,
        type: doc.type,
        title: doc.title,
        title_en: doc.title_en,
        short_name: doc.short_name,
        status: doc.status,
        issued_date: doc.issued_date,
        in_force_date: doc.in_force_date,
        url: doc.url,
        description: doc.description,
        provisions: [],
        definitions: [],
        ingestion_status: 'skipped',
      },
      normalized_source_text: sliced,
      skip_reason: 'Article headings were detected but no substantive article content could be extracted.',
    };
  }

  return {
    parsed: {
      id: doc.id,
      type: doc.type,
      title: doc.title,
      title_en: doc.title_en,
      short_name: doc.short_name,
      status: doc.status,
      issued_date: doc.issued_date,
      in_force_date: doc.in_force_date,
      url: doc.url,
      description: doc.description,
      provisions: dedupedProvisions,
      definitions,
      ingestion_status: 'ingested',
    },
    normalized_source_text: sliced,
  };
}
