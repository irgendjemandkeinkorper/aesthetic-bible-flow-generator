import { AestheticBible } from '../types';

export const INITIAL_PRESETS: AestheticBible[] = [
  {
    id: 'aether-clockwork-alchemy',
    title: 'Aetherial Clockwork Alchemy',
    tagline: 'Gothic industrialism fueled by luminous celestial ether and sacred brass geometry',
    genre: 'Clockwork / Dieselpunk Alchemy',
    subgenre: 'Celestial Gothic Steampunk',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
    philosophyAnchors: [
      'Transmutation of Machine and Soul',
      'Sacred Geometry vs Entropy',
      'The Burdens of Forbidden Alchemy',
      'Celestial Mechanics as Divine Law'
    ],
    fineTuning: {
      density: 8,
      contrast: 9,
      eraBlend: 'Victorian Industrial + Byzantine Mysticism',
      saturation: 6,
      philosophicalDepth: 9
    },
    manifesto: {
      coreThesis: 'In a world where alchemy replaced steam, physical apparatuses are sacred temples where brass gears channel blue celestial ether to transcend mortal limits.',
      visualPhilosophy: 'High-contrast darkness pierced by electric cobalt ether conduits. Heavy tarnished brass frame, filigree filleting, and astrological gear-trains.',
      emotionalCadence: 'Solemn reverence mixing with frantic mechanical tension and awe-inspiring arcane power.',
      keyVisualMetaphors: [
        'Ether conduits pulsing like glowing blue arteries through blackened brass',
        'Astral clockwork dials tracking cosmic alignments in real-time',
        'Heavy velvet draped over rusted iron smelting vats'
      ],
      doList: [
        'Enforce 45-degree hand-engraved chamfers on brass framing',
        'Use tarnished brass, dark obsidian glass, and radiant cyan ether glow',
        'Incorporate astrological runes and gear teeth ratios into architecture'
      ],
      dontList: [
        'NEVER use bright modern plastics, rubber hoses, or flat digital screens',
        'Do NOT use clean chrome or smooth futuristic curves',
        'Avoid random decorative gears that have no apparent mechanical drive'
      ]
    },
    colorSystem: {
      primary: { name: 'Tarnished Clockwork Brass', hex: '#B8860B', usage: 'Structural framing, ornate armor filigree, gear housings' },
      secondary: { name: 'Deep Obsidian Iron', hex: '#1C1917', usage: 'Background surfaces, heavy machinery chassis, dark walls' },
      accent: { name: 'Radiant Celestial Ether', hex: '#00F0FF', usage: 'Energy conduits, magical glyphs, HUD power gauges' },
      neutralDark: { name: 'Smoked Velvet Shadow', hex: '#0C0A09', usage: 'Deep background shadows, unlit interior voids' },
      neutralLight: { name: 'Aged Parchment Gold', hex: '#F5E6C8', usage: 'Typography, parchment blueprints, UI icons' },
      specularGlow: { name: 'Ether Corona Blue', hex: '#38BDF8', usage: 'Particle highlights, alchemy crucible glow' },
      paletteNotes: 'Low neutral saturation with extreme specular intensity where celestial ether flows through brass piping.'
    },
    typographySystem: {
      displayFont: { name: 'Cinzel Decorative', category: 'Serif / Classical', usage: 'Main Title, Chapter Headings, Relic Names' },
      headingFont: { name: 'Cinzel', category: 'Serif / Engraved', usage: 'Section Headers, Item Stats Title, HUD Category' },
      bodyFont: { name: 'EB Garamond', category: 'Serif / Book', usage: 'Lore Entries, Dialogue Boxes, Recipe Codex' },
      monoFont: { name: 'Courier Prime', category: 'Monospace / Typewriter', usage: 'Alchemical Ratios, Gear Teeth Counts, Coordinates' },
      hierarchyRules: [
        'All major headers must be uppercase with expanded letter-spacing (0.15em)',
        'Body text uses warm aged-parchment tint (#F5E6C8)',
        'Alchemical formula callouts use monospaced text wrapped in brackets'
      ]
    },
    shapeAndForm: {
      dominantGeometry: 'Concentric brass gears, octagonal alchemy seals, and heavy vertical pillars',
      silhouetteStyle: 'Rigid mechanical silhouettes broken by flowing scholar robes and ether pipes',
      materialAndTextures: [
        'Verdigris Tarnished Brass',
        'Forged Blackened Iron',
        'Cobalt Luminous Fluid',
        'Hand-Bound Calfskin Leather',
        'Smoked Beveled Glass'
      ],
      gritAndWeathering: 'Oil stains around gear pivots, subtle verdigris oxidation on brass edges, heat discoloration on crucible rims.'
    },
    interfaceAndHUD: {
      diegeticType: 'Ornate Tactile Analog',
      layoutDensity: 'Ornate & Layered',
      tactileAudioTone: 'Heavy brass clicks, escaping steam hiss, resonant crystal hum, gear ratchet ticks',
      motionGuidelines: 'Mechanical gear rotation spring-delays; gauges needle-shake under pressure before locking into place.'
    },
    moodBoard: [
      {
        id: 'mb-1',
        title: 'The Great Celestial Clockwork Crucible',
        category: 'Environment',
        description: 'A cathedral-sized alchemy workshop featuring a multi-story rotating brass astrolabe above a deep blue ether pit.',
        promptSpec: 'A cathedral alchemical workshop, huge rotating brass astrolabe gears ceiling, radiant glowing blue ether pit below, tarnished brass, dark gothic architecture, cinematic lighting, photorealistic octane render, 8k',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        philosophyTag: 'Sacred Geometry vs Entropy',
        materialTags: ['Brass', 'Glowing Ether', 'Dark Stone'],
        lightingProfile: 'Volumetric cyan ether rays breaking through dark gothic arched windows',
        focalPoint: 'The central luminous alchemy core and gigantic interlocking gear astrolabe',
        pinned: true
      },
      {
        id: 'mb-2',
        title: 'Aetheric Alchemist Armor Spec',
        category: 'Character',
        description: 'Heavy brass plate armor with glass ether vials strapped to the chest and a gilded bird-beak plague mask with glowing blue eye lenses.',
        promptSpec: 'Fantasy brass plague doctor armor, glowing cyan ether glass tubes, intricate filigree engravings, dark leather coat, brass mechanical gauntlets, cinematic lighting, concept art',
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
        philosophyTag: 'Transmutation of Machine and Soul',
        materialTags: ['Tarnished Brass', 'Leather', 'Cyan Glass'],
        lightingProfile: 'Chiaroscuro rim light from cyan ether chest vials',
        focalPoint: 'The gilded bird-beak plague helmet with glowing blue eyes',
        pinned: true
      },
      {
        id: 'mb-3',
        title: 'Tactile Astrolabe UI Gauge',
        category: 'UI/HUD',
        description: 'Diegetic HUD element showing vessel pressure, celestial alignment gear ratios, and ether purity percentage.',
        promptSpec: 'Ornate brass astrolabe gauge interface, golden gear dials, cyan glowing liquid meter, parchment background, game UI layout, vector precision',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
        philosophyTag: 'Sacred Geometry vs Entropy',
        materialTags: ['Engraved Brass', 'Parchment', 'Glass'],
        lightingProfile: 'Soft parchment backlit with sharp metallic glints',
        focalPoint: 'Central pressure needle pointing to volatile celestial zone'
      },
      {
        id: 'mb-4',
        title: 'Grand Cathedral Smelting Forge',
        category: 'Architecture',
        description: 'High vaulted gothic arches with brass-trimmed furnace chimneys discharging blue ether sparks into the night.',
        promptSpec: 'Gothic industrial cathedral architecture, massive brass chimney vents, blue ether sparks rising into night sky, photorealistic matte painting',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        philosophyTag: 'The Burdens of Forbidden Alchemy',
        materialTags: ['Blackened Iron', 'Stained Glass', 'Ether Flame'],
        lightingProfile: 'High-contrast orange furnace flame vs deep night sky and cyan spark rain',
        focalPoint: 'Vaulted archway framing the central smoke stack'
      }
    ]
  },
  {
    id: 'suborbital-brutalism',
    title: 'Sub-Orbital Monolithic Brutalism',
    tagline: 'Raw concrete mega-structures in low earth orbit with retro-analog phosphor UI and bleak existential telemetry',
    genre: 'Brutalist Space Opera',
    subgenre: 'Cold War Cassette Space Opera',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
    philosophyAnchors: [
      'The Indifference of the Cosmos',
      'Monolithic Permanence vs Mortal Fragility',
      'Functionalist Utility without Ornament',
      'Analogue Telemetry in Deep Silence'
    ],
    fineTuning: {
      density: 5,
      contrast: 10,
      eraBlend: '1970s Soviet Space Program + Monolithic Brutalist Architecture',
      saturation: 3,
      philosophicalDepth: 10
    },
    manifesto: {
      coreThesis: 'Space is not bright or sleek; it is a freezing void surrounding gargantuan poured-concrete orbital habitats powered by heavy nuclear cores and monitored by amber CRT screens.',
      visualPhilosophy: 'Severe, unadorned gray concrete blocks, massive hydraulic hatches, yellow hazard striping, and monochrome amber/green phosphor raster lines.',
      emotionalCadence: 'Claustrophobic isolation, solemn industrial scale, heavy mechanical weight, and quiet utilitarian resolve.',
      keyVisualMetaphors: [
        'Miles of unpainted grey concrete reinforced with rust-stained iron rebar in vacuum',
        'Thick leaded glass viewports showing Earth far below',
        'Heavy mechanical toggle switches that lock with a violent pneumatic thud'
      ],
      doList: [
        'Enforce 90-degree blocky monolithic masses with massive chamfered supports',
        'Use industrial safety yellow, dark basalt gray, and monochrome amber CRT phosphorus',
        'Expose heavy bolts, cable conduits, and pneumatic piston assemblies'
      ],
      dontList: [
        'NEVER use smooth white rounded futuristic shapes (no sci-fi "iPhone aesthetics")',
        'Do NOT add decorative neon LED strips or glowing floating holograms',
        'Avoid fancy curves, delicate glass, or decorative flourishes'
      ]
    },
    colorSystem: {
      primary: { name: 'Basalt Concrete Gray', hex: '#3B3C36', usage: 'Main habitat hulls, monolithic corridors, structural beams' },
      secondary: { name: 'Industrial Safety Amber', hex: '#F59E0B', usage: 'CRT monitors, caution warnings, airlock seals' },
      accent: { name: 'Hazard Radiation Yellow', hex: '#EAB308', usage: 'Airlock frames, warning stencils, heavy crane hooks' },
      neutralDark: { name: 'Vacuum Void Black', hex: '#090A0C', usage: 'Deep space sky, dark corridor unlit voids' },
      neutralLight: { name: 'Weathered Concrete Ash', hex: '#9CA3AF', usage: 'Technical labels, stamped text, structural highlights' },
      specularGlow: { name: 'Phosphor Green Raster', hex: '#22C55E', usage: 'Radar sweeps, terminal text, life-support telemetry' },
      paletteNotes: 'Desaturated monochrome base punctuated strictly by high-contrast safety amber and green CRT phosphors.'
    },
    typographySystem: {
      displayFont: { name: 'Space Mono', category: 'Monospace / Block', usage: 'Station Identifiers, Deck Codes, Warning Alerts' },
      headingFont: { name: 'JetBrains Mono', category: 'Monospace / Technical', usage: 'System Modules, Telemetry Headers, Diagnostic Titles' },
      bodyFont: { name: 'Chakra Petch', category: 'Sans-Serif / Industrial', usage: 'Technical Manuals, Crew Logs, System Telemetry' },
      monoFont: { name: 'VT323', category: 'Pixel / CRT Raster', usage: 'CRT Screen Terminals, Command Prompt Input' },
      hierarchyRules: [
        'All UI text must look stamped or rasterized on a CRT monitor screen',
        'Use strictly uppercase monospaced block text for all station structural tags',
        'Include serial numbers and grid coordinates alongside every UI module title'
      ]
    },
    shapeAndForm: {
      dominantGeometry: 'Heavy 90-degree concrete cubes, thick chamfered buttresses, circular pressure hatches',
      silhouetteStyle: 'Imposing, blocky, monolithic silhouettes that resemble upside-down mountain ranges in orbit',
      materialAndTextures: [
        'Board-Formed Poured Concrete',
        'Cold-Rolled Cast Iron',
        'Aged Yellow Industrial Enamel Paint',
        'Curved Thick Leaded Glass',
        'Coarse Rubber Airlock Gaskets'
      ],
      gritAndWeathering: 'Micrometeorite pitting on concrete hulls, rust trails down rebar joints, scuffed safety paint near hatches.'
    },
    interfaceAndHUD: {
      diegeticType: 'Minimalist Holo-Wireframe',
      layoutDensity: 'Dense Tactical Data',
      tactileAudioTone: 'Heavy pneumatic airlock hiss, clunky solenoid relays, low 60Hz transformer hum, static crackle',
      motionGuidelines: 'Instantaneous blocky screen refreshes with line-by-line CRT scanline updates; no smooth spring interpolations.'
    },
    moodBoard: [
      {
        id: 'mb-sb-1',
        title: 'The Orbital Monolith Core',
        category: 'Architecture',
        description: 'A 2-kilometer concrete space station orbiting above a cloud-shrouded earth with massive nuclear radiator fins.',
        promptSpec: 'Brutalist concrete space station in Earth orbit, massive raw concrete monoliths, 1970s soviet space aesthetic, harsh sunlight, pitch black space, hyperrealistic photography, 8k',
        imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
        philosophyTag: 'The Indifference of the Cosmos',
        materialTags: ['Concrete', 'Steel', 'Solar Panels'],
        lightingProfile: 'Unfiltered high-contrast space sunlight casting stark black shadows',
        focalPoint: 'The central poured-concrete docking spire',
        pinned: true
      },
      {
        id: 'mb-sb-2',
        title: 'Amber CRT Command Console',
        category: 'UI/HUD',
        description: 'Tactile control panel with heavy rotary knobs, physical circuit breakers, and an glowing amber raster screen showing orbital trajectories.',
        promptSpec: '1970s spacecraft control console, amber CRT monitor displaying orbital trajectory grid, heavy toggle switches, worn gray painted metal, retro industrial UI, macro photography',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        philosophyTag: 'Analogue Telemetry in Deep Silence',
        materialTags: ['Amber Glass', 'Stamped Metal', 'Bakelite Switches'],
        lightingProfile: 'Glow from amber CRT phosphors illuminating physical switches in a dark cabin',
        focalPoint: 'The radar sweep line on the CRT display'
      }
    ]
  },
  {
    id: 'cyber-zen-shinto',
    title: 'Cyber-Zen Shinto Technocracy',
    tagline: 'Neon-infused cybernetics meets sacred torii shrines, rain-soaked obsidian stone, and spirit-AI animism',
    genre: 'Cyber-Zen Shinto',
    subgenre: 'Neon Animist Cyberpunk',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
    philosophyAnchors: [
      'Digital Animism: Every AI Has a Kami',
      'The Sacred in High-Tech Automation',
      'Harmony between Silicon and Moss',
      'Impermanence in the Fiber-Optic Rain'
    ],
    fineTuning: {
      density: 7,
      contrast: 8,
      eraBlend: 'Heian Dynasty Shinto + 2099 Quantum Cyberpunk',
      saturation: 8,
      philosophicalDepth: 9
    },
    manifesto: {
      coreThesis: 'In Neo-Kyoto, neural networks are revered as digital spirits (Kami). Fiber-optic torii gates frame liquid nitrogen cooling rivers where cybernetic priestesses tend to server shrines.',
      visualPhilosophy: 'Wet obsidian stone reflections, vermilion red torii arches with embedded fiber-optic nodes, misty ambient rain, and translucent holographic shoji screens.',
      emotionalCadence: 'Serene contemplative silence pierced by hum of high-voltage server racks and rain on bamboo water fountains.',
      keyVisualMetaphors: [
        'Vermilion red torii gates laced with optical fiber cables glowing soft magenta',
        'Zen rock gardens where robotic rake arms carve microchip-trace patterns into white sand',
        'Holographic koi fish swimming through rain-streaked dark alleys'
      ],
      doList: [
        'Contrast vermilion red and obsidian black with glowing cyan and soft Sakura pink highlights',
        'Incorporate natural elements (moss, bamboo, bonsai) directly into server hardware',
        'Use translucent shoji lattice patterns for all UI containers and menus'
      ],
      dontList: [
        'Do NOT make it look like a generic Western industrial cyberpunk slum',
        'Avoid random western graffiti or messy rusted scrap metal',
        'Never use harsh yellow halogen lights or dirty industrial sludge'
      ]
    },
    colorSystem: {
      primary: { name: 'Sacred Torii Vermilion', hex: '#E63946', usage: 'Shrine arches, primary accent lines, high-status UI highlights' },
      secondary: { name: 'Wet Rain-Obsidian', hex: '#121216', usage: 'Ground stone, dark armor surfaces, background canvas' },
      accent: { name: 'Sakura Fiber-Optic Pink', hex: '#FF75A0', usage: 'Holographic koi, neural pulse indicators, magical seals' },
      neutralDark: { name: 'Midnight Temple Indigo', hex: '#0D0E15', usage: 'Deep background space, shadowed rooftops' },
      neutralLight: { name: 'Rice-Paper Cream', hex: '#F8F9FA', usage: 'UI text background, shoji screen fills, text color' },
      specularGlow: { name: 'Cyan Kami Glow', hex: '#00F5D4', usage: 'Spirit AI avatars, water reflections, active spell nodes' },
      paletteNotes: 'High saturation vermilion and cyan contrasting sharply against glossy rain-soaked midnight darks.'
    },
    typographySystem: {
      displayFont: { name: 'Sora', category: 'Sans-Serif / Modern', usage: 'Game Title, Shrine Names, Character Titles' },
      headingFont: { name: 'Plus Jakarta Sans', category: 'Sans-Serif / Clean', usage: 'Menu Headers, Quest Titles, Stat Labels' },
      bodyFont: { name: 'Inter', category: 'Sans-Serif / Legible', usage: 'Dialogue, Shrine Records, Item Descriptions' },
      monoFont: { name: 'Fira Code', category: 'Monospace / Code', usage: 'Spirit Code Runes, Server Telemetry, Neural Data' },
      hierarchyRules: [
        'Shoji lattice background frames for text boxes with 1px vermilion borders',
        'Use vertical text layout support for ceremonial Japanese headings where appropriate',
        'Interactive buttons shimmer with a soft sakura-pink particle trail on hover'
      ]
    },
    shapeAndForm: {
      dominantGeometry: 'Slanted pagodas, rectangular shoji lattices, sweeping torii curve roofs',
      silhouetteStyle: 'Elegant ceremonial robes over sleek carbon-fiber cyber-prosthetics',
      materialAndTextures: [
        'Polished Wet Obsidian Stone',
        'Vermilion Lacquered Bamboo',
        'Translucent Holographic Shoji Paper',
        'Matte White Ceramic Armor',
        'Braided Silk Power Cables'
      ],
      gritAndWeathering: 'Rainwater droplets trickling down lacquered armor, subtle green moss creeping over server vents.'
    },
    interfaceAndHUD: {
      diegeticType: 'Biomechanical Neural HUD',
      layoutDensity: 'Sparse & Cinematic',
      tactileAudioTone: 'Soft bamboo fountain clack (shishi-odoshi), high-frequency quantum crystal ring, gentle rain rustle',
      motionGuidelines: 'Smooth fluid ripple transitions inspired by water drops landing on dark ink.'
    },
    moodBoard: [
      {
        id: 'mb-cz-1',
        title: 'Fiber-Optic Torii Server Shrine',
        category: 'Architecture',
        description: 'A traditional red torii gate entwined with glowing neon blue fiber-optic cables leading to a high-tech quantum server shrine.',
        promptSpec: 'Cyberpunk Shinto temple shrine, vermilion torii gate with glowing cyan fiber optic cables, rain soaked obsidian stone, glowing pink sakura holograms, photorealistic 8k',
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
        philosophyTag: 'Digital Animism: Every AI Has a Kami',
        materialTags: ['Lacquered Wood', 'Fiber Optics', 'Obsidian Stone'],
        lightingProfile: 'Neon vermilion reflection on rain-drenched black stone courtyard',
        focalPoint: 'The glowing cyan spirit altar inside the shrine',
        pinned: true
      },
      {
        id: 'mb-cz-2',
        title: 'Cyber-Miko Priestess Armor',
        category: 'Character',
        description: 'Lacquered red and white armor over a sleek neural body suit with a translucent holographic Fox (Kitsune) mask visor.',
        promptSpec: 'Cyberpunk Shinto priestess miko, white ceramic and vermilion lacquered armor, holographic kitsune mask visor, futuristic katana, rain soaked street background, concept art',
        imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
        philosophyTag: 'Harmony between Silicon and Moss',
        materialTags: ['Ceramic', 'Lacquered Plate', 'Hologram'],
        lightingProfile: 'Soft cyan glow from visor illuminating white ceramic cheek plates',
        focalPoint: 'The Kitsune hologram mask eyes'
      }
    ]
  }
];
