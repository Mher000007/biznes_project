import { NextRequest, NextResponse } from "next/server";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";

interface ChatRequest {
  message: string;
  sessionId?: string;
}

// Full premium menus for mock calculations in standalone environment
const MOCK_MENUS: Record<string, Array<{ name: string; price: number; category: string; description: string }>> = {
  "lavash-restaurant-group": [
    { name: "Traditional Pork Khorovats", price: 3800, category: "Main Course", description: "Charcoal grilled marinated pork skewers" },
    { name: "Chicken Tabaka", price: 2900, category: "Main Course", description: "Crispy pan-fried whole chicken" },
    { name: "Tzhvzhik", price: 2400, category: "Appetizer", description: "Traditional beef liver dish" },
    { name: "Fresh Basturma Platter", price: 2800, category: "Appetizer", description: "Air-cured beef with fenugreek" },
    { name: "Khachapuri", price: 2200, category: "Main Course", description: "Cheese-filled crusty bread" },
    { name: "Gata Dessert", price: 1500, category: "Dessert", description: "Traditional sweet pastry" },
    { name: "Armenian Wine (Glass)", price: 1600, category: "Drinks", description: "Dry red Karas wine" },
    { name: "Tan (Yogurt Drink)", price: 600, category: "Drinks", description: "Traditional salted yogurt beverage" }
  ],
  "dilijan-resort-spa": [
    { name: "Forest Mushroom Soup", price: 2200, category: "Appetizer", description: "Creamy local wild mushroom soup" },
    { name: "Grilled Dilijan Trout", price: 4500, category: "Main Course", description: "Fresh river trout served with vegetables" },
    { name: "Tan (Yogurt Drink)", price: 800, category: "Drinks", description: "Yogurt beverage" }
  ]
};

// Full premium services for car washes and auto centers
const MOCK_SERVICES: Record<string, Array<{ name: string; price: number; description: string }>> = {
  "armtech-solutions": [
    { name: "Custom Software Development", price: 250000, description: "Tailored enterprise solutions" },
    { name: "IT Consulting", price: 40000, description: "Cloud migration advice" }
  ]
};

// Default services for any business fallback
const DEFAULT_AUTO_SERVICES = [
  { name: "Engine Oil Change", price: 8000, description: "Oil and filter change" },
  { name: "Express Car Wash", price: 3000, description: "Exterior wash and wax" },
  { name: "Full Detailing", price: 25000, description: "Interior and exterior deep cleaning" },
  { name: "Brake Pad Replacement", price: 12000, description: "Front or rear brake pads installation" }
];

function findMenuCombination(menu: any[], budget: number, pax: number) {
  const appetizers = menu.filter(item => item.category?.toLowerCase().includes('appetizer'));
  const mains = menu.filter(item => item.category?.toLowerCase().includes('main') || item.category?.toLowerCase().includes('dine'));
  const drinks = menu.filter(item => item.category?.toLowerCase().includes('drink') || item.category?.toLowerCase().includes('tan') || item.category?.toLowerCase().includes('wine'));

  let bestCombo: any[] | null = null;
  let bestTotal = 0;

  // Try to find combo of: 1 appetizer + 1 main + 1 drink per person
  for (const app of (appetizers.length > 0 ? appetizers : [null])) {
    for (const main of (mains.length > 0 ? mains : [null])) {
      for (const drink of (drinks.length > 0 ? drinks : [null])) {
        let total = 0;
        const items = [];
        if (app) { total += app.price * pax; items.push({ ...app, qty: pax }); }
        if (main) { total += main.price * pax; items.push({ ...main, qty: pax }); }
        if (drink) { total += drink.price * pax; items.push({ ...drink, qty: pax }); }

        if (total > 0 && total <= budget && total > bestTotal) {
          bestTotal = total;
          bestCombo = items;
        }
      }
    }
  }

  // Fallback 1: Just mains and drinks
  if (!bestCombo) {
    for (const main of (mains.length > 0 ? mains : [null])) {
      for (const drink of (drinks.length > 0 ? drinks : [null])) {
        let total = 0;
        const items = [];
        if (main) { total += main.price * pax; items.push({ ...main, qty: pax }); }
        if (drink) { total += drink.price * pax; items.push({ ...drink, qty: pax }); }

        if (total > 0 && total <= budget && total > bestTotal) {
          bestTotal = total;
          bestCombo = items;
        }
      }
    }
  }

  // Fallback 2: Just mains
  if (!bestCombo) {
    for (const main of mains) {
      const total = main.price * pax;
      if (total <= budget && total > bestTotal) {
        bestTotal = total;
        bestCombo = [{ ...main, qty: pax }];
      }
    }
  }

  return bestCombo ? { items: bestCombo, total: bestTotal } : null;
}

