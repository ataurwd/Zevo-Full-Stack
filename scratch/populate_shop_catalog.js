const API_BASE = "http://localhost:5000/api/v1";

async function main() {
  console.log("1. Authenticating as Operations Admin...");
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@nexora.com",
      password: "Password123!",
    }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.data?.access_token) {
    throw new Error("Failed to authenticate: " + JSON.stringify(loginData));
  }
  const token = loginData.data.access_token;
  console.log("✅ Authenticated successfully!");

  // 2. Fetch or Create Categories
  console.log("2. Ensuring categories exist...");
  const catTreeRes = await fetch(`${API_BASE}/categories`);
  const catTreeData = await catTreeRes.json();
  const existingCats = catTreeData.data || [];

  const requiredCategories = [
    { name: "Drinks", slug: "drinks", description: "Fresh pressed juices, smoothies, and hydration" },
    { name: "Eco Garden", slug: "eco-garden", description: "Locally harvested sustainable organic farm produce" },
    { name: "Fresh Nuts", slug: "fresh-nuts", description: "Premium raw and roasted whole nuts" },
    { name: "Fruits", slug: "fruits", description: "Peak-season sweet and exotic fresh fruits" },
    { name: "Spices", slug: "spices", description: "Whole and ground organic culinary spices" },
    { name: "Meat & Seafood", slug: "meat-seafood", description: "Pasture-raised meats and sustainable wild catch" },
  ];

  const catMap = {};
  for (const cat of existingCats) {
    catMap[cat.slug] = cat.id;
  }

  for (const reqCat of requiredCategories) {
    if (!catMap[reqCat.slug]) {
      const createRes = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: reqCat.name,
          description: reqCat.description,
        }),
      });
      const resJson = await createRes.json();
      if (resJson.success) {
        catMap[resJson.data.slug] = resJson.data.id;
        console.log(`Created category: ${resJson.data.name} (${resJson.data.id})`);
      }
    } else {
      console.log(`Category exists: ${reqCat.name} (${catMap[reqCat.slug]})`);
    }
  }

  // 3. Fetch existing products to avoid duplicate names
  const existingProductsRes = await fetch(`${API_BASE}/products?limit=100`);
  const existingProductsData = await existingProductsRes.json();
  const existingNames = new Set((existingProductsData.data?.items || []).map((p) => p.name.toLowerCase()));

  // 4. Products specification matching reference image
  const productsToSeed = [
    {
      name: "Banana Flavor Fruit",
      catSlug: "fruits",
      price: 90.0,
      compare: null,
      stock: 0, // Out of Stock
      images: [
        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=900&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Naturally sweet golden organic bananas harvested at peak ripeness. Packed with potassium and wholesome natural sweetness.",
      color: "Yellow",
      weight: "1kg",
      brand: "Brand 1",
      type: "Organic",
      hot: true,
      deal: false,
    },
    {
      name: "Berry Smoothie Concor",
      catSlug: "drinks",
      price: 350.0,
      compare: null,
      stock: 45,
      images: [
        "https://images.unsplash.com/photo-1537640538966-79f369143f8f?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Hand-picked green Concord grape and berry smoothie blend. Pure cold-pressed richness without added refined sugars.",
      color: "Green",
      weight: "500g",
      brand: "Brand 4",
      type: "Vegan",
      hot: false,
      deal: false,
    },
    {
      name: "Cabbage Fresh",
      catSlug: "eco-garden",
      price: 50.0,
      compare: 80.0,
      stock: 80,
      images: [
        "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Crisp and dense farm-fresh green Savoy cabbage. Grown with zero synthetic fertilizers in certified regenerative organic soil.",
      color: "Green",
      weight: "1kg",
      brand: "Brand 2",
      type: "Organic",
      hot: true,
      deal: true,
    },
    {
      name: "Cherry Juice",
      catSlug: "drinks",
      price: 120.0,
      compare: null,
      stock: 65,
      images: [
        "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Pure green Bartlett pear and wild tart cherry cold-pressed organic nectar. Rich in natural antioxidants.",
      color: "Green",
      weight: "500g",
      brand: "Brand 3",
      type: "Organic",
      hot: true,
      deal: false,
    },
    {
      name: "Coconut Juice",
      catSlug: "drinks",
      price: 200.0,
      compare: null,
      stock: 40,
      images: [
        "https://images.unsplash.com/photo-1544378730-8b5104b18790?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Raw tender green coconuts harvested young for pristine isotonic water and tender jelly-soft coconut meat.",
      color: "Green",
      weight: "1kg",
      brand: "Brand 1",
      type: "Vegan",
      hot: true,
      deal: false,
    },
    {
      name: "Consectetuer Adipi",
      catSlug: "eco-garden",
      price: 45.0,
      compare: 79.0,
      stock: 0, // Out of Stock
      images: [
        "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Buttery Hass avocados grown under coastal morning fog. Silky texture rich in heart-healthy monounsaturated fats.",
      color: "Green",
      weight: "250g",
      brand: "Brand 4",
      type: "Organic",
      hot: false,
      deal: false,
    },
    {
      name: "Eggs",
      catSlug: "eco-garden",
      price: 79.0,
      compare: 99.0,
      stock: 110,
      images: [
        "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Pasture-raised free-range organic brown eggs with deep amber yolks from hens roaming open grassy meadows.",
      color: "Yellow",
      weight: "500g",
      brand: "Brand 2",
      type: "Organic",
      hot: true,
      deal: true,
    },
    {
      name: "Farm Vegetables",
      catSlug: "eco-garden",
      price: 150.0,
      compare: null,
      stock: 35,
      images: [
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Rustic artisan crate filled with seasonal root vegetables, heirloom tomatoes, crunchy carrots, and leeks.",
      color: "Red",
      weight: "1kg",
      brand: "Brand 4",
      type: "Organic",
      hot: false,
      deal: false,
    },
    {
      name: "Fresh Beef Meat",
      catSlug: "meat-seafood",
      price: 100.0,
      compare: null,
      stock: 0, // Out of Stock
      images: [
        "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Grass-fed Prime Angus beef cuts with exquisite intra-muscular marbling, dry-aged for extraordinary tenderness.",
      color: "Red",
      weight: "1kg",
      brand: "Brand 3",
      type: "Meat",
      hot: true,
      deal: false,
    },
    {
      name: "Fresh Seafood",
      catSlug: "meat-seafood",
      price: 65.0,
      compare: 90.0,
      stock: 50,
      images: [
        "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Wild-caught Alaskan king salmon fillets with fresh garden dill and organic lemon slices. High in Omega-3.",
      color: "Pink",
      weight: "500g",
      brand: "Brand 4",
      type: "Meat",
      hot: false,
      deal: false,
    },
    {
      name: "Kale Bunch",
      catSlug: "fruits",
      price: 150.0,
      compare: null,
      stock: 45,
      images: [
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Sweet heirloom striped seeded watermelon with crisp, juicy crimson flesh that bursts with refreshing summer hydration.",
      color: "Green",
      weight: "1kg",
      brand: "Brand 2",
      type: "Vegan",
      hot: false,
      deal: false,
    },
    {
      name: "Orange Juice",
      catSlug: "drinks",
      price: 50.0,
      compare: 79.0,
      stock: 60,
      images: [
        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Creamy probiotic strawberry yogurt shake infused with Valencia orange zest and whole summer strawberries.",
      color: "Pink",
      weight: "500g",
      brand: "Brand 1",
      type: "Organic",
      hot: true,
      deal: true,
    },
    {
      name: "Organic Potato",
      catSlug: "eco-garden",
      price: 100.0,
      compare: 150.0,
      stock: 120,
      images: [
        "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Golden Yukon organic potatoes. Buttery texture ideal for roasting, mashing, or hearty farm stews.",
      color: "Yellow",
      weight: "1kg",
      brand: "Brand 2",
      type: "Organic",
      hot: true,
      deal: false,
    },
    {
      name: "California Raw Almonds",
      catSlug: "fresh-nuts",
      price: 45.0,
      compare: null,
      stock: 70,
      images: [
        "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Unpasteurized nonpareil California almonds. Crunchy, nutrient-dense, and loaded with vitamin E.",
      color: "Yellow",
      weight: "250g",
      brand: "Brand 3",
      type: "Organic",
      hot: false,
      deal: false,
    },
    {
      name: "Organic Cashew Nuts",
      catSlug: "fresh-nuts",
      price: 65.0,
      compare: null,
      stock: 50,
      images: [
        "https://images.unsplash.com/photo-1536591375315-1b8ea8941916?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Whole W320 jumbo raw cashews. Naturally creamy and sweet, perfect for wholesome snacking.",
      color: "Yellow",
      weight: "200g",
      brand: "Brand 4",
      type: "Vegan",
      hot: false,
      deal: false,
    },
    {
      name: "English Walnuts Shelled",
      catSlug: "fresh-nuts",
      price: 85.0,
      compare: null,
      stock: 40,
      images: [
        "https://images.unsplash.com/photo-1585849834908-3481231155e8?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Light amber walnut halves packed with brain-boosting ALA Omega-3 fatty acids.",
      color: "Yellow",
      weight: "500g",
      brand: "Brand 1",
      type: "Organic",
      hot: false,
      deal: false,
    },
    {
      name: "Organic Ceylon Cinnamon",
      catSlug: "spices",
      price: 25.0,
      compare: null,
      stock: 90,
      images: [
        "https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "True Ceylon cinnamon quills directly from Sri Lankan family estates. Fragrant, delicate, and low in coumarin.",
      color: "Red",
      weight: "200g",
      brand: "Brand 2",
      type: "Organic",
      hot: false,
      deal: false,
    },
    {
      name: "Tellicherry Black Peppercorns",
      catSlug: "spices",
      price: 18.0,
      compare: null,
      stock: 80,
      images: [
        "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Extra bold aromatic black peppercorns from Malabar coast. Rich pungent heat with cedar undertones.",
      color: "Black",
      weight: "200g",
      brand: "Brand 3",
      type: "Vegan",
      hot: false,
      deal: false,
    },
    {
      name: "Alleppey Turmeric Powder",
      catSlug: "spices",
      price: 22.0,
      compare: null,
      stock: 110,
      images: [
        "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Vibrant golden root powder with over 5% natural curcumin content. Potent culinary spice.",
      color: "Yellow",
      weight: "250g",
      brand: "Brand 4",
      type: "Organic",
      hot: false,
      deal: false,
    },
    {
      name: "Organic Red Chili Flakes",
      catSlug: "spices",
      price: 16.0,
      compare: null,
      stock: 75,
      images: [
        "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Sun-dried crushed red pepper flakes with seeds. Delivers warm tingling heat to dishes.",
      color: "Red",
      weight: "200g",
      brand: "Brand 1",
      type: "Vegan",
      hot: false,
      deal: false,
    },
    {
      name: "Fresh Blueberries Punnet",
      catSlug: "fruits",
      price: 35.0,
      compare: null,
      stock: 65,
      images: [
        "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Plump organic highbush blueberries bursting with antioxidant anthocyanins.",
      color: "Blue",
      weight: "250g",
      brand: "Brand 2",
      type: "Organic",
      hot: false,
      deal: false,
    },
    {
      name: "Wild Organic Blackberries",
      catSlug: "fruits",
      price: 42.0,
      compare: null,
      stock: 40,
      images: [
        "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Dark juicy bramble blackberries picked by hand. Packed with dietary fiber.",
      color: "Black",
      weight: "200g",
      brand: "Brand 4",
      type: "Vegan",
      hot: false,
      deal: false,
    },
    {
      name: "Pink Pitaya Dragonfruit",
      catSlug: "fruits",
      price: 55.0,
      compare: null,
      stock: 35,
      images: [
        "https://images.unsplash.com/photo-1527325678964-54921661f888?q=80&w=900&auto=format&fit=crop",
      ],
      desc: "Exotic magenta dragonfruit with tender green scales and sweet seed-speckled ruby-pink pulp.",
      color: "Pink",
      weight: "500g",
      brand: "Brand 3",
      type: "Organic",
      hot: false,
      deal: false,
    },
  ];

  console.log(`3. Seeding ${productsToSeed.length} products...`);
  let createdCount = 0;
  for (const item of productsToSeed) {
    if (existingNames.has(item.name.toLowerCase())) {
      console.log(`- Skipping existing: ${item.name}`);
      continue;
    }

    const catId = catMap[item.catSlug] || Object.values(catMap)[0];
    const payload = {
      name: item.name,
      category_id: catId,
      description: item.desc,
      status: "approved",
      base_price: Math.round(item.price * 100),
      images: item.images,
      inventory_quantity: item.stock,
      tags: [
        item.catSlug,
        item.color.toLowerCase(),
        item.weight.toLowerCase(),
        item.brand.toLowerCase().replace(" ", "-"),
        item.type.toLowerCase(),
        item.hot ? "hot" : "",
        item.deal ? "deal" : "",
      ].filter(Boolean),
      variants: [
        {
          sku: `SKU-${item.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          name: `${item.weight} Pack`,
          price: Math.round(item.price * 100),
          compare_at_price: item.compare ? Math.round(item.compare * 100) : null,
          attributes: {
            Weight: item.weight,
            Color: item.color,
            Brand: item.brand,
            Type: item.type,
          },
          is_active: true,
        },
      ],
    };

    const res = await fetch(`${API_BASE}/products/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const resData = await res.json();
    if (resData.success) {
      createdCount++;
      console.log(`+ Created product (${createdCount}/${productsToSeed.length}): ${item.name}`);
    } else {
      console.error(`! Failed to create ${item.name}:`, resData.error || resData);
    }
  }

  console.log(`🎉 Finished! Created ${createdCount} new products.`);
}

main().catch(console.error);
