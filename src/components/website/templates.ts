import type { RestaurantData } from "./RestaurantPage"

export interface TemplateDef {
  id: string
  name: string
  tagline: string
  /** [gradient start, gradient end, page background] used for gallery swatches */
  swatch: [string, string, string]
  dark?: boolean
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "ember",
    name: "Ember",
    tagline: "Bold coral-red energy — the signature Fast7 look",
    swatch: ["#ff7a3d", "#d42b22", "#faf6f0"],
  },
  {
    id: "verdant",
    name: "Verdant",
    tagline: "Fresh greens for cafés and farm-to-table kitchens",
    swatch: ["#4ade80", "#15803d", "#f5faf3"],
  },
  {
    id: "midnight",
    name: "Midnight",
    tagline: "Dark, moody luxury with warm gold accents",
    swatch: ["#f0c96c", "#3a2a15", "#14100c"],
    dark: true,
  },
  {
    id: "coastal",
    name: "Coastal",
    tagline: "Breezy blues for seaside diners and bistros",
    swatch: ["#38bdf8", "#0369a1", "#f3f9fd"],
  },
  {
    id: "royal",
    name: "Royal",
    tagline: "Regal purple for fine dining and lounges",
    swatch: ["#8b5cf6", "#6d28d9", "#faf8fd"],
  },
  {
    id: "saffron",
    name: "Saffron",
    tagline: "Warm Indian spice tones, rich and inviting",
    swatch: ["#f59e0b", "#ea580c", "#fdf8ef"],
  },
]

export const DEFAULT_TEMPLATE_ID = "ember"

export function getTemplateById(id?: string | null): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

/** Sample restaurant used for template previews */
export const SAMPLE_RESTAURANT: RestaurantData = {
  domainName: "saffron-and-smoke",
  orderingEnabled: true,
  templateId: "ember",
  coverPhoto:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1974&q=80",
  restaurantInfo: {
    name: "Saffron & Smoke",
    address: "12, Brigade Road, Bengaluru 560025",
    phone: "+91 98765 43210",
    email: "hello@saffronandsmoke.in",
    bio: "Slow-cooked spices, live tandoor and small-batch desserts — a modern Indian kitchen where every plate tells a story.",
  },
  menuSelections: {
    standardCategories: [
      { id: "starters", name: "Starters", icon: "🥗" },
      { id: "mains", name: "Main Course", icon: "🍛" },
      { id: "breads", name: "Breads & Rice", icon: "🍚" },
      { id: "desserts", name: "Desserts", icon: "🍮" },
    ],
    customCategories: [],
    standardItems: {
      starters: [
        {
          id: "s1",
          name: "Tandoori Chicken Tikka",
          description: "Charcoal-grilled chicken marinated in hung curd, ajwain and smoked chilli butter.",
          price: 340,
          image: "https://images.unsplash.com/photo-1603894584373-5ac82b5ae46b?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "s2",
          name: "Dahi Puri Chaat",
          description: "Crisp puris, whipped yogurt, tamarind drizzle and pomegranate pearls.",
          price: 220,
          image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "s3",
          name: "Gunpowder Paneer",
description: "Cubed paneer tossed with podi masala, curry leaves and ghee-roasted garlic.",
          price: 290,
          image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d5?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "s4",
          name: "Amritsari Fish Amuse",
          description: "Ajwain-gram flour battered river sole, fried crisp with green chutney aioli.",
          price: 380,
          image: "https://images.unsplash.com/photo-1580476262798-ccc7d09c6a0b?auto=format&fit=crop&w=800&q=70",
        },
      ],
      mains: [
        {
          id: "m1",
          name: "Butter Chicken Makhani",
          description: "Tandoor-smoked chicken folded into a silky tomato-cashew gravy finished with white butter.",
          price: 460,
          image: "https://images.unsplash.com/photo-1603894584373-5ac82b5ae46b?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "m2",
          name: "Lamb Rogan Josh",
          description: "Kashmiri chillies, fennel and slow-braised lamb shank with pickled onions.",
          price: 540,
          image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "m3",
          name: "Dal Saffroni",
          description: "48-hour slow-cooked black lentils, cream, kasuri methi and a whiff of saffron.",
          price: 380,
          image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "m4",
          name: "Smoked Baingan Bharta",
          description: "Fire-roasted eggplant mash, green peas, ginger and cold-pressed mustard oil.",
          price: 320,
          image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=70",
        },
      ],
      breads: [
        {
          id: "b1",
          name: "Truffle Garlic Naan",
          description: "Stone-baked naan brushed with truffle oil, roasted garlic and coriander butter.",
          price: 160,
          image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "b2",
          name: "Laccha Paratha",
          description: "Sixteen flaky layers of whole-wheat indulgence, ghee-basted.",
          price: 120,
          image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "b3",
          name: "Saffron Pulao",
          description: "Aged basmati tossed with saffron strands, fried onions, pistachio and rose petals.",
          price: 260,
          image: "https://images.unsplash.com/photo-1596560548464-f010549b84f7?auto=format&fit=crop&w=800&q=70",
        },
      ],
      desserts: [
        {
          id: "d1",
          name: "Mishti Doi Cheesecake",
description: "Bengali baked yogurt on a buttery biscuit crust, drizzled with jaggery caramel.",
          price: 240,
          image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "d2",
          name: "Gulab Jamun Brûlée",
          description: "Khoya dumplings torched with demerara, cardamom cream on the side.",
          price: 220,
          image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=70",
        },
        {
          id: "d3",
          name: "Kulhad Kulfi Falooda",
          description: "Pistachio kulfi set in clay, vermicelli, basil seeds and rose syrup.",
          price: 260,
          image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=70",
        },
      ],
    },
    customItems: {},
  },
}
