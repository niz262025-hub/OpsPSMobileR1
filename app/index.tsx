import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowRight,
  Check,
  Globe,
  Package,
  ShoppingBag,
  Sparkles,
  Truck,
  WalletCards,
} from 'lucide-react-native';

type Language = 'BM' | 'EN' | 'HI' | 'ZH';

const content = {
  BM: {
    login: 'Log Masuk',
    heroLabel: 'PERSONAL SHOPPER SYSTEM',
    heroTitle: 'Urus Personal Shopper',
    heroTitle2: 'Dalam Satu Aplikasi',
    heroDescription:
      'Semua yang anda perlukan untuk mengurus produk, order, trip, pembelian, inventory, kewangan dan keuntungan personal shopper dalam satu sistem.',
    free: 'Mula Percuma',
    freeSub: 'Percubaan percuma • 2 Trips',
    noCard: 'Tiada kad kredit diperlukan',

    needsTitle:
      'Semua Keperluan Personal Shopper, Dalam Satu Sistem',
    needsSub:
      'Urus keseluruhan operasi personal shopper dengan lebih mudah, tersusun dan pantas.',

    product: 'Produk & Order',
    productSub:
      'Urus produk, customer dan order dalam satu tempat.',

    trip: 'Trip & Pembelian',
    tripSub:
      'Rancang trip dan sediakan senarai pembelian dengan mudah.',

    inventory: 'Inventory',
    inventorySub:
      'Pantau stock, size, variant dan pergerakan inventory.',

    finance: 'Finance & Profit',
    financeSub:
      'Pantau sales, kos, expenses dan keuntungan.',

    pricingTitle: 'Pilih Pelan OpsPS',
    pricingSub:
      'Cuba percuma dengan 2 Trips atau sertai 100 pengguna Founder pertama.',

    founder: 'FOUNDER 100',
    founderUsers: '100 pengguna pertama',
    founderPrice: 'RM39',
    month: '/bulan',
    founderDescription:
      'Harga Founder RM39/bulan untuk 100 pengguna pertama.',
    founder1: 'Harga Founder dikunci',
    founder2: 'Untuk 100 pengguna pertama',
    founder3: 'Semua fungsi OpsPS',
    founderButton: 'Jadi Founder',

    standard: 'STANDARD',
    standardUsers: 'Selepas Founder 100 habis',
    standardPrice: 'RM49',
    standardDescription:
      'Harga standard selepas semua 100 slot Founder telah habis.',
    standard1: 'Selepas 100 Founder',
    standard2: 'Harga standard RM49/bulan',
    standard3: 'Semua fungsi OpsPS',

    footer: '© 2026 OpsPS. Personal Shopper System.',
  },

  EN: {
    login: 'Login',
    heroLabel: 'PERSONAL SHOPPER SYSTEM',
    heroTitle: 'Manage Your Personal Shopper',
    heroTitle2: 'In One Application',
    heroDescription:
      'Everything you need to manage products, orders, trips, purchases, inventory, finance and profit in one complete system.',
    free: 'Start Free',
    freeSub: 'Free trial • 2 Trips',
    noCard: 'No credit card required',

    needsTitle:
      'Everything a Personal Shopper Needs, In One System',
    needsSub:
      'Manage your entire personal shopper operation in one simple, organised and powerful system.',

    product: 'Products & Orders',
    productSub:
      'Manage products, customers and orders in one place.',

    trip: 'Trips & Purchases',
    tripSub:
      'Plan trips and prepare your purchase list easily.',

    inventory: 'Inventory',
    inventorySub:
      'Track stock, sizes, variants and inventory movement.',

    finance: 'Finance & Profit',
    financeSub:
      'Monitor sales, costs, expenses and profit.',

    pricingTitle: 'Choose Your OpsPS Plan',
    pricingSub:
      'Start free with 2 Trips or become one of the first 100 Founders.',

    founder: 'FOUNDER 100',
    founderUsers: 'First 100 users',
    founderPrice: 'RM39',
    month: '/month',
    founderDescription:
      'Founder price RM39/month for the first 100 users.',
    founder1: 'Founder price locked',
    founder2: 'For the first 100 users',
    founder3: 'All OpsPS features',
    founderButton: 'Become a Founder',

    standard: 'STANDARD',
    standardUsers: 'After Founder 100 is full',
    standardPrice: 'RM49',
    standardDescription:
      'Standard price after all 100 Founder slots are taken.',
    standard1: 'After 100 Founders',
    standard2: 'Standard RM49/month',
    standard3: 'All OpsPS features',

    footer: '© 2026 OpsPS. Personal Shopper System.',
  },

  HI: {
    login: 'लॉग इन',
    heroLabel: 'PERSONAL SHOPPER SYSTEM',
    heroTitle: 'अपने Personal Shopper को',
    heroTitle2: 'एक ही ऐप में मैनेज करें',
    heroDescription:
      'Products, orders, trips, purchases, inventory, finance और profit को एक ही complete system में आसानी से manage करें।',
    free: 'मुफ्त शुरू करें',
    freeSub: 'मुफ्त ट्रायल • 2 Trips',
    noCard: 'क्रेडिट कार्ड की जरूरत नहीं',

    needsTitle:
      'Personal Shopper की सभी जरूरतें, एक ही सिस्टम में',
    needsSub:
      'अपने पूरे Personal Shopper operation को आसान और व्यवस्थित तरीके से manage करें।',

    product: 'Products & Orders',
    productSub:
      'Products, customers और orders को एक जगह manage करें.',

    trip: 'Trips & Purchases',
    tripSub:
      'Trips plan करें और purchase list आसानी से तैयार करें.',

    inventory: 'Inventory',
    inventorySub:
      'Stock, sizes, variants और inventory movement को track करें.',

    finance: 'Finance & Profit',
    financeSub:
      'Sales, costs, expenses और profit monitor करें.',

    pricingTitle: 'अपना OpsPS Plan चुनें',
    pricingSub:
      '2 Trips के साथ मुफ्त शुरू करें या पहले 100 Founders में शामिल हों।',

    founder: 'FOUNDER 100',
    founderUsers: 'पहले 100 users',
    founderPrice: 'RM39',
    month: '/month',
    founderDescription:
      'पहले 100 users के लिए Founder price RM39/month।',
    founder1: 'Founder price locked',
    founder2: 'पहले 100 users के लिए',
    founder3: 'सभी OpsPS features',
    founderButton: 'Founder बनें',

    standard: 'STANDARD',
    standardUsers: 'Founder 100 पूरा होने के बाद',
    standardPrice: 'RM49',
    standardDescription:
      'सभी 100 Founder slots भरने के बाद standard price लागू होगा।',
    standard1: '100 Founders के बाद',
    standard2: 'Standard RM49/month',
    standard3: 'सभी OpsPS features',

    footer: '© 2026 OpsPS. Personal Shopper System.',
  },

  ZH: {
    login: '登录',
    heroLabel: '个人购物系统',
    heroTitle: '管理您的 Personal Shopper',
    heroTitle2: '一个应用即可完成',
    heroDescription:
      '一个完整系统，帮助您管理产品、订单、Trips、采购、库存、财务和利润。',
    free: '免费开始',
    freeSub: '免费试用 • 2 Trips',
    noCard: '无需信用卡',

    needsTitle:
      'Personal Shopper 所需的一切，一个系统完成',
    needsSub:
      '轻松、有条理地管理您的整个 Personal Shopper 日常运营。',

    product: '产品与订单',
    productSub:
      '集中管理产品、客户和订单。',

    trip: 'Trip 与采购',
    tripSub:
      '规划 Trip，并轻松准备采购清单。',

    inventory: '库存',
    inventorySub:
      '管理库存、尺寸、Variant 和库存移动。',

    finance: '财务与利润',
    financeSub:
      '查看销售、成本、费用和利润。',

    pricingTitle: '选择 OpsPS 方案',
    pricingSub:
      '免费开始使用 2 Trips，或成为前 100 位 Founder。',

    founder: 'FOUNDER 100',
    founderUsers: '前100位用户',
    founderPrice: 'RM39',
    month: '/月',
    founderDescription:
      '前100位用户享有 RM39/月 Founder 价格。',
    founder1: '锁定 Founder 价格',
    founder2: '前100位用户',
    founder3: '完整 OpsPS 功能',
    founderButton: '成为 Founder',

    standard: 'STANDARD',
    standardUsers: 'Founder 100 名额用完后',
    standardPrice: 'RM49',
    standardDescription:
      '100 个 Founder 名额用完后采用标准价格。',
    standard1: '100 位 Founder 之后',
    standard2: '标准 RM49/月',
    standard3: '完整 OpsPS 功能',

    footer: '© 2026 OpsPS. Personal Shopper System.',
  },
};

