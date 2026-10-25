/**
 * Official Bistrot Salad Bar menu ("NEW MENU COMPO", January 2025).
 *
 * Every item, price and quantity below is transcribed from the printed menu.
 * Nothing here is invented: rules the menu leaves open live in policies.ts.
 * In production this file becomes the seed for the Supabase tables
 * (supabase/migrations) and the admin dashboard edits it from there.
 */
import type { Formula, MenuItem, ToppingGroup, Localized } from "./types";

export const FORMULAS: Formula[] = [
  {
    id: "equilibree",
    name: { fr: "Melina Équilibrée", ar: "ميلينا المتوازنة" },
    price: 49,
    // The menu prints "SAUCES" without a number for the first three formulas.
    allowances: { base: 1, ingredient: 5, topping: 2, petitPlus: 1, sauce: null },
    accent: "#E8336B",
    order: 1,
  },
  {
    id: "merveille",
    name: { fr: "Melina Merveille", ar: "ميلينا الرائعة" },
    price: 59,
    allowances: { base: 1, ingredient: 6, topping: 3, petitPlus: 1, sauce: null },
    accent: "#F08A1C",
    order: 2,
  },
  {
    id: "prestige",
    name: { fr: "Melina Prestige", ar: "ميلينا بريستيج" },
    price: 69,
    allowances: { base: 1, ingredient: 8, topping: 4, petitPlus: 1, sauce: null },
    accent: "#7DBA2F",
    order: 3,
  },
  {
    id: "regale",
    name: { fr: "Melina Régale", ar: "ميلينا ريغال" },
    price: 119,
    allowances: { base: 3, ingredient: 12, topping: 7, petitPlus: 2, sauce: 3 },
    accent: "#4A4D4B",
    order: 4,
  },
];

/** "Supplément base / ingrédient / topping" box printed on the menu. */
export const OFFICIAL_EXTRA_SLOT_FEES = { base: 5, ingredient: 5, topping: 10 } as const;

/** WhatsApp ordering number printed on the menu (0691322455). */
export const WHATSAPP_NUMBER = "+212691322455";
export const RESTAURANT_ADDRESS: Localized = {
  fr: "Espace Restauration Label'Gallery, Place d'Armes, Meknès",
  ar: "فضاء المطاعم لابيل غاليري، ساحة لارام، مكناس",
};
export const INSTAGRAM_HANDLE = "@salad_bistrot";

export const TOPPING_GROUPS: { id: ToppingGroup; name: Localized }[] = [
  { id: "viandes", name: { fr: "Viandes", ar: "لحوم" } },
  { id: "poissons", name: { fr: "Poissons & crustacés", ar: "أسماك وقشريات" } },
  { id: "volailles", name: { fr: "Volailles & œufs", ar: "دواجن وبيض" } },
  { id: "fromages", name: { fr: "Fromages", ar: "أجبان" } },
  { id: "fruits", name: { fr: "Fruits de saison", ar: "فواكه الموسم" } },
];

type Row = [id: string, fr: string, ar: string, supplement?: number];

const build = (
  category: MenuItem["category"],
  rows: Row[],
  extra: Partial<MenuItem> = {},
): MenuItem[] =>
  rows.map(([id, fr, ar, supplement = 0], i) => ({
    id,
    category,
    name: { fr, ar },
    supplement,
    available: true,
    order: i + 1,
    ...extra,
  }));

export const MENU_ITEMS: MenuItem[] = [
  // ÉTAPE 1 : CHOISISSEZ VOTRE BASE
  ...build("base", [
    ["ble-souffle", "Blé soufflé", "قمح منفوخ"],
    ["laitue", "Laitue", "خس"],
    ["pates-blanches", "Pâtes blanches", "معكرونة بيضاء"],
    ["riz-blanc", "Riz blanc", "أرز أبيض"],
    ["roquette", "Roquette", "جرجير", 15],
    ["quinoa", "Quinoa", "كينوا", 10],
    ["pates-completes", "Pâtes complètes", "معكرونة كاملة الحبوب", 10],
    ["riz-brun", "Riz brun", "أرز بني", 10],
  ]),

  // ÉTAPE 2 : AJOUTEZ VOS INGRÉDIENTS
  ...build("ingredient", [
    ["concombre", "Concombre", "خيار"],
    ["haricots-verts", "Haricots verts", "فاصوليا خضراء"],
    ["carottes", "Carottes", "جزر"],
    ["oignons", "Oignons", "بصل"],
    ["pomme-de-terre", "Pomme de terre", "بطاطس"],
    ["betterave", "Betterave", "شمندر"],
    ["poivron", "Poivron", "فلفل حلو"],
    ["artichaut", "Artichaut", "خرشوف"],
    ["fenouil", "Fenouil", "شمر"],
    ["brocolis", "Brocolis", "بروكلي"],
    ["tomates", "Tomates", "طماطم"],
    ["tomates-cerises", "Tomates cerises", "طماطم كرزية"],
    ["tomates-confites", "Tomates confites", "طماطم كونفي"],
    ["tomates-sechees", "Tomates séchées", "طماطم مجففة"],
    ["aubergines-grillees", "Aubergines grillées", "باذنجان مشوي"],
    ["courgettes-grillees", "Courgettes grillées", "كوسة مشوية"],
    ["chou-rouge", "Chou rouge", "ملفوف أحمر"],
    ["chou-blanc", "Chou blanc", "ملفوف أبيض"],
    ["champignons", "Champignons", "فطر"],
    ["avocat", "Avocat", "أفوكادو"],
    ["mais", "Maïs", "ذرة"],
    ["coeur-de-palmier", "Cœur de palmier", "قلب النخيل"],
    ["noix", "Noix", "جوز"],
    ["cajou", "Cajou", "كاجو"],
    ["cacahuetes", "Cacahuètes", "فول سوداني"],
    ["dattes", "Dattes", "تمر"],
    ["figues", "Figues", "تين"],
    ["raisins-secs", "Raisins secs", "زبيب"],
    ["oignons-crispy", "Oignons crispy", "بصل مقرمش"],
    ["cornichons", "Cornichons", "خيار مخلل"],
    ["olives", "Olives vertes / noires", "زيتون أخضر / أسود"],
  ]),

  // ÉTAPE 3 : SÉLECTIONNEZ VOS TOPPINGS
  ...build(
    "topping",
    [
      ["boeuf-roti", "Bœuf rôti", "لحم بقري مشوي", 10],
      ["charcuterie-boeuf", "Charcuterie de bœuf", "شاركوتري بقري"],
    ],
    { group: "viandes" },
  ),
  ...build(
    "topping",
    [
      ["saumon-fume", "Saumon fumé", "سلمون مدخّن", 15],
      ["thon", "Thon", "تونة"],
      ["calamars", "Calamars", "كاليماري"],
      ["anchois", "Anchois", "أنشوفة"],
      ["crevettes", "Crevettes", "روبيان"],
      ["surimi", "Surimi", "سوريمي"],
    ],
    { group: "poissons" },
  ),
  ...build(
    "topping",
    [
      ["poulet", "Poulet / Poulet grillé", "دجاج / دجاج مشوي"],
      ["charcuterie-poulet", "Charcuterie de poulet", "شاركوتري الدجاج"],
      ["charcuterie-poulet-poivre", "Charcuterie de poulet au poivre", "شاركوتري الدجاج بالفلفل"],
      ["oeufs-caille", "Œufs de caille", "بيض السمّان"],
      ["oeufs-fermiers", "Œufs fermiers", "بيض بلدي"],
    ],
    { group: "volailles" },
  ),
  ...build(
    "topping",
    [
      ["edam", "Edam", "جبن إيدام"],
      ["gouda", "Gouda", "جبن غودا"],
      ["mozzarella-cerises", "Mozzarella cerises", "موزاريلا صغيرة"],
      ["feta", "Feta", "جبن فيتا"],
      ["parmesan", "Parmesan", "جبن بارميزان", 10],
      ["chevre", "Fromage de chèvre", "جبن الماعز"],
      ["brie", "Brie", "جبن بري"],
      ["fromage-bleu", "Fromage bleu", "جبن أزرق"],
      ["emmental", "Emmental", "جبن إيمنتال"],
    ],
    { group: "fromages" },
  ),
  ...build(
    "topping",
    [
      ["mangue", "Mangue", "مانجو"],
      ["ananas", "Ananas", "أناناس"],
      ["poire", "Poire", "إجاص"],
      ["pomme", "Pomme", "تفاح"],
      ["peche", "Pêche", "خوخ"],
      ["framboise", "Framboise", "توت العليق"],
      ["melon", "Melon", "شمّام"],
      ["grenade", "Grenade", "رمان"],
      ["orange", "Orange", "برتقال"],
      ["kiwi-kaki", "Kiwi / Kaki", "كيوي / كاكي"],
    ],
    { group: "fruits", seasonal: true },
  ),

  // ÉTAPE 4 : CHOISISSEZ VOS PETITS PLUS
  ...build("petitPlus", [
    ["plantes-aromatiques", "Plantes aromatiques", "أعشاب عطرية"],
    ["lentilles", "Lentilles", "عدس"],
    ["pois-chiches", "Pois chiches", "حمص"],
    ["radis", "Radis", "فجل"],
    ["chia", "Chia", "بذور الشيا"],
    ["croutons-ail", "Croûtons à l'ail", "خبز محمّص بالثوم"],
    ["multigraines", "Multigraines", "بذور متنوعة"],
    ["baguettes-chips", "Baguettes chips", "رقائق الخبز"],
  ]),

  // ÉTAPE 5 : AJOUTEZ VOTRE SAUCE
  ...build("sauce", [
    ["sauce-healthy", "Sauce Healthy", "صلصة هيلثي", 5],
    ["pesto", "Pesto", "صلصة البيستو"],
    ["sauce-asiatique", "Sauce asiatique", "صلصة آسيوية"],
    ["vinaigrette", "Vinaigrette", "صلصة الفينيغريت"],
    ["sauce-cesar", "Sauce César", "صلصة سيزر"],
    ["sauce-yaourt", "Sauce yaourt", "صلصة الزبادي", 5],
    ["sauce-cocktail", "Sauce cocktail", "صلصة كوكتيل"],
    ["miel-moutarde", "Miel & moutarde", "عسل وخردل"],
    ["sauce-balsamique", "Sauce balsamique", "صلصة البلسميك"],
    ["salsa-verde", "Salsa verde", "سالسا فيردي"],
  ]),
];

export const ITEMS_BY_ID: Record<string, MenuItem> = Object.fromEntries(
  MENU_ITEMS.map((item) => [item.id, item]),
);

export const FORMULAS_BY_ID: Record<string, Formula> = Object.fromEntries(
  FORMULAS.map((f) => [f.id, f]),
);

export const CATEGORY_NAMES: Record<MenuItem["category"], Localized> = {
  base: { fr: "Base", ar: "القاعدة" },
  ingredient: { fr: "Ingrédients", ar: "المكونات" },
  topping: { fr: "Toppings", ar: "الإضافات الرئيسية" },
  petitPlus: { fr: "Petits plus", ar: "اللمسات الإضافية" },
  sauce: { fr: "Sauce", ar: "الصلصة" },
};
