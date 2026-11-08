import {translations, type Language} from './i18n';
// Fixed interface text only. User data and backend enums retain their original values.
const extra: Record<string, Partial<Record<Language,string>>> = {
  "Dashboard": {
    "EN": "Dashboard",
    "MS": "Papan pemuka",
    "BM": "Papan pemuka",
    "ZH": "仪表盘",
    "TA": "முகப்புப் பலகை"
  },
  "Purchase": {
    "EN": "Purchase",
    "MS": "Pembelian",
    "BM": "Pembelian",
    "ZH": "采购",
    "TA": "கொள்முதல்"
  },
  "Inventory": {
    "EN": "Inventory",
    "MS": "Inventori",
    "BM": "Inventori",
    "ZH": "库存",
    "TA": "சரக்கு"
  },
  "Layout": {
    "EN": "Layout",
    "MS": "Susun atur",
    "BM": "Susun atur",
    "ZH": "布局",
    "TA": "அமைப்பு"
  },
  "Finance": {
    "EN": "Finance",
    "MS": "Kewangan",
    "BM": "Kewangan",
    "ZH": "财务",
    "TA": "நிதி"
  },
  "Reports": {
    "EN": "Reports",
    "MS": "Laporan",
    "BM": "Laporan",
    "ZH": "报表",
    "TA": "அறிக்கைகள்"
  },
  "Setup": {
    "EN": "Setup",
    "MS": "Tetapan",
    "BM": "Tetapan",
    "ZH": "设置",
    "TA": "அமைப்புகள்"
  },
  "Merchant operations": {
    "EN": "Merchant operations",
    "MS": "Operasi peruncit",
    "BM": "Operasi peruncit",
    "ZH": "零售业务",
    "TA": "சில்லறை வணிகச் செயல்பாடுகள்"
  },
  "Return to MYOPS": {
    "EN": "Return to MYOPS",
    "MS": "Kembali ke MYOPS",
    "BM": "Kembali ke MYOPS",
    "ZH": "返回 MYOPS",
    "TA": "MYOPS க்குத் திரும்பு"
  },
  "Returning…": {
    "EN": "Returning…",
    "MS": "Sedang kembali…",
    "BM": "Sedang kembali…",
    "ZH": "正在返回…",
    "TA": "திரும்புகிறது…"
  },
  "Search": {
    "EN": "Search",
    "MS": "Cari",
    "BM": "Cari",
    "ZH": "搜索",
    "TA": "தேடு"
  },
  "Close menu": {
    "EN": "Close menu",
    "MS": "Tutup menu",
    "BM": "Tutup menu",
    "ZH": "关闭菜单",
    "TA": "பட்டியை மூடு"
  },
  "Menu": {
    "EN": "Menu",
    "MS": "Menu",
    "BM": "Menu",
    "ZH": "菜单",
    "TA": "பட்டி"
  },
  "Toggle navigation": {
    "EN": "Toggle navigation",
    "MS": "Buka atau tutup navigasi",
    "BM": "Buka atau tutup navigasi",
    "ZH": "切换导航",
    "TA": "வழிசெலுத்தலை மாற்று"
  },
  "Scroll table horizontally": {
    "EN": "Scroll table horizontally",
    "MS": "Tatal jadual ke sisi",
    "BM": "Tatal jadual ke sisi",
    "ZH": "横向滚动表格",
    "TA": "அட்டவணையை கிடைமட்டமாக நகர்த்து"
  },
  "Action": {
    "EN": "Action",
    "MS": "Tindakan",
    "BM": "Tindakan",
    "ZH": "操作",
    "TA": "செயல்"
  },
  "Active": {
    "EN": "Active",
    "MS": "Aktif",
    "BM": "Aktif",
    "ZH": "启用",
    "TA": "செயலில்"
  },
  "Active stock": {
    "EN": "Active stock",
    "MS": "Stok aktif",
    "BM": "Stok aktif",
    "ZH": "有效库存",
    "TA": "செயலில் உள்ள சரக்கு"
  },
  "Add order item": {
    "EN": "Add order item",
    "MS": "Tambah item pesanan",
    "BM": "Tambah item pesanan",
    "ZH": "添加订单项目",
    "TA": "ஆர்டர் பொருளைச் சேர்"
  },
  "Add product": {
    "EN": "Add product",
    "MS": "Tambah produk",
    "BM": "Tambah produk",
    "ZH": "添加商品",
    "TA": "பொருளைச் சேர்"
  },
  "Add products, confirm quantities and save the supplier order": {
    "EN": "Add products, confirm quantities and save the supplier order",
    "MS": "Tambah produk, sahkan kuantiti dan simpan pesanan pembekal",
    "BM": "Tambah produk, sahkan kuantiti dan simpan pesanan pembekal",
    "ZH": "添加商品、确认数量并保存供应商订单",
    "TA": "பொருட்களைச் சேர்த்து அளவுகளை உறுதிசெய்து வழங்குநர் ஆர்டரைச் சேமி"
  },
  "All stock is healthy.": {
    "EN": "All stock is healthy.",
    "MS": "Semua stok mencukupi.",
    "BM": "Semua stok mencukupi.",
    "ZH": "所有库存充足。",
    "TA": "அனைத்துப் பொருட்களின் இருப்பும் போதுமானது."
  },
  "Amount": {
    "EN": "Amount",
    "MS": "Amaun",
    "BM": "Amaun",
    "ZH": "金额",
    "TA": "தொகை"
  },
  "Arrange merchandise by store zones": {
    "EN": "Arrange merchandise by store zones",
    "MS": "Susun barangan mengikut zon kedai",
    "BM": "Susun barangan mengikut zon kedai",
    "ZH": "按门店区域摆放商品",
    "TA": "கடைப் பகுதிகளின்படி பொருட்களை அமை"
  },
  "Audit trail from the connected backend": {
    "EN": "Audit trail from the connected backend",
    "MS": "Rekod audit transaksi",
    "BM": "Rekod audit transaksi",
    "ZH": "交易审计记录",
    "TA": "பரிவர்த்தனைத் தணிக்கைப் பதிவு"
  },
  "Bank accounts": {
    "EN": "Bank accounts",
    "MS": "Akaun bank",
    "BM": "Akaun bank",
    "ZH": "银行账户",
    "TA": "வங்கிக் கணக்குகள்"
  },
  "Business performance and trends": {
    "EN": "Business performance and trends",
    "MS": "Prestasi dan trend perniagaan",
    "BM": "Prestasi dan trend perniagaan",
    "ZH": "业务表现与趋势",
    "TA": "வணிகச் செயல்திறனும் போக்குகளும்"
  },
  "Cancel receipt": {
    "EN": "Cancel receipt",
    "MS": "Batal penerimaan",
    "BM": "Batal penerimaan",
    "ZH": "取消收货",
    "TA": "பெறுதலை ரத்துசெய்"
  },
  "Cart & checkout": {
    "EN": "Cart & checkout",
    "MS": "Troli dan bayaran",
    "BM": "Troli dan bayaran",
    "ZH": "购物车与结账",
    "TA": "கூடையும் கட்டணமும்"
  },
  "Cart subtotal": {
    "EN": "Cart subtotal",
    "MS": "Subtotal troli",
    "BM": "Subtotal troli",
    "ZH": "购物车小计",
    "TA": "கூடையின் உபதொகை"
  },
  "Cash Balance": {
    "EN": "Cash Balance",
    "MS": "Baki tunai",
    "BM": "Baki tunai",
    "ZH": "现金余额",
    "TA": "ரொக்க இருப்பு"
  },
  "Cash entries": {
    "EN": "Cash entries",
    "MS": "Rekod tunai",
    "BM": "Rekod tunai",
    "ZH": "现金记录",
    "TA": "ரொக்கப் பதிவுகள்"
  },
  "Cash flow": {
    "EN": "Cash flow",
    "MS": "Aliran tunai",
    "BM": "Aliran tunai",
    "ZH": "现金流",
    "TA": "பணப்புழக்கம்"
  },
  "Cash, expenses, and bank activity": {
    "EN": "Cash, expenses, and bank activity",
    "MS": "Aktiviti tunai, perbelanjaan dan bank",
    "BM": "Aktiviti tunai, perbelanjaan dan bank",
    "ZH": "现金、支出及银行活动",
    "TA": "ரொக்கம், செலவுகள் மற்றும் வங்கி நடவடிக்கைகள்"
  },
  "Catalog organization": {
    "EN": "Catalog organization",
    "MS": "Pengurusan katalog",
    "BM": "Pengurusan katalog",
    "ZH": "目录管理",
    "TA": "பொருள் பட்டியல் மேலாண்மை"
  },
  "Categories": {
    "EN": "Categories",
    "MS": "Kategori",
    "BM": "Kategori",
    "ZH": "类别",
    "TA": "வகைகள்"
  },
  "Category": {
    "EN": "Category",
    "MS": "Kategori",
    "BM": "Kategori",
    "ZH": "类别",
    "TA": "வகை"
  },
  "Category arrangement": {
    "EN": "Category arrangement",
    "MS": "Susunan kategori",
    "BM": "Susunan kategori",
    "ZH": "类别布局",
    "TA": "வகை அமைப்பு"
  },
  "Clear cart": {
    "EN": "Clear cart",
    "MS": "Kosongkan troli",
    "BM": "Kosongkan troli",
    "ZH": "清空购物车",
    "TA": "கூடையைக் காலிசெய்"
  },
  "Company": {
    "EN": "Company",
    "MS": "Syarikat",
    "BM": "Syarikat",
    "ZH": "公司",
    "TA": "நிறுவனம்"
  },
  "Configuration actions": {
    "EN": "Configuration actions",
    "MS": "Tindakan tetapan",
    "BM": "Tindakan tetapan",
    "ZH": "设置操作",
    "TA": "அமைப்புச் செயல்கள்"
  },
  "Create a catalog item for inventory and POS": {
    "EN": "Create a catalog item for inventory and POS",
    "MS": "Cipta produk untuk inventori dan POS",
    "BM": "Cipta produk untuk inventori dan POS",
    "ZH": "为库存与 POS 创建商品",
    "TA": "சரக்கு மற்றும் POS க்கான பொருளை உருவாக்கு"
  },
  "Create purchase order": {
    "EN": "Create purchase order",
    "MS": "Cipta pesanan belian",
    "BM": "Cipta pesanan belian",
    "ZH": "创建采购订单",
    "TA": "கொள்முதல் ஆர்டரை உருவாக்கு"
  },
  "Current quantities": {
    "EN": "Current quantities",
    "MS": "Kuantiti semasa",
    "BM": "Kuantiti semasa",
    "ZH": "当前数量",
    "TA": "தற்போதைய அளவுகள்"
  },
  "Customer workspace": {
    "EN": "Customer workspace",
    "MS": "Ruang pelanggan",
    "BM": "Ruang pelanggan",
    "ZH": "客户工作区",
    "TA": "வாடிக்கையாளர் பணியிடம்"
  },
  "Description": {
    "EN": "Description",
    "MS": "Keterangan",
    "BM": "Keterangan",
    "ZH": "说明",
    "TA": "விளக்கம்"
  },
  "Display zones": {
    "EN": "Display zones",
    "MS": "Zon paparan",
    "BM": "Zon paparan",
    "ZH": "展示区域",
    "TA": "காட்சிப் பகுதிகள்"
  },
  "Email": {
    "EN": "Email",
    "MS": "E-mel",
    "BM": "E-mel",
    "ZH": "电子邮件",
    "TA": "மின்னஞ்சல்"
  },
  "Enter quantities received now; zero leaves a line pending": {
    "EN": "Enter quantities received now; zero leaves a line pending",
    "MS": "Masukkan kuantiti diterima; sifar mengekalkan item sebagai tertunda",
    "BM": "Masukkan kuantiti diterima; sifar mengekalkan item sebagai tertunda",
    "ZH": "输入本次收货数量；零表示该项待收货",
    "TA": "இப்போது பெற்ற அளவை உள்ளிடு; பூஜ்ஜியம் என்றால் பொருள் நிலுவையில் இருக்கும்"
  },
  "Estimated total": {
    "EN": "Estimated total",
    "MS": "Anggaran jumlah",
    "BM": "Anggaran jumlah",
    "ZH": "预计总额",
    "TA": "மதிப்பிடப்பட்ட மொத்தம்"
  },
  "Expense ledger": {
    "EN": "Expense ledger",
    "MS": "Lejar perbelanjaan",
    "BM": "Lejar perbelanjaan",
    "ZH": "支出明细账",
    "TA": "செலவுப் பேரேடு"
  },
  "Expenses": {
    "EN": "Expenses",
    "MS": "Perbelanjaan",
    "BM": "Perbelanjaan",
    "ZH": "支出",
    "TA": "செலவுகள்"
  },
  "Fast checkout, real-time stock awareness": {
    "EN": "Fast checkout, real-time stock awareness",
    "MS": "Bayaran pantas dan stok masa nyata",
    "BM": "Bayaran pantas dan stok masa nyata",
    "ZH": "快速结账与实时库存",
    "TA": "விரைவான கட்டணமும் நிகழ்நேரச் சரக்கு நிலையும்"
  },
  "Filter and review replenishment flow": {
    "EN": "Filter and review replenishment flow",
    "MS": "Tapis dan semak penambahan stok",
    "BM": "Tapis dan semak penambahan stok",
    "ZH": "筛选并查看补货流程",
    "TA": "சரக்கு நிரப்புதலை வடிகட்டிப் பார்"
  },
  "Fully received": {
    "EN": "Fully received",
    "MS": "Diterima sepenuhnya",
    "BM": "Diterima sepenuhnya",
    "ZH": "全部收货",
    "TA": "முழுவதும் பெறப்பட்டது"
  },
  "Goods receipts": {
    "EN": "Goods receipts",
    "MS": "Penerimaan barangan",
    "BM": "Penerimaan barangan",
    "ZH": "收货记录",
    "TA": "பொருள் பெறுதல்கள்"
  },
  "Inventory summary": {
    "EN": "Inventory summary",
    "MS": "Ringkasan inventori",
    "BM": "Ringkasan inventori",
    "ZH": "库存概览",
    "TA": "சரக்குச் சுருக்கம்"
  },
  "Item": {
    "EN": "Item",
    "MS": "Item",
    "BM": "Item",
    "ZH": "项目",
    "TA": "பொருள்"
  },
  "Items:": {
    "EN": "Items:",
    "MS": "Item:",
    "BM": "Item:",
    "ZH": "项目：",
    "TA": "பொருட்கள்:"
  },
  "Keep the merchant experience aligned": {
    "EN": "Keep the merchant experience aligned",
    "MS": "Urus tetapan perniagaan anda",
    "BM": "Urus tetapan perniagaan anda",
    "ZH": "管理业务设置",
    "TA": "வணிக அமைப்புகளை நிர்வகி"
  },
  "Last 7 days": {
    "EN": "Last 7 days",
    "MS": "7 hari terakhir",
    "BM": "7 hari terakhir",
    "ZH": "最近7天",
    "TA": "கடந்த 7 நாட்கள்"
  },
  "Last seven days": {
    "EN": "Last seven days",
    "MS": "Tujuh hari terakhir",
    "BM": "Tujuh hari terakhir",
    "ZH": "最近七天",
    "TA": "கடந்த ஏழு நாட்கள்"
  },
  "Latest activity": {
    "EN": "Latest activity",
    "MS": "Aktiviti terkini",
    "BM": "Aktiviti terkini",
    "ZH": "最新活动",
    "TA": "அண்மைய நடவடிக்கை"
  },
  "Latest transactions": {
    "EN": "Latest transactions",
    "MS": "Transaksi terkini",
    "BM": "Transaksi terkini",
    "ZH": "最新交易",
    "TA": "அண்மைய பரிவர்த்தனைகள்"
  },
  "Low Stock": {
    "EN": "Low Stock",
    "MS": "Stok rendah",
    "BM": "Stok rendah",
    "ZH": "库存不足",
    "TA": "குறைந்த இருப்பு"
  },
  "Low stock alerts": {
    "EN": "Low stock alerts",
    "MS": "Amaran stok rendah",
    "BM": "Amaran stok rendah",
    "ZH": "低库存提醒",
    "TA": "குறைந்த இருப்பு எச்சரிக்கைகள்"
  },
  "Movements": {
    "EN": "Movements",
    "MS": "Pergerakan",
    "BM": "Pergerakan",
    "ZH": "变动",
    "TA": "நகர்வுகள்"
  },
  "Name": {
    "EN": "Name",
    "MS": "Nama",
    "BM": "Nama",
    "ZH": "名称",
    "TA": "பெயர்"
  },
  "Needs attention": {
    "EN": "Needs attention",
    "MS": "Perlu perhatian",
    "BM": "Perlu perhatian",
    "ZH": "需要关注",
    "TA": "கவனம் தேவை"
  },
  "No products match your search.": {
    "EN": "No products match your search.",
    "MS": "Tiada produk sepadan dengan carian.",
    "BM": "Tiada produk sepadan dengan carian.",
    "ZH": "没有符合搜索条件的商品。",
    "TA": "தேடலுக்கு ஏற்ற பொருட்கள் இல்லை."
  },
  "Open orders": {
    "EN": "Open orders",
    "MS": "Pesanan terbuka",
    "BM": "Pesanan terbuka",
    "ZH": "未完成订单",
    "TA": "நிலுவை ஆர்டர்கள்"
  },
  "Open setup": {
    "EN": "Open setup",
    "MS": "Buka tetapan",
    "BM": "Buka tetapan",
    "ZH": "打开设置",
    "TA": "அமைப்புகளைத் திற"
  },
  "Open suppliers": {
    "EN": "Open suppliers",
    "MS": "Buka pembekal",
    "BM": "Buka pembekal",
    "ZH": "打开供应商",
    "TA": "வழங்குநர்களைத் திற"
  },
  "OpsFlow Dashboard": {
    "EN": "OpsFlow Dashboard",
    "MS": "Papan pemuka OpsFlow",
    "BM": "Papan pemuka OpsFlow",
    "ZH": "OpsFlow 仪表盘",
    "TA": "OpsFlow முகப்புப் பலகை"
  },
  "OpsFlow Receipt": {
    "EN": "OpsFlow Receipt",
    "MS": "Resit OpsFlow",
    "BM": "Resit OpsFlow",
    "ZH": "OpsFlow 收据",
    "TA": "OpsFlow ரசீது"
  },
  "Order": {
    "EN": "Order",
    "MS": "Pesanan",
    "BM": "Pesanan",
    "ZH": "订单",
    "TA": "ஆர்டர்"
  },
  "Order control": {
    "EN": "Order control",
    "MS": "Pengurusan pesanan",
    "BM": "Pengurusan pesanan",
    "ZH": "订单管理",
    "TA": "ஆர்டர் மேலாண்மை"
  },
  "Order prepared for": {
    "EN": "Order prepared for",
    "MS": "Pesanan disediakan untuk",
    "BM": "Pesanan disediakan untuk",
    "ZH": "订单付款方式",
    "TA": "ஆர்டர் கட்டண முறை"
  },
  "Payment ready": {
    "EN": "Payment ready",
    "MS": "Sedia untuk bayaran",
    "BM": "Sedia untuk bayaran",
    "ZH": "可以付款",
    "TA": "கட்டணத்திற்குத் தயார்"
  },
  "Prioritize replenishment": {
    "EN": "Prioritize replenishment",
    "MS": "Utamakan penambahan stok",
    "BM": "Utamakan penambahan stok",
    "ZH": "优先补货",
    "TA": "சரக்கு நிரப்புதலுக்கு முன்னுரிமை கொடு"
  },
  "Product": {
    "EN": "Product",
    "MS": "Produk",
    "BM": "Produk",
    "ZH": "商品",
    "TA": "பொருள்"
  },
  "Product grid": {
    "EN": "Product grid",
    "MS": "Senarai produk",
    "BM": "Senarai produk",
    "ZH": "商品列表",
    "TA": "பொருள் பட்டியல்"
  },
  "Products": {
    "EN": "Products",
    "MS": "Produk",
    "BM": "Produk",
    "ZH": "商品",
    "TA": "பொருட்கள்"
  },
  "Products ready": {
    "EN": "Products ready",
    "MS": "Produk tersedia",
    "BM": "Produk tersedia",
    "ZH": "可售商品",
    "TA": "தயாரான பொருட்கள்"
  },
  "Purchase Orders": {
    "EN": "Purchase Orders",
    "MS": "Pesanan belian",
    "BM": "Pesanan belian",
    "ZH": "采购订单",
    "TA": "கொள்முதல் ஆர்டர்கள்"
  },
  "Purchases": {
    "EN": "Purchases",
    "MS": "Pembelian",
    "BM": "Pembelian",
    "ZH": "采购",
    "TA": "கொள்முதல்கள்"
  },
  "Qty": {
    "EN": "Qty",
    "MS": "Kuantiti",
    "BM": "Kuantiti",
    "ZH": "数量",
    "TA": "அளவு"
  },
  "Quantity": {
    "EN": "Quantity",
    "MS": "Kuantiti",
    "BM": "Kuantiti",
    "ZH": "数量",
    "TA": "அளவு"
  },
  "Quick actions": {
    "EN": "Quick actions",
    "MS": "Tindakan pantas",
    "BM": "Tindakan pantas",
    "ZH": "快捷操作",
    "TA": "விரைவுச் செயல்கள்"
  },
  "Ready": {
    "EN": "Ready",
    "MS": "Sedia",
    "BM": "Sedia",
    "ZH": "就绪",
    "TA": "தயார்"
  },
  "Receipt": {
    "EN": "Receipt",
    "MS": "Resit",
    "BM": "Resit",
    "ZH": "收据",
    "TA": "ரசீது"
  },
  "Receipt preview": {
    "EN": "Receipt preview",
    "MS": "Pratonton resit",
    "BM": "Pratonton resit",
    "ZH": "收据预览",
    "TA": "ரசீது முன்னோட்டம்"
  },
  "Recent company transactions": {
    "EN": "Recent company transactions",
    "MS": "Transaksi syarikat terkini",
    "BM": "Transaksi syarikat terkini",
    "ZH": "公司近期交易",
    "TA": "நிறுவனத்தின் அண்மைய பரிவர்த்தனைகள்"
  },
  "Recent sales": {
    "EN": "Recent sales",
    "MS": "Jualan terkini",
    "BM": "Jualan terkini",
    "ZH": "近期销售",
    "TA": "அண்மைய விற்பனைகள்"
  },
  "Recent transactions": {
    "EN": "Recent transactions",
    "MS": "Transaksi terkini",
    "BM": "Transaksi terkini",
    "ZH": "近期交易",
    "TA": "அண்மைய பரிவர்த்தனைகள்"
  },
  "Reference": {
    "EN": "Reference",
    "MS": "Rujukan",
    "BM": "Rujukan",
    "ZH": "参考编号",
    "TA": "குறிப்பு"
  },
  "Restock": {
    "EN": "Restock",
    "MS": "Tambah stok",
    "BM": "Tambah stok",
    "ZH": "补货",
    "TA": "இருப்பை நிரப்பு"
  },
  "Review layout": {
    "EN": "Review layout",
    "MS": "Semak susun atur",
    "BM": "Semak susun atur",
    "ZH": "查看布局",
    "TA": "அமைப்பைப் பார்"
  },
  "Sale": {
    "EN": "Sale",
    "MS": "Jualan",
    "BM": "Jualan",
    "ZH": "销售",
    "TA": "விற்பனை"
  },
  "Sales": {
    "EN": "Sales",
    "MS": "Jualan",
    "BM": "Jualan",
    "ZH": "销售",
    "TA": "விற்பனை"
  },
  "Sales and stock updates are saved to your company": {
    "EN": "Sales and stock updates are saved to your company",
    "MS": "Jualan dan stok disimpan dalam syarikat anda",
    "BM": "Jualan dan stok disimpan dalam syarikat anda",
    "ZH": "销售和库存更新保存到您的公司",
    "TA": "விற்பனையும் இருப்பு மாற்றங்களும் உங்கள் நிறுவனத்தில் சேமிக்கப்படும்"
  },
  "Sales chart": {
    "EN": "Sales chart",
    "MS": "Carta jualan",
    "BM": "Carta jualan",
    "ZH": "销售图表",
    "TA": "விற்பனை வரைபடம்"
  },
  "Sales trend": {
    "EN": "Sales trend",
    "MS": "Trend jualan",
    "BM": "Trend jualan",
    "ZH": "销售趋势",
    "TA": "விற்பனைப் போக்கு"
  },
  "Saved stock receipt audit trail": {
    "EN": "Saved stock receipt audit trail",
    "MS": "Rekod audit penerimaan stok",
    "BM": "Rekod audit penerimaan stok",
    "ZH": "收货审计记录",
    "TA": "சரக்கு பெறுதல் தணிக்கைப் பதிவு"
  },
  "Select a product": {
    "EN": "Select a product",
    "MS": "Pilih produk",
    "BM": "Pilih produk",
    "ZH": "选择商品",
    "TA": "பொருளைத் தேர்ந்தெடு"
  },
  "Spend": {
    "EN": "Spend",
    "MS": "Perbelanjaan",
    "BM": "Perbelanjaan",
    "ZH": "支出",
    "TA": "செலவு"
  },
  "Start fast": {
    "EN": "Start fast",
    "MS": "Mula segera",
    "BM": "Mula segera",
    "ZH": "快速开始",
    "TA": "விரைவாகத் தொடங்கு"
  },
  "Status": {
    "EN": "Status",
    "MS": "Status",
    "BM": "Status",
    "ZH": "状态",
    "TA": "நிலை"
  },
  "Stock": {
    "EN": "Stock",
    "MS": "Stok",
    "BM": "Stok",
    "ZH": "库存",
    "TA": "இருப்பு"
  },
  "Stock health, movements, and alerts": {
    "EN": "Stock health, movements, and alerts",
    "MS": "Keadaan stok, pergerakan dan amaran",
    "BM": "Keadaan stok, pergerakan dan amaran",
    "ZH": "库存状况、变动与提醒",
    "TA": "இருப்பு நிலை, நகர்வுகள் மற்றும் எச்சரிக்கைகள்"
  },
  "Stock movements": {
    "EN": "Stock movements",
    "MS": "Pergerakan stok",
    "BM": "Pergerakan stok",
    "ZH": "库存变动",
    "TA": "சரக்கு நகர்வுகள்"
  },
  "Stock overview": {
    "EN": "Stock overview",
    "MS": "Gambaran stok",
    "BM": "Gambaran stok",
    "ZH": "库存概况",
    "TA": "சரக்கு மேலோட்டம்"
  },
  "Stock value": {
    "EN": "Stock value",
    "MS": "Nilai stok",
    "BM": "Nilai stok",
    "ZH": "库存价值",
    "TA": "சரக்கு மதிப்பு"
  },
  "Stock:": {
    "EN": "Stock:",
    "MS": "Stok:",
    "BM": "Stok:",
    "ZH": "库存：",
    "TA": "இருப்பு:"
  },
  "Store arrangement and product placement": {
    "EN": "Store arrangement and product placement",
    "MS": "Susun atur kedai dan produk",
    "BM": "Susun atur kedai dan produk",
    "ZH": "门店布局与商品摆放",
    "TA": "கடை அமைப்பும் பொருள் இடமமைப்பும்"
  },
  "Store configuration and merchant operations": {
    "EN": "Store configuration and merchant operations",
    "MS": "Tetapan kedai dan operasi peruncit",
    "BM": "Tetapan kedai dan operasi peruncit",
    "ZH": "门店设置与零售业务",
    "TA": "கடை அமைப்புகளும் சில்லறைச் செயல்பாடுகளும்"
  },
  "Subtotal": {
    "EN": "Subtotal",
    "MS": "Subtotal",
    "BM": "Subtotal",
    "ZH": "小计",
    "TA": "உபதொகை"
  },
  "Supplier": {
    "EN": "Supplier",
    "MS": "Pembekal",
    "BM": "Pembekal",
    "ZH": "供应商",
    "TA": "வழங்குநர்"
  },
  "Supplier count": {
    "EN": "Supplier count",
    "MS": "Bilangan pembekal",
    "BM": "Bilangan pembekal",
    "ZH": "供应商数量",
    "TA": "வழங்குநர் எண்ணிக்கை"
  },
  "Supplier name": {
    "EN": "Supplier name",
    "MS": "Nama pembekal",
    "BM": "Nama pembekal",
    "ZH": "供应商名称",
    "TA": "வழங்குநர் பெயர்"
  },
  "Suppliers": {
    "EN": "Suppliers",
    "MS": "Pembekal",
    "BM": "Pembekal",
    "ZH": "供应商",
    "TA": "வழங்குநர்கள்"
  },
  "Tap an item to add it to the cart": {
    "EN": "Tap an item to add it to the cart",
    "MS": "Tekan produk untuk ditambah ke troli",
    "BM": "Tekan produk untuk ditambah ke troli",
    "ZH": "点击商品加入购物车",
    "TA": "கூடையில் சேர்க்க பொருளைத் தொடு"
  },
  "Tax": {
    "EN": "Tax",
    "MS": "Cukai",
    "BM": "Cukai",
    "ZH": "税费",
    "TA": "வரி"
  },
  "Team": {
    "EN": "Team",
    "MS": "Pasukan",
    "BM": "Pasukan",
    "ZH": "团队",
    "TA": "குழு"
  },
  "Manage company, suppliers and products.": {
    "EN": "Manage company, suppliers and products.",
    "MS": "Urus syarikat, pembekal dan produk.",
    "BM": "Urus syarikat, pembekal dan produk.",
    "ZH": "管理公司、供应商与商品。",
    "TA": "நிறுவனம், வழங்குநர்கள் மற்றும் பொருட்களை நிர்வகி."
  },
  "Today Sales": {
    "EN": "Today Sales",
    "MS": "Jualan hari ini",
    "BM": "Jualan hari ini",
    "ZH": "今日销售",
    "TA": "இன்றைய விற்பனை"
  },
  "Total": {
    "EN": "Total",
    "MS": "Jumlah",
    "BM": "Jumlah",
    "ZH": "总额",
    "TA": "மொத்தம்"
  },
  "Total due:": {
    "EN": "Total due:",
    "MS": "Jumlah perlu dibayar:",
    "BM": "Jumlah perlu dibayar:",
    "ZH": "应付总额：",
    "TA": "செலுத்த வேண்டிய மொத்தம்:"
  },
  "Tracked products": {
    "EN": "Tracked products",
    "MS": "Produk dipantau",
    "BM": "Produk dipantau",
    "ZH": "跟踪商品",
    "TA": "கண்காணிக்கப்படும் பொருட்கள்"
  },
  "Type": {
    "EN": "Type",
    "MS": "Jenis",
    "BM": "Jenis",
    "ZH": "类型",
    "TA": "வகை"
  },
  "Unit cost (RM)": {
    "EN": "Unit cost (RM)",
    "MS": "Kos seunit (RM)",
    "BM": "Kos seunit (RM)",
    "ZH": "单位成本（RM）",
    "TA": "அலகுச் செலவு (RM)"
  },
  "Value": {
    "EN": "Value",
    "MS": "Nilai",
    "BM": "Nilai",
    "ZH": "价值",
    "TA": "மதிப்பு"
  },
  "Vendor contacts": {
    "EN": "Vendor contacts",
    "MS": "Maklumat pembekal",
    "BM": "Maklumat pembekal",
    "ZH": "供应商联系方式",
    "TA": "வழங்குநர் தொடர்புகள்"
  },
  "Vendor orders and incoming stock": {
    "EN": "Vendor orders and incoming stock",
    "MS": "Pesanan pembekal dan stok masuk",
    "BM": "Pesanan pembekal dan stok masuk",
    "ZH": "供应商订单与入库",
    "TA": "வழங்குநர் ஆர்டர்களும் வரவிருக்கும் சரக்கும்"
  },
  "Warehouse value": {
    "EN": "Warehouse value",
    "MS": "Nilai gudang",
    "BM": "Nilai gudang",
    "ZH": "仓库价值",
    "TA": "கிடங்கு மதிப்பு"
  },
  "Before tax": {
    "EN": "Before tax",
    "MS": "Sebelum cukai",
    "BM": "Sebelum cukai",
    "ZH": "税前",
    "TA": "வரிக்கு முன்"
  },
  "Available for sale": {
    "EN": "Available for sale",
    "MS": "Tersedia untuk jualan",
    "BM": "Tersedia untuk jualan",
    "ZH": "可供销售",
    "TA": "விற்பனைக்குக் கிடைக்கிறது"
  },
  "Included in checkout": {
    "EN": "Included in checkout",
    "MS": "Termasuk dalam bayaran",
    "BM": "Termasuk dalam bayaran",
    "ZH": "结账时包含",
    "TA": "கட்டணத்தில் அடங்கும்"
  },
  "Ready for payment": {
    "EN": "Ready for payment",
    "MS": "Sedia untuk bayaran",
    "BM": "Sedia untuk bayaran",
    "ZH": "可以付款",
    "TA": "கட்டணத்திற்குத் தயார்"
  },
  "Checkout": {
    "EN": "Checkout",
    "MS": "Bayar",
    "BM": "Bayar",
    "ZH": "结账",
    "TA": "கட்டணம் செலுத்து"
  },
  "Processing…": {
    "EN": "Processing…",
    "MS": "Sedang diproses…",
    "BM": "Sedang diproses…",
    "ZH": "正在处理…",
    "TA": "செயலாக்குகிறது…"
  },
  "Cash": {
    "EN": "Cash",
    "MS": "Tunai",
    "BM": "Tunai",
    "ZH": "现金",
    "TA": "ரொக்கம்"
  },
  "Bank Transfer": {
    "EN": "Bank Transfer",
    "MS": "Pindahan bank",
    "BM": "Pindahan bank",
    "ZH": "银行转账",
    "TA": "வங்கிப் பரிமாற்றம்"
  },
  "Ready to print": {
    "EN": "Ready to print",
    "MS": "Sedia dicetak",
    "BM": "Sedia dicetak",
    "ZH": "可以打印",
    "TA": "அச்சிடத் தயார்"
  },
  "Awaiting order": {
    "EN": "Awaiting order",
    "MS": "Menunggu pesanan",
    "BM": "Menunggu pesanan",
    "ZH": "等待订单",
    "TA": "ஆர்டருக்காகக் காத்திருக்கிறது"
  },
  "Healthy": {
    "EN": "Healthy",
    "MS": "Mencukupi",
    "BM": "Mencukupi",
    "ZH": "充足",
    "TA": "போதுமானது"
  },
  "Low": {
    "EN": "Low",
    "MS": "Rendah",
    "BM": "Rendah",
    "ZH": "不足",
    "TA": "குறைவு"
  },
  "Add at least one product before checkout.": {
    "EN": "Add at least one product before checkout.",
    "MS": "Tambah sekurang-kurangnya satu produk sebelum bayaran.",
    "BM": "Tambah sekurang-kurangnya satu produk sebelum bayaran.",
    "ZH": "结账前请至少添加一件商品。",
    "TA": "கட்டணத்திற்கு முன் குறைந்தது ஒரு பொருளைச் சேர்."
  },
  "Checkout failed. Please try again.": {
    "EN": "Checkout failed. Please try again.",
    "MS": "Bayaran gagal. Sila cuba lagi.",
    "BM": "Bayaran gagal. Sila cuba lagi.",
    "ZH": "结账失败，请重试。",
    "TA": "கட்டணம் தோல்வியடைந்தது. மீண்டும் முயற்சி செய்."
  },
  "Active collaborators": {
    "EN": "Active collaborators",
    "MS": "Ahli pasukan aktif",
    "BM": "Ahli pasukan aktif",
    "ZH": "活跃团队成员",
    "TA": "செயலில் உள்ள குழு உறுப்பினர்கள்"
  },
  "Active vendors": {
    "EN": "Active vendors",
    "MS": "Pembekal aktif",
    "BM": "Pembekal aktif",
    "ZH": "活跃供应商",
    "TA": "செயலில் உள்ள வழங்குநர்கள்"
  },
  "Active workspace": {
    "EN": "Active workspace",
    "MS": "Ruang perniagaan aktif",
    "BM": "Ruang perniagaan aktif",
    "ZH": "有效业务空间",
    "TA": "செயலில் உள்ள வணிக இடம்"
  },
  "Assigned to layout": {
    "EN": "Assigned to layout",
    "MS": "Ditetapkan dalam susun atur",
    "BM": "Ditetapkan dalam susun atur",
    "ZH": "已分配至布局",
    "TA": "அமைப்பில் ஒதுக்கப்பட்டது"
  },
  "At cost": {
    "EN": "At cost",
    "MS": "Pada harga kos",
    "BM": "Pada harga kos",
    "ZH": "按成本",
    "TA": "அடக்க விலையில்"
  },
  "Awaiting fulfilment": {
    "EN": "Awaiting fulfilment",
    "MS": "Menunggu penyelesaian",
    "BM": "Menunggu penyelesaian",
    "ZH": "等待履行",
    "TA": "நிறைவேற்றக் காத்திருக்கிறது"
  },
  "Cash ledger balance": {
    "EN": "Cash ledger balance",
    "MS": "Baki lejar tunai",
    "BM": "Baki lejar tunai",
    "ZH": "现金账余额",
    "TA": "ரொக்கப் பேரேட்டு இருப்பு"
  },
  "Catalog coverage": {
    "EN": "Catalog coverage",
    "MS": "Liputan katalog",
    "BM": "Liputan katalog",
    "ZH": "目录覆盖",
    "TA": "பொருள் பட்டியல் அளவு"
  },
  "Completed deliveries": {
    "EN": "Completed deliveries",
    "MS": "Penghantaran selesai",
    "BM": "Penghantaran selesai",
    "ZH": "已完成交付",
    "TA": "முடிந்த வழங்கல்கள்"
  },
  "Configured sections": {
    "EN": "Configured sections",
    "MS": "Bahagian ditetapkan",
    "BM": "Bahagian ditetapkan",
    "ZH": "已设置区域",
    "TA": "அமைக்கப்பட்ட பிரிவுகள்"
  },
  "Connected accounts": {
    "EN": "Connected accounts",
    "MS": "Akaun disambungkan",
    "BM": "Akaun disambungkan",
    "ZH": "已连接账户",
    "TA": "இணைக்கப்பட்ட கணக்குகள்"
  },
  "Current month": {
    "EN": "Current month",
    "MS": "Bulan semasa",
    "BM": "Bulan semasa",
    "ZH": "本月",
    "TA": "நடப்பு மாதம்"
  },
  "High-value areas": {
    "EN": "High-value areas",
    "MS": "Kawasan bernilai tinggi",
    "BM": "Kawasan bernilai tinggi",
    "ZH": "高价值区域",
    "TA": "அதிக மதிப்புள்ள பகுதிகள்"
  },
  "In the current catalog": {
    "EN": "In the current catalog",
    "MS": "Dalam katalog semasa",
    "BM": "Dalam katalog semasa",
    "ZH": "当前目录中",
    "TA": "தற்போதைய பட்டியலில்"
  },
  "Items need restock": {
    "EN": "Items need restock",
    "MS": "Item perlu ditambah stok",
    "BM": "Item perlu ditambah stok",
    "ZH": "需要补货的商品",
    "TA": "நிரப்ப வேண்டிய பொருட்கள்"
  },
  "Latest adjustments": {
    "EN": "Latest adjustments",
    "MS": "Pelarasan terkini",
    "BM": "Pelarasan terkini",
    "ZH": "最新调整",
    "TA": "அண்மைய திருத்தங்கள்"
  },
  "Ledger activity": {
    "EN": "Ledger activity",
    "MS": "Aktiviti lejar",
    "BM": "Aktiviti lejar",
    "ZH": "账目活动",
    "TA": "பேரேட்டு நடவடிக்கை"
  },
  "Live from POS": {
    "EN": "Live from POS",
    "MS": "Data daripada POS",
    "BM": "Data daripada POS",
    "ZH": "来自 POS 的数据",
    "TA": "POS இலிருந்து தரவு"
  },
  "Need replenishment": {
    "EN": "Need replenishment",
    "MS": "Perlu tambah stok",
    "BM": "Perlu tambah stok",
    "ZH": "需要补货",
    "TA": "இருப்பை நிரப்ப வேண்டும்"
  },
  "Net movement": {
    "EN": "Net movement",
    "MS": "Pergerakan bersih",
    "BM": "Pergerakan bersih",
    "ZH": "净变动",
    "TA": "நிகர நகர்வு"
  },
  "Order quantity": {
    "EN": "Order quantity",
    "MS": "Kuantiti pesanan",
    "BM": "Kuantiti pesanan",
    "ZH": "订单数量",
    "TA": "ஆர்டர் அளவு"
  },
  "Order unit cost": {
    "EN": "Order unit cost",
    "MS": "Kos seunit pesanan",
    "BM": "Kos seunit pesanan",
    "ZH": "订单单位成本",
    "TA": "ஆர்டரின் அலகுச் செலவு"
  },
  "POS": {
    "EN": "POS",
    "MS": "POS",
    "BM": "POS",
    "ZH": "POS",
    "TA": "POS"
  },
  "Product groups": {
    "EN": "Product groups",
    "MS": "Kumpulan produk",
    "BM": "Kumpulan produk",
    "ZH": "商品组",
    "TA": "பொருள் குழுக்கள்"
  },
  "Purchase order value": {
    "EN": "Purchase order value",
    "MS": "Nilai pesanan belian",
    "BM": "Nilai pesanan belian",
    "ZH": "采购订单金额",
    "TA": "கொள்முதல் ஆர்டர் மதிப்பு"
  },
  "Purchase product": {
    "EN": "Purchase product",
    "MS": "Produk belian",
    "BM": "Produk belian",
    "ZH": "采购商品",
    "TA": "கொள்முதல் பொருள்"
  },
  "Purchase value": {
    "EN": "Purchase value",
    "MS": "Nilai belian",
    "BM": "Nilai belian",
    "ZH": "采购金额",
    "TA": "கொள்முதல் மதிப்பு"
  },
  "Revenue tracked": {
    "EN": "Revenue tracked",
    "MS": "Hasil direkod",
    "BM": "Hasil direkod",
    "ZH": "已记录收入",
    "TA": "பதிவான வருவாய்"
  },
  "Spend tracked": {
    "EN": "Spend tracked",
    "MS": "Belanja direkod",
    "BM": "Belanja direkod",
    "ZH": "已记录支出",
    "TA": "பதிவான செலவு"
  },
  "Vendor network": {
    "EN": "Vendor network",
    "MS": "Rangkaian pembekal",
    "BM": "Rangkaian pembekal",
    "ZH": "供应商网络",
    "TA": "வழங்குநர் வலையமைப்பு"
  },
  "· outstanding": {
    "EN": "· outstanding",
    "MS": "· belum diterima",
    "BM": "· belum diterima",
    "ZH": "· 未收货",
    "TA": "· பெறப்படாதவை"
  },
  "• Min": {
    "EN": "• Min",
    "MS": "• Minimum",
    "BM": "• Minimum",
    "ZH": "• 最低",
    "TA": "• குறைந்தபட்சம்"
  },
  "• Min:": {
    "EN": "• Min:",
    "MS": "• Minimum:",
    "BM": "• Minimum:",
    "ZH": "• 最低：",
    "TA": "• குறைந்தபட்சம்:"
  },
  "Trips": {
    "EN": "Trips",
    "MS": "Trip",
    "BM": "Trip",
    "ZH": "采购行程",
    "TA": "பயணங்கள்"
  },
  "Trip": {
    "EN": "Trip",
    "MS": "Trip",
    "BM": "Trip",
    "ZH": "采购行程",
    "TA": "பயணம்"
  },
  "Marketplace": {
    "EN": "Marketplace",
    "MS": "Katalog produk",
    "BM": "Katalog produk",
    "ZH": "商品目录",
    "TA": "பொருள் பட்டியல்"
  },
  "Market": {
    "EN": "Market",
    "MS": "Produk",
    "BM": "Produk",
    "ZH": "商品",
    "TA": "பொருட்கள்"
  },
  "Marketplace Hub": {
    "EN": "Marketplace Hub",
    "MS": "Pusat produk",
    "BM": "Pusat produk",
    "ZH": "商品中心",
    "TA": "பொருள் மையம்"
  },
  "Marketplace Catalog": {
    "EN": "Marketplace Catalog",
    "MS": "Katalog produk",
    "BM": "Katalog produk",
    "ZH": "商品目录",
    "TA": "பொருள் பட்டியல்"
  },
  "Create Trip": {
    "EN": "Create Trip",
    "MS": "Cipta trip",
    "BM": "Cipta trip",
    "ZH": "创建采购行程",
    "TA": "பயணத்தை உருவாக்கு"
  },
  "Back to Trips": {
    "EN": "Back to Trips",
    "MS": "Kembali ke trip",
    "BM": "Kembali ke trip",
    "ZH": "返回行程",
    "TA": "பயணங்களுக்குத் திரும்பு"
  },
  "Add a new journey to your personal shopper schedule.": {
    "EN": "Add a new journey to your personal shopper schedule.",
    "MS": "Tambah trip baharu dalam jadual personal shopper anda.",
    "BM": "Tambah trip baharu dalam jadual personal shopper anda.",
    "ZH": "在代购日程中添加新行程。",
    "TA": "உங்கள் தனிப்பட்ட ஷாப்பர் அட்டவணையில் புதிய பயணத்தைச் சேர்."
  },
  "Trip Name": {
    "EN": "Trip Name",
    "MS": "Nama trip",
    "BM": "Nama trip",
    "ZH": "行程名称",
    "TA": "பயணத்தின் பெயர்"
  },
  "Trip Date": {
    "EN": "Trip Date",
    "MS": "Tarikh trip",
    "BM": "Tarikh trip",
    "ZH": "行程日期",
    "TA": "பயணத் தேதி"
  },
  "Shopping Destination / Mall / Event": {
    "EN": "Shopping Destination / Mall / Event",
    "MS": "Destinasi beli-belah / pusat beli-belah / acara",
    "BM": "Destinasi beli-belah / pusat beli-belah / acara",
    "ZH": "购物目的地／商场／活动",
    "TA": "கொள்முதல் இடம் / வணிக வளாகம் / நிகழ்வு"
  },
  "Plan and manage your personal shopper journeys.": {
    "EN": "Plan and manage your personal shopper journeys.",
    "MS": "Rancang dan urus trip personal shopper anda.",
    "BM": "Rancang dan urus trip personal shopper anda.",
    "ZH": "规划并管理代购行程。",
    "TA": "உங்கள் தனிப்பட்ட ஷாப்பர் பயணங்களைத் திட்டமிட்டு நிர்வகி."
  },
  "No trips available for this business.": {
    "EN": "No trips available for this business.",
    "MS": "Tiada trip untuk perniagaan ini.",
    "BM": "Tiada trip untuk perniagaan ini.",
    "ZH": "此商家暂无行程。",
    "TA": "இந்த வணிகத்திற்குப் பயணங்கள் இல்லை."
  },
  "Open Trips": {
    "EN": "Open Trips",
    "MS": "Buka trip",
    "BM": "Buka trip",
    "ZH": "打开行程",
    "TA": "பயணங்களைத் திற"
  },
  "Product operations": {
    "EN": "Product operations",
    "MS": "Pengurusan produk",
    "BM": "Pengurusan produk",
    "ZH": "商品管理",
    "TA": "பொருள் மேலாண்மை"
  },
  "Stock control": {
    "EN": "Stock control",
    "MS": "Kawalan stok",
    "BM": "Kawalan stok",
    "ZH": "库存管理",
    "TA": "சரக்குக் கட்டுப்பாடு"
  },
  "Upload, price and share products from one place.": {
    "EN": "Upload, price and share products from one place.",
    "MS": "Muat naik, tetapkan harga dan kongsi produk.",
    "BM": "Muat naik, tetapkan harga dan kongsi produk.",
    "ZH": "上传商品、定价并分享。",
    "TA": "பொருட்களைப் பதிவேற்றி விலை நிர்ணயித்துப் பகிர்."
  },
  "Review product availability and adjust stock levels in seconds.": {
    "EN": "Review product availability and adjust stock levels in seconds.",
    "MS": "Semak ketersediaan produk dan laraskan stok.",
    "BM": "Semak ketersediaan produk dan laraskan stok.",
    "ZH": "查看商品供应情况并调整库存。",
    "TA": "பொருள் கிடைப்பைச் சரிபார்த்து இருப்பைச் சரிசெய்."
  },
  "Upload Product": {
    "EN": "Upload Product",
    "MS": "Muat naik produk",
    "BM": "Muat naik produk",
    "ZH": "上传商品",
    "TA": "பொருளைப் பதிவேற்று"
  },
  "Upload Photo": {
    "EN": "Upload Photo",
    "MS": "Muat naik gambar",
    "BM": "Muat naik gambar",
    "ZH": "上传照片",
    "TA": "படத்தைப் பதிவேற்று"
  },
  "Product Photo": {
    "EN": "Product Photo",
    "MS": "Gambar produk",
    "BM": "Gambar produk",
    "ZH": "商品照片",
    "TA": "பொருளின் படம்"
  },
  "Product Name": {
    "EN": "Product Name",
    "MS": "Nama produk",
    "BM": "Nama produk",
    "ZH": "商品名称",
    "TA": "பொருளின் பெயர்"
  },
  "Price (RM)": {
    "EN": "Price (RM)",
    "MS": "Harga (RM)",
    "BM": "Harga (RM)",
    "ZH": "价格（RM）",
    "TA": "விலை (RM)"
  },
  "Product Link": {
    "EN": "Product Link",
    "MS": "Pautan produk",
    "BM": "Pautan produk",
    "ZH": "商品链接",
    "TA": "பொருள் இணைப்பு"
  },
  "Generate Product Link": {
    "EN": "Generate Product Link",
    "MS": "Jana pautan produk",
    "BM": "Jana pautan produk",
    "ZH": "生成商品链接",
    "TA": "பொருள் இணைப்பை உருவாக்கு"
  },
  "Product link generated": {
    "EN": "Product link generated",
    "MS": "Pautan produk dijana",
    "BM": "Pautan produk dijana",
    "ZH": "商品链接已生成",
    "TA": "பொருள் இணைப்பு உருவாக்கப்பட்டது"
  },
  "Share / Post Product": {
    "EN": "Share / Post Product",
    "MS": "Kongsi / siar produk",
    "BM": "Kongsi / siar produk",
    "ZH": "分享／发布商品",
    "TA": "பொருளைப் பகிர் / வெளியிடு"
  },
  "Open Customer Page": {
    "EN": "Open Customer Page",
    "MS": "Buka halaman pelanggan",
    "BM": "Buka halaman pelanggan",
    "ZH": "打开客户页面",
    "TA": "வாடிக்கையாளர் பக்கத்தைத் திற"
  },
  "Direct Link": {
    "EN": "Direct Link",
    "MS": "Pautan terus",
    "BM": "Pautan terus",
    "ZH": "直接链接",
    "TA": "நேரடி இணைப்பு"
  },
  "Marketing": {
    "EN": "Marketing",
    "MS": "Pemasaran",
    "BM": "Pemasaran",
    "ZH": "营销",
    "TA": "சந்தைப்படுத்தல்"
  },
  "Orders": {
    "EN": "Orders",
    "MS": "Pesanan",
    "BM": "Pesanan",
    "ZH": "订单",
    "TA": "ஆர்டர்கள்"
  },
  "OPSPS ORDER HUB": {
    "EN": "OPSPS ORDER HUB",
    "MS": "PUSAT PESANAN OPSPS",
    "BM": "PUSAT PESANAN OPSPS",
    "ZH": "OPSPS 订单中心",
    "TA": "OPSPS ஆர்டர் மையம்"
  },
  "Review customer requests and fulfilment status.": {
    "EN": "Review customer requests and fulfilment status.",
    "MS": "Semak permintaan pelanggan dan status penyelesaian.",
    "BM": "Semak permintaan pelanggan dan status penyelesaian.",
    "ZH": "查看客户请求与履行状态。",
    "TA": "வாடிக்கையாளர் கோரிக்கைகளையும் நிறைவேற்றும் நிலையையும் பார்."
  },
  "No orders found for this account.": {
    "EN": "No orders found for this account.",
    "MS": "Tiada pesanan untuk akaun ini.",
    "BM": "Tiada pesanan untuk akaun ini.",
    "ZH": "此账户暂无订单。",
    "TA": "இந்தக் கணக்கில் ஆர்டர்கள் இல்லை."
  },
  "Pending Orders": {
    "EN": "Pending Orders",
    "MS": "Pesanan tertunda",
    "BM": "Pesanan tertunda",
    "ZH": "待处理订单",
    "TA": "நிலுவை ஆர்டர்கள்"
  },
  "Pending Orders — To Deliver": {
    "EN": "Pending Orders — To Deliver",
    "MS": "Pesanan tertunda — untuk dihantar",
    "BM": "Pesanan tertunda — untuk dihantar",
    "ZH": "待处理订单—待送达",
    "TA": "நிலுவை ஆர்டர்கள் — வழங்க வேண்டியவை"
  },
  "Total Products": {
    "EN": "Total Products",
    "MS": "Jumlah produk",
    "BM": "Jumlah produk",
    "ZH": "商品总数",
    "TA": "மொத்தப் பொருட்கள்"
  },
  "Date From": {
    "EN": "Date From",
    "MS": "Tarikh mula",
    "BM": "Tarikh mula",
    "ZH": "开始日期",
    "TA": "தொடக்க தேதி"
  },
  "Date To": {
    "EN": "Date To",
    "MS": "Tarikh akhir",
    "BM": "Tarikh akhir",
    "ZH": "结束日期",
    "TA": "முடிவுத் தேதி"
  },
  "Generated from the current OpsPS database.": {
    "EN": "Generated from the current OpsPS database.",
    "MS": "Dijana daripada data OpsPS semasa.",
    "BM": "Dijana daripada data OpsPS semasa.",
    "ZH": "根据当前 OpsPS 数据生成。",
    "TA": "தற்போதைய OpsPS தரவிலிருந்து உருவாக்கப்பட்டது."
  },
  "Generate Report": {
    "EN": "Generate Report",
    "MS": "Jana laporan",
    "BM": "Jana laporan",
    "ZH": "生成报表",
    "TA": "அறிக்கையை உருவாக்கு"
  },
  "Download Excel": {
    "EN": "Download Excel",
    "MS": "Muat turun Excel",
    "BM": "Muat turun Excel",
    "ZH": "下载 Excel",
    "TA": "Excel பதிவிறக்கு"
  },
  "Download PDF": {
    "EN": "Download PDF",
    "MS": "Muat turun PDF",
    "BM": "Muat turun PDF",
    "ZH": "下载 PDF",
    "TA": "PDF பதிவிறக்கு"
  },
  "No records in this date range.": {
    "EN": "No records in this date range.",
    "MS": "Tiada rekod dalam julat tarikh ini.",
    "BM": "Tiada rekod dalam julat tarikh ini.",
    "ZH": "此日期范围内暂无记录。",
    "TA": "இந்தத் தேதி வரம்பில் பதிவுகள் இல்லை."
  },
  "Loading report data…": {
    "EN": "Loading report data…",
    "MS": "Memuatkan data laporan…",
    "BM": "Memuatkan data laporan…",
    "ZH": "正在加载报表数据…",
    "TA": "அறிக்கைத் தரவு ஏற்றப்படுகிறது…"
  },
  "Loading trip profitability…": {
    "EN": "Loading trip profitability…",
    "MS": "Memuatkan keuntungan trip…",
    "BM": "Memuatkan keuntungan trip…",
    "ZH": "正在加载行程盈利数据…",
    "TA": "பயண இலாபத் தரவு ஏற்றப்படுகிறது…"
  },
  "Profit by Trip": {
    "EN": "Profit by Trip",
    "MS": "Keuntungan mengikut trip",
    "BM": "Keuntungan mengikut trip",
    "ZH": "按行程统计利润",
    "TA": "பயணவாரி இலாபம்"
  },
  "Report Type": {
    "EN": "Report Type",
    "MS": "Jenis laporan",
    "BM": "Jenis laporan",
    "ZH": "报表类型",
    "TA": "அறிக்கை வகை"
  },
  "Report Data (": {
    "EN": "Report Data (",
    "MS": "Data laporan (",
    "BM": "Data laporan (",
    "ZH": "报表数据（",
    "TA": "அறிக்கைத் தரவு ("
  },
  "Bank Balance": {
    "EN": "Bank Balance",
    "MS": "Baki bank",
    "BM": "Baki bank",
    "ZH": "银行余额",
    "TA": "வங்கி இருப்பு"
  },
  "Money In": {
    "EN": "Money In",
    "MS": "Wang masuk",
    "BM": "Wang masuk",
    "ZH": "收入",
    "TA": "பண வரவு"
  },
  "Money Out": {
    "EN": "Money Out",
    "MS": "Wang keluar",
    "BM": "Wang keluar",
    "ZH": "支出",
    "TA": "பணச் செலவு"
  },
  "Monthly Expenses": {
    "EN": "Monthly Expenses",
    "MS": "Perbelanjaan bulanan",
    "BM": "Perbelanjaan bulanan",
    "ZH": "每月支出",
    "TA": "மாதாந்திரச் செலவுகள்"
  },
  "+ Add Monthly Expense": {
    "EN": "+ Add Monthly Expense",
    "MS": "+ Tambah perbelanjaan bulanan",
    "BM": "+ Tambah perbelanjaan bulanan",
    "ZH": "+ 添加每月支出",
    "TA": "+ மாதாந்திரச் செலவைச் சேர்"
  },
  "No monthly expenses recorded.": {
    "EN": "No monthly expenses recorded.",
    "MS": "Tiada perbelanjaan bulanan direkodkan.",
    "BM": "Tiada perbelanjaan bulanan direkodkan.",
    "ZH": "暂无每月支出记录。",
    "TA": "மாதாந்திரச் செலவுகள் பதிவாகவில்லை."
  },
  "Expense Name": {
    "EN": "Expense Name",
    "MS": "Nama perbelanjaan",
    "BM": "Nama perbelanjaan",
    "ZH": "支出名称",
    "TA": "செலவின் பெயர்"
  },
  "Track money in, money out, and expenses across your operations.": {
    "EN": "Track money in, money out, and expenses across your operations.",
    "MS": "Pantau wang masuk, wang keluar dan perbelanjaan operasi.",
    "BM": "Pantau wang masuk, wang keluar dan perbelanjaan operasi.",
    "ZH": "跟踪业务收入、支出与费用。",
    "TA": "வணிகப் பண வரவு, செலவு மற்றும் கட்டணங்களைக் கண்காணி."
  },
  "Payment Method": {
    "EN": "Payment Method",
    "MS": "Kaedah bayaran",
    "BM": "Kaedah bayaran",
    "ZH": "付款方式",
    "TA": "கட்டண முறை"
  },
  "COGS (RM)": {
    "EN": "COGS (RM)",
    "MS": "Kos barangan dijual (RM)",
    "BM": "Kos barangan dijual (RM)",
    "ZH": "销售成本（RM）",
    "TA": "விற்ற பொருட்களின் செலவு (RM)"
  },
  "Recent Transactions": {
    "EN": "Recent Transactions",
    "MS": "Transaksi terkini",
    "BM": "Transaksi terkini",
    "ZH": "近期交易",
    "TA": "அண்மைய பரிவர்த்தனைகள்"
  },
  "View All Transactions": {
    "EN": "View All Transactions",
    "MS": "Lihat semua transaksi",
    "BM": "Lihat semua transaksi",
    "ZH": "查看所有交易",
    "TA": "அனைத்துப் பரிவர்த்தனைகளையும் பார்"
  },
  "Sales Today": {
    "EN": "Sales Today",
    "MS": "Jualan hari ini",
    "BM": "Jualan hari ini",
    "ZH": "今日销售",
    "TA": "இன்றைய விற்பனை"
  },
  "Sales This Month": {
    "EN": "Sales This Month",
    "MS": "Jualan bulan ini",
    "BM": "Jualan bulan ini",
    "ZH": "本月销售",
    "TA": "இந்த மாத விற்பனை"
  },
  "Summary": {
    "EN": "Summary",
    "MS": "Ringkasan",
    "BM": "Ringkasan",
    "ZH": "汇总",
    "TA": "சுருக்கம்"
  },
  "Items": {
    "EN": "Items",
    "MS": "Item",
    "BM": "Item",
    "ZH": "项目",
    "TA": "பொருட்கள்"
  },
  "View": {
    "EN": "View",
    "MS": "Lihat",
    "BM": "Lihat",
    "ZH": "查看",
    "TA": "பார்"
  },
  "Remove": {
    "EN": "Remove",
    "MS": "Buang",
    "BM": "Buang",
    "ZH": "移除",
    "TA": "நீக்கு"
  },
  "Replace": {
    "EN": "Replace",
    "MS": "Ganti",
    "BM": "Ganti",
    "ZH": "替换",
    "TA": "மாற்று"
  },
  "Notes": {
    "EN": "Notes",
    "MS": "Nota",
    "BM": "Nota",
    "ZH": "备注",
    "TA": "குறிப்புகள்"
  },
  "Optional notes": {
    "EN": "Optional notes",
    "MS": "Nota pilihan",
    "BM": "Nota pilihan",
    "ZH": "可选备注",
    "TA": "விருப்பக் குறிப்புகள்"
  },
  "Size": {
    "EN": "Size",
    "MS": "Saiz",
    "BM": "Saiz",
    "ZH": "尺寸",
    "TA": "அளவு"
  },
  "Date:": {
    "EN": "Date:",
    "MS": "Tarikh:",
    "BM": "Tarikh:",
    "ZH": "日期：",
    "TA": "தேதி:"
  },
  "Orders:": {
    "EN": "Orders:",
    "MS": "Pesanan:",
    "BM": "Pesanan:",
    "ZH": "订单：",
    "TA": "ஆர்டர்கள்:"
  },
  "Products:": {
    "EN": "Products:",
    "MS": "Produk:",
    "BM": "Produk:",
    "ZH": "商品：",
    "TA": "பொருட்கள்:"
  },
  "Total:": {
    "EN": "Total:",
    "MS": "Jumlah:",
    "BM": "Jumlah:",
    "ZH": "总额：",
    "TA": "மொத்தம்:"
  },
  "Sales RM": {
    "EN": "Sales RM",
    "MS": "Jualan RM",
    "BM": "Jualan RM",
    "ZH": "销售额 RM",
    "TA": "விற்பனை RM"
  },
  "Other recorded payment methods: RM": {
    "EN": "Other recorded payment methods: RM",
    "MS": "Kaedah bayaran lain direkodkan: RM",
    "BM": "Kaedah bayaran lain direkodkan: RM",
    "ZH": "其他已记录付款方式：RM",
    "TA": "பிற பதிவான கட்டண முறைகள்: RM"
  },
  "· Money received RM": {
    "EN": "· Money received RM",
    "MS": "· Wang diterima RM",
    "BM": "· Wang diterima RM",
    "ZH": "· 已收金额 RM",
    "TA": "· பெறப்பட்ட தொகை RM"
  },
  "· Outstanding RM": {
    "EN": "· Outstanding RM",
    "MS": "· Belum diterima RM",
    "BM": "· Belum diterima RM",
    "ZH": "· 未收金额 RM",
    "TA": "· நிலுவைத் தொகை RM"
  },
  "Order ·": {
    "EN": "Order ·",
    "MS": "Pesanan ·",
    "BM": "Pesanan ·",
    "ZH": "订单 ·",
    "TA": "ஆர்டர் ·"
  },
  "Settings": {
    "EN": "Settings",
    "MS": "Tetapan",
    "BM": "Tetapan",
    "ZH": "设置",
    "TA": "அமைப்புகள்"
  },
  "Language": {
    "EN": "Language",
    "MS": "Bahasa",
    "BM": "Bahasa",
    "ZH": "语言",
    "TA": "மொழி"
  },
  "Settings are managed in MYOPS.": {
    "EN": "Settings are managed in MYOPS.",
    "MS": "Tetapan diurus melalui MYOPS.",
    "BM": "Tetapan diurus melalui MYOPS.",
    "ZH": "设置由 MYOPS 管理。",
    "TA": "அமைப்புகள் MYOPS இல் நிர்வகிக்கப்படுகின்றன."
  },
  "Kembali ke MYOPS": {
    "EN": "Kembali ke MYOPS",
    "MS": "Kembali ke MYOPS",
    "BM": "Kembali ke MYOPS",
    "ZH": "返回 MYOPS",
    "TA": "MYOPS க்குத் திரும்பு"
  },
  "Kembali…": {
    "EN": "Kembali…",
    "MS": "Sedang kembali…",
    "BM": "Sedang kembali…",
    "ZH": "正在返回…",
    "TA": "திரும்புகிறது…"
  }
};

const normalized = (value:string) => value.trim().toLowerCase();
const bySource = new Map<string, Partial<Record<Language,string>>>();
function index(en:Record<string,unknown>, path:string[] = []) {
 for(const [key,value] of Object.entries(en)) {
  const keys=[...path,key];
  if(typeof value==='string') {
   const row:Partial<Record<Language,string>>={};
   for(const lang of Object.keys(translations) as Language[]) {
    let target:unknown=translations[lang];
    for(const part of keys)target=(target as Record<string,unknown>)?.[part];
    if(typeof target==='string')row[lang]=target;
   }
   bySource.set(normalized(value),row);
  } else if(value&&typeof value==='object')index(value as Record<string,unknown>,keys);
 }
}
index(translations.EN);
for(const [source,row] of Object.entries(extra))bySource.set(normalized(source), {...bySource.get(normalized(source)),...row});
export function shopText(language:Language,source:string):string {return language==='EN'?source:bySource.get(normalized(source))?.[language]??source;}
export function hasShopCopy(source:string):boolean {return bySource.has(normalized(source));}