export async function POST(request: NextRequest) {
  const body: ChatRequest = await request.json();
  const { message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const lower = message.toLowerCase();

  // 1. Detect Budget & Pax limits
  const priceMatch = lower.match(/(under|below|within|budget of)\s*([\d,]+)\s*(amd|dram|drams)?/);
  const paxMatch = lower.match(/(for)?\s*(\d+)\s*(people|person|guests?|pax)/);
  
  const budget = priceMatch ? parseInt(priceMatch[2].replace(/,/g, "")) : null;
  const pax = paxMatch ? parseInt(paxMatch[2]) : 1;

  // Intent analysis
  let intent = "find_service";
  let content = "";
  let suggestions: any[] = [];
  let quickReplies: string[] = ["🍽️ Restaurants", "🚗 Car Services", "🏨 Hotels & Spas", "Help"];

  const isCarServiceQuery = lower.includes("car") || lower.includes("auto") || lower.includes("oil") || lower.includes("mechanic") || lower.includes("wash");
  const isRestaurantQuery = lower.includes("restaurant") || lower.includes("eat") || lower.includes("food") || lower.includes("lavash") || lower.includes("dinner");

  if (isCarServiceQuery && budget !== null) {
    intent = "budget_car_service";
    // Filter matching businesses (either auto category or has tag)
    const matchingBiz = MOCK_BUSINESSES.filter(b => b.category.slug === "retail" || b.tags.includes("car") || b.tags.includes("auto") || b.tags.includes("organic") || b.name.toLowerCase().includes("auto"));
    
    // We will build a list of matching auto services that fit the budget
    const results: any[] = [];
    
    // Loop through mock services or use default auto services for demonstration
    const servicesList = DEFAULT_AUTO_SERVICES;
    const matchingServices = servicesList.filter(s => s.price <= budget);

    if (matchingServices.length > 0) {
      content = `I found some car service options under **${budget.toLocaleString()} AMD**:\n\n` +
        matchingServices.map(s => `• **${s.name}**: ${s.price.toLocaleString()} AMD (${s.description})`).join("\n") +
        `\n\nI recommend visiting **Grand Auto Center** or **Gyumri Auto Care** for these rates.`;
      
      // Return suggestions
      suggestions = MOCK_BUSINESSES.filter(b => b.slug === "silk-road-trading" || b.slug === "gyumri-digital-hub").map(b => ({
        id: b.id,
        name: b.name === "Silk Road Trading Co." ? "Grand Auto Services" : "Gyumri Auto Care",
        category: "Auto Repair",
        rating: 4.8,
        city: b.city,
        shortDescription: "Affordable tire, oil, and diagnostics hub.",
        slug: b.slug,
      }));
    } else {
      content = `Sorry, I couldn't find any car services under **${budget.toLocaleString()} AMD**. Standard oil changes typically start at 8,000 AMD in Yerevan.`;
    }
  } 
  else if (isRestaurantQuery && budget !== null) {
    intent = "budget_restaurant";
    // Target Lavash restaurant as the representative HoReCa item
    const lavashBiz = MOCK_BUSINESSES.find(b => b.slug === "lavash-restaurant-group");
    const menu = MOCK_MENUS["lavash-restaurant-group"];

    if (lavashBiz && menu) {
      const combo = findMenuCombination(menu, budget, pax);
      if (combo) {
        const itemLines = combo.items.map(item => `  - ${item.qty}x **${item.name}** (${item.price.toLocaleString()} AMD each)`).join("\n");
        content = `Yes! At **${lavashBiz.name}**, you can dine comfortably for **${pax} people** within a total budget of **${budget.toLocaleString()} AMD**.\n\nHere is a calculated combination from their menu:\n${itemLines}\n\n**Total Price**: **${combo.total.toLocaleString()} AMD** (remaining budget: ${(budget - combo.total).toLocaleString()} AMD).\n\nWould you like to book a table now?`;
        
        suggestions = [{
          id: lavashBiz.id,
          name: lavashBiz.name,
          category: "HoReCa",
          rating: lavashBiz.ratingAvg,
          city: lavashBiz.city,
          shortDescription: lavashBiz.shortDescription,
          slug: lavashBiz.slug
        }];
        quickReplies = ["📅 Book a table", "View Menu", "Other options"];
      } else {
        content = `A budget of **${budget.toLocaleString()} AMD** is slightly tight for **${pax} people** at high-end restaurants. I recommend increasing the budget to at least ${(pax * 5000).toLocaleString()} AMD or exploring smaller local taverns.`;
      }
    } else {
      content = `I found restaurant listings in Yerevan, but their digital menus are currently offline. Standard dining budgets are around 5,000 AMD - 10,000 AMD per person.`;
    }
  }
  else if (lower.includes("book") || lower.includes("table") || lower.includes("reserve")) {
    intent = "book_service";
    const lavash = MOCK_BUSINESSES.find(b => b.slug === "lavash-restaurant-group");
    content = `I can trigger an instant reservation for you. Would you like to book a table at **Lavash Restaurant** in Yerevan?`;
    if (lavash) {
      suggestions = [{
        id: lavash.id,
        name: lavash.name,
        category: "HoReCa",
        rating: 4.9,
        city: "Yerevan",
        shortDescription: "Award-winning traditional Armenian kitchen.",
        slug: lavash.slug
      }];
    }
    quickReplies = ["Yes, Book table", "No, show other categories"];
  }
  else if (lower.match(/^(hi|hello|hey|barev|privet)/)) {
    intent = "greeting";
    content = `Barev! 👋 I'm your ArmenBiz AI assistant. I can calculate menu combinations and look up service rates under specific budgets.\n\nTry asking me:\n• "Find a car service under 10,000 AMD for an oil change."\n• "Recommend a restaurant for 4 people with a budget of 30,000 AMD."`;
  }
  else {
    // Default search fallback
    const matches = MOCK_BUSINESSES.filter(b => 
      b.name.toLowerCase().includes(lower) || 
      b.category.slug.includes(lower) ||
      b.tags.some(t => t.includes(lower))
    ).slice(0, 2);

    if (matches.length > 0) {
      content = `I found some businesses matching your query:`;
      suggestions = matches.map(b => ({
        id: b.id,
        name: b.name,
        category: b.category.name,
        rating: b.ratingAvg,
        city: b.city,
        shortDescription: b.shortDescription,
        slug: b.slug
      }));
    } else {
      content = `I'm here to guide your discovery! Ask me about service budgets (e.g. oil change under 10,000 AMD) or group dining selections (e.g. restaurant for 4 people under 30,000 AMD).`;
    }
  }

  return NextResponse.json({
    response: content,
    intent,
    suggestions,
    quickReplies,
    sessionId: `session-${Date.now()}`
  });
}