function goLogin() {
  router.push('/login');
}

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const [language, setLanguage] =
    React.useState<Language>('BM');

  const t = content[language];
  const desktop = width >= 900;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.logoRow}>

            <View style={styles.logoBox}>
              <Text style={styles.logoHeart}>♥</Text>
            </View>

            <View>
              <Text style={styles.logo}>
                <Text style={styles.ops}>Ops</Text>
                <Text style={styles.ps}>PS</Text>
              </Text>

              <Text style={styles.logoSub}>
                Personal Shopper System
              </Text>
            </View>

          </View>

          <View style={styles.headerRight}>

            {/* LANGUAGES */}

            <View style={styles.languages}>
              <Globe
                size={15}
                color="#5B2BD9"
              />

              {(['BM', 'EN', 'HI', 'ZH'] as Language[]).map(
                (item) => (
                  <Pressable
                    key={item}
                    onPress={() => setLanguage(item)}
                    style={[
                      styles.language,
                      language === item &&
                        styles.languageActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        language === item &&
                          styles.languageTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>

            {/* LOGIN */}

            <Pressable
              onPress={goLogin}
              style={styles.login}
            >
              <Text style={styles.loginText}>
                {t.login}
              </Text>
            </Pressable>

          </View>
        </View>


        {/* HERO */}

        <View
          style={[
            styles.hero,
            desktop
              ? styles.heroDesktop
              : styles.heroMobile,
          ]}
        >

          {/* FULL IMAGE */}

          <View style={styles.heroImageContainer}>
            <Image
              source={require(
                '../assets/illustrations/opsone-reference.png',
              )}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>


          {/* HERO CONTENT */}

          <View style={styles.heroContent}>

            <View style={styles.labelRow}>
              <Sparkles
                size={15}
                color="#EC4C99"
              />

              <Text style={styles.heroLabel}>
                {t.heroLabel}
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              {t.heroTitle}
            </Text>

            <Text style={styles.heroTitlePink}>
              {t.heroTitle2}
            </Text>

            <Text style={styles.heroDescription}>
              {t.heroDescription}
            </Text>

            {/* ONLY ONE CTA */}

            <Pressable
              onPress={goLogin}
              style={styles.freeButton}
            >
              <View>
                <Text style={styles.freeButtonTitle}>
                  {t.free}
                </Text>

                <Text style={styles.freeButtonSub}>
                  {t.freeSub}
                </Text>
              </View>

              <ArrowRight
                size={22}
                color="#FFFFFF"
                strokeWidth={2.5}
              />
            </Pressable>

            <Text style={styles.noCard}>
              ✓ {t.noCard}
            </Text>

          </View>
        </View>


        {/* OPSPS FUNCTIONS */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            {t.needsTitle}
          </Text>

          <Text style={styles.sectionSub}>
            {t.needsSub}
          </Text>

          <View
            style={[
              styles.needsRow,
              !desktop && styles.needsRowMobile,
            ]}
          >

            <NeedItem
              icon={
                <ShoppingBag
                  size={34}
                  color="#5B2BD9"
                  strokeWidth={2}
                />
              }
              title={t.product}
              subtitle={t.productSub}
            />

            <NeedItem
              icon={
                <Truck
                  size={34}
                  color="#EC4C99"
                  strokeWidth={2}
                />
              }
              title={t.trip}
              subtitle={t.tripSub}
            />

            <NeedItem
              icon={
                <Package
                  size={34}
                  color="#5B2BD9"
                  strokeWidth={2}
                />
              }
              title={t.inventory}
              subtitle={t.inventorySub}
            />

            <NeedItem
              icon={
                <WalletCards
                  size={34}
                  color="#EC4C99"
                  strokeWidth={2}
                />
              }
              title={t.finance}
              subtitle={t.financeSub}
            />

          </View>
        </View>


        {/* PRICING */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            {t.pricingTitle}
          </Text>

          <Text style={styles.sectionSub}>
            {t.pricingSub}
          </Text>

          <View
            style={[
              styles.pricingRow,
              !desktop && styles.pricingMobile,
            ]}
          >

            {/* FOUNDER 100 */}

            <View
              style={[
                styles.plan,
                styles.founderPlan,
              ]}
            >

              <View style={styles.planHeader}>

                <View style={styles.founderBadge}>
                  <Sparkles
                    size={13}
                    color="#FFFFFF"
                  />

                  <Text style={styles.badgeText}>
                    {t.founder}
                  </Text>
                </View>

                <Text style={styles.users}>
                  {t.founderUsers}
                </Text>

              </View>

              <View style={styles.priceRow}>

                <Text style={styles.founderPrice}>
                  {t.founderPrice}
                </Text>

                <Text style={styles.founderMonth}>
                  {t.month}
                </Text>

              </View>

              <Text style={styles.founderDescription}>
                {t.founderDescription}
              </Text>

              <View style={styles.checkList}>

                <CheckLine text={t.founder1} />

                <CheckLine text={t.founder2} />

                <CheckLine text={t.founder3} />

              </View>

              <Pressable
                onPress={goLogin}
                style={styles.founderButton}
              >
                <Text style={styles.founderButtonText}>
                  {t.founderButton}
                </Text>

                <ArrowRight
                  size={18}
                  color="#5B2BD9"
                />
              </Pressable>

            </View>


            {/* STANDARD */}

            <View
              style={[
                styles.plan,
                styles.standardPlan,
              ]}
            >

              <View style={styles.standardHeader}>

                <View>
                  <Text style={styles.standardTitle}>
                    {t.standard}
                  </Text>

                  <Text style={styles.standardLabel}>
                    {t.standardUsers}
                  </Text>
                </View>

              </View>

              <View style={styles.priceRow}>

                <Text style={styles.standardPrice}>
                  {t.standardPrice}
                </Text>

                <Text style={styles.standardMonth}>
                  {t.month}
                </Text>

              </View>

              <Text style={styles.standardDescription}>
                {t.standardDescription}
              </Text>

              <View style={styles.checkList}>

                <CheckLine
                  text={t.standard1}
                  muted
                />

                <CheckLine
                  text={t.standard2}
                  muted
                />

                <CheckLine
                  text={t.standard3}
                  muted
                />

              </View>

            </View>

          </View>
        </View>


        {/* FOOTER */}

        <View style={styles.footer}>

          <Text style={styles.footerLogo}>
            <Text style={styles.ops}>
              Ops
            </Text>

            <Text style={styles.ps}>
              PS
            </Text>
          </Text>

          <Text style={styles.footerText}>
            {t.footer}
          </Text>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


/* =====================================================
   OPSPS FUNCTION CARD
===================================================== */

function NeedItem({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.needItem}>

      <View style={styles.needIcon}>
        {icon}
      </View>

      <Text style={styles.needTitle}>
        {title}
      </Text>

      <Text style={styles.needSubtitle}>
        {subtitle}
      </Text>

    </View>
  );
}


/* =====================================================
   CHECK LINE
===================================================== */

function CheckLine({
  text,
  muted = false,
}: {
  text: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.checkLine}>

      <View
        style={[
          styles.checkCircle,
          muted && styles.checkCircleMuted,
        ]}
      >
        <Check
          size={12}
          color={
            muted
              ? '#8E899B'
              : '#FFFFFF'
          }
          strokeWidth={3}
        />
      </View>

      <Text
        style={[
          styles.checkText,
          muted && styles.checkTextMuted,
        ]}
      >
        {text}
      </Text>

    </View>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },

  scroll: {
    paddingBottom: 30,
  },


  /* HEADER */

  header: {
    minHeight: 74,
    paddingHorizontal: 30,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E2EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#5B2BD9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  logoHeart: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  logo: {
    fontSize: 24,
    fontWeight: '900',
  },

  ops: {
    color: '#181145',
  },

  ps: {
    color: '#EC4C99',
  },

  logoSub: {
    color: '#77738D',
    fontSize: 10,
    marginTop: 1,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },


  /* LANGUAGES */

  languages: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FA',
    borderRadius: 11,
    paddingHorizontal: 5,
    paddingVertical: 4,
    gap: 2,
  },

  language: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
  },

  languageActive: {
    backgroundColor: '#5B2BD9',
  },

  languageText: {
    color: '#77738D',
    fontSize: 11,
    fontWeight: '800',
  },

  languageTextActive: {
    color: '#FFFFFF',
  },


  /* LOGIN */

  login: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8D2E8',
    justifyContent: 'center',
  },

  loginText: {
    color: '#5B2BD9',
    fontSize: 13,
    fontWeight: '800',
  },


  /* HERO */

  hero: {
    width: '100%',
    maxWidth: 1350,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingTop: 38,
    paddingBottom: 28,
    gap: 45,
  },

  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroMobile: {
    flexDirection: 'column',
  },


  /* FULL HERO IMAGE */

  heroImageContainer: {
    flex: 1,
    minHeight: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6E1EE',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroImage: {
    width: '100%',
    height: 390,
  },


  /* HERO CONTENT */

  heroContent: {
    flex: 1,
    maxWidth: 590,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },

  heroLabel: {
    color: '#EC4C99',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  heroTitle: {
    color: '#181145',
    fontSize: 43,
    lineHeight: 49,
    fontWeight: '900',
  },

  heroTitlePink: {
    color: '#EC4C99',
    fontSize: 43,
    lineHeight: 49,
    fontWeight: '900',
  },

  heroDescription: {
    color: '#6B6B8A',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
  },


  /* ONE FREE BUTTON */

  freeButton: {
    width: 310,
    minHeight: 61,
    marginTop: 22,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: '#5B2BD9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  freeButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  freeButtonSub: {
    color: '#E4DCFF',
    fontSize: 11,
    marginTop: 3,
  },

  noCard: {
    color: '#8C879A',
    fontSize: 11,
    marginTop: 8,
  },


  /* SECTION */

  section: {
    width: '100%',
    maxWidth: 1350,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingTop: 28,
  },

  sectionTitle: {
    color: '#181145',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
  },

  sectionSub: {
    color: '#77738D',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
    maxWidth: 850,
  },


  /* 4 OPSPS FUNCTIONS */

  needsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
  },

  needsRowMobile: {
    flexWrap: 'wrap',
  },

  needItem: {
    flex: 1,
    minWidth: 210,
    minHeight: 175,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1EE',
    borderRadius: 18,
    padding: 20,
    justifyContent: 'center',
  },

  needIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#F2EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  needTitle: {
    color: '#181145',
    fontSize: 15,
    fontWeight: '900',
  },

  needSubtitle: {
    color: '#77738D',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },


  /* PRICING */

  pricingRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 18,
  },

  pricingMobile: {
    flexDirection: 'column',
  },

  plan: {
    flex: 1,
    minHeight: 305,
    borderRadius: 22,
    padding: 22,
  },

  founderPlan: {
    backgroundColor: '#5B2BD9',
  },

  standardPlan: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DFEC',
  },


  /* FOUNDER */

  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  founderBadge: {
    backgroundColor: '#EC4C99',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  users: {
    color: '#E6DEFF',
    fontSize: 10,
    fontWeight: '700',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 18,
  },

  founderPrice: {
    color: '#FFFFFF',
    fontSize: 49,
    fontWeight: '900',
  },

  founderMonth: {
    color: '#E6DEFF',
    fontSize: 15,
    marginLeft: 5,
    marginBottom: 9,
  },

  founderDescription: {
    color: '#EEE9FF',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 2,
  },


  /* CHECK LIST */

  checkList: {
    marginTop: 17,
    gap: 9,
  },

  checkLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkCircleMuted: {
    backgroundColor: '#EFEDF3',
  },

  checkText: {
    color: '#FFFFFF',
    fontSize: 11,
    flex: 1,
  },

  checkTextMuted: {
    color: '#666174',
  },


  /* FOUNDER BUTTON */

  founderButton: {
    height: 47,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    marginTop: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  founderButtonText: {
    color: '#5B2BD9',
    fontSize: 13,
    fontWeight: '900',
  },


  /* STANDARD */

  standardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  standardTitle: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '900',
  },

  standardLabel: {
    color: '#9994A5',
    fontSize: 10,
    marginTop: 4,
  },

  standardPrice: {
    color: '#181145',
    fontSize: 49,
    fontWeight: '900',
  },

  standardMonth: {
    color: '#77738D',
    fontSize: 15,
    marginLeft: 5,
    marginBottom: 9,
  },

  standardDescription: {
    color: '#6B6B8A',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 2,
  },


  /* FOOTER */

  footer: {
    marginTop: 35,
    marginHorizontal: 30,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: '#E3DFEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  footerLogo: {
    fontSize: 18,
    fontWeight: '900',
  },

  footerText: {
    color: '#9994A5',
    fontSize: 10,
  },
});