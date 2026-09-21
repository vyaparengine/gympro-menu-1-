import { Product } from '../types';

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Gold Standard 100% Whey Protein',
    price: 3499,
    description: 'Premium ultra-filtered whey protein isolate to support muscle growth and recovery. 24g of high-quality protein per serving.',
    image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=600',
    category: 'Protein',
    inStock: true,
    isTrending: true
  },
  {
    id: 'p2',
    name: 'Micronized Creatine Monohydrate',
    price: 1299,
    description: '100% pure micronized creatine monohydrate to boost strength, explosive power, and muscle volume during intense training.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
    category: 'Creatine',
    inStock: true
  },
  {
    id: 'p3',
    name: 'Serious Mass Gainer (High Calorie)',
    price: 4299,
    description: 'High-calorie weight gainer packed with 1250 calories, 50g of blended protein, and 250g+ of carbohydrates to build serious muscle mass.',
    image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&q=80&w=600',
    category: 'Mass Gainer',
    inStock: true
  },
  {
    id: 'p4',
    name: 'Supercharge Pre-Workout Energy',
    price: 1899,
    description: 'Explosive energy, heightened focus, and extreme muscle pump. Contains Beta-Alanine, L-Arginine, and caffeine anhydrous.',
    image: 'https://images.unsplash.com/photo-1605296867304-46d5465a25f1?auto=format&fit=crop&q=80&w=600',
    category: 'Pre-workout',
    inStock: true
  },
  {
    id: 'p5',
    name: 'ISO-Whey Zero Sugar Isolate',
    price: 4899,
    description: 'Zero sugar, zero fat, 100% pure premium grass-fed whey isolate. The perfect choice for lean muscle definition and low carb diets.',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=600',
    category: 'Protein',
    inStock: true
  },
  {
    id: 'p6',
    name: 'Extreme Pump Pre-Workout (Stim-Free)',
    price: 2199,
    description: 'Caffeine-free vasodilator pre-workout. Designed for maximum nitric oxide boost, skin-tearing pumps, and hyper-hydration.',
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=600',
    category: 'Pre-workout',
    inStock: true
  },
  {
    id: 'p7',
    name: 'Creapure® Gold Creatine Monohydrate',
    price: 1599,
    description: 'World-renowned certified 100% pure Creapure® monohydrate made in Germany. Increases power, sprint performance, and muscle ATP.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
    category: 'Creatine',
    inStock: true,
    isTrending: true
  },
  {
    id: 'p8',
    name: 'Premium Hydrolyzed Whey Protein',
    price: 5499,
    description: 'Lightning-fast absorption with enzymatically pre-digested hydrolyzed whey protein. Zero bloating, instant recovery, 28g pure protein.',
    image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&q=80&w=600',
    category: 'Protein',
    inStock: true,
    isTrending: true
  },
  {
    id: 'p9',
    name: 'Anabolic Mass Gainer Pro',
    price: 4999,
    description: 'Pro-level bulk builder with premium multi-phase protein source, creatine, and digestive enzymes for high efficiency calorie synthesis.',
    image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=600',
    category: 'Mass Gainer',
    inStock: true
  },
  // Gym Equipment Products
  {
    id: 'p10',
    name: 'Heavy-Duty Adjustable Hex Dumbbells (Pair)',
    price: 6999,
    description: 'Premium textured iron dumbbells with custom secure-grip knurled chrome handles. Ideal for full-body strength and hypertrophy training.',
    image: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&q=80&w=600',
    category: 'Gym Equipment',
    inStock: true,
    isTrending: true
  },
  {
    id: 'p11',
    name: 'Pro Russian Iron Kettlebell (16 KG)',
    price: 2499,
    description: 'Single piece solid cast iron kettlebell with wide textured handle. Flat base design prevents wobbling during floor exercises.',
    image: 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?auto=format&fit=crop&q=80&w=600',
    category: 'Gym Equipment',
    inStock: true
  },
  {
    id: 'p12',
    name: 'Elastic Resistance Loop Bands (5-Pack)',
    price: 599,
    description: 'Heavy duty natural latex loop bands ranging from Light to XX-Heavy. Complete with mesh bag and home guide booklet.',
    image: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&q=80&w=600',
    category: 'Gym Equipment',
    inStock: true
  },
  // Accessories Products
  {
    id: 'p13',
    name: 'Double-Layer Premium Gym Yoga Mat',
    price: 1199,
    description: 'High-density, non-slip 6mm TPE dual-color fitness mat. Provides extreme joint protection and stable grip for high impact workouts.',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=600',
    category: 'Accessories',
    inStock: true
  },
  {
    id: 'p14',
    name: 'Pro Gym Leather Powerlifting Belt',
    price: 1999,
    description: 'Full-grain genuine double-prong steel buckle leather weightlifting belt (4-inch width). Offers unparalleled lumbar and abdominal support.',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=600',
    category: 'Accessories',
    inStock: true,
    isTrending: true
  },
  {
    id: 'p15',
    name: 'Leakproof Stainless Steel Gym Shaker',
    price: 799,
    description: 'Double-wall vacuum-insulated stainless steel shaker. Keeps protein shakes ice-cold for 24 hours. Includes premium blender ball.',
    image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=600',
    category: 'Accessories',
    inStock: true
  }
];
