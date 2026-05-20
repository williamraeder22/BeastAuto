// ─── PartFind Database (db.js) ────────────────────────────────────────────────
//
// Flat-file "database" using plain JS objects + localStorage for persistence.
// In production replace with a real backend (Node/Express + PostgreSQL, Firebase, etc.)
// and NEVER store passwords in plaintext — use bcrypt or similar.
//
// Module order matters:
//   1. DB_DEFAULTS + persistence helpers (_loadDB, saveDB, resetDB, DB)
//   2. Inventory  ← defined before Admin so Admin.addPart can call it
//   3. Admin
//   4. Auth
//   5. Checkout
// ─────────────────────────────────────────────────────────────────────────────

const DB_DEFAULTS = {
    users: [
        {
            id: "u001",
            username: "jsmith",
            password: "pass1234",
            role: "user",
            displayName: "John Smith",
            email: "j.smith@example.com",
            availableDeliveryDates: ["2026-05-12","2026-05-15","2026-05-19","2026-05-22","2026-05-26"],
            orderHistory: [],
            serviceFolders: [
                {
                    folderName: "Hames",
                    customerNumber: "853934",
                    cart: [
                        { partNumber: "TY-8821-BRK", partName: "Brake Pad Set",  description: "Front Brake Pad Set — Ceramic", price: 49.99, qty: 2, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop" },
                        { partNumber: "TY-0192-SPK", partName: "Spark Plugs",    description: "Iridium Spark Plug (qty 4)",    price: 34.50, qty: 1, imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&auto=format&fit=crop" }
                    ],
                    parts: [
                        { partNumber: "TY-8821-BRK", partName: "Brake Pad Set",   description: "Front Brake Pad Set — Ceramic",    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 49.99, stock: 12, make: "Toyota", model: "Camry", year: "2022" },
                        { partNumber: "TY-3301-FLT", partName: "Oil Filter",      description: "Engine Oil Filter — Extended Life", imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 12.99, stock: 8, make: "Toyota", model: "Camry", year: "2022" },
                        { partNumber: "TY-0192-SPK", partName: "Spark Plugs",     description: "Iridium Spark Plug (qty 4)",        imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&auto=format&fit=crop", price: 34.50, stock: 20, make: "Toyota", model: "Camry", year: "2022" }
                    ]
                },
                {
                    folderName: "Rivera",
                    customerNumber: "291047",
                    cart: [],
                    parts: [
                        { partNumber: "HN-4410-ALT", partName: "Alternator",      description: "Alternator — Remanufactured OEM",   imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 189.00, stock: 4, make: "Honda", model: "Accord", year: "2021" },
                        { partNumber: "HN-0055-BLT", partName: "Serpentine Belt", description: "Serpentine Drive Belt",             imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&auto=format&fit=crop", price: 22.75,  stock: 15, make: "Honda", model: "Accord", year: "2021" }
                    ]
                }
            ]
        },
        {
            id: "u002",
            username: "mchen",
            password: "secure99",
            role: "user",
            displayName: "Maya Chen",
            email: "m.chen@example.com",
            availableDeliveryDates: ["2026-05-14","2026-05-20","2026-05-28"],
            orderHistory: [],
            serviceFolders: [
                {
                    folderName: "Chen",
                    customerNumber: "774512",
                    cart: [],
                    parts: [
                        { partNumber: "BM-7755-SUS", partName: "Strut Assembly",  description: "Front Strut Assembly — Left",       imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 210.00, stock: 2, make: "BMW", model: "3 Series", year: "2020" }
                    ]
                }
            ]
        },
        {
            id: "a001",
            username: "admin",
            password: "admin2025",
            role: "admin",
            displayName: "Site Administrator",
            email: "admin@partfind.com",
            availableDeliveryDates: [],
            orderHistory: [],
            serviceFolders: []
        }
    ],

    vehicles: {
        "Lexus":      { models: ["IS","ES","GS","LS","UX","NX","RX","GX","LX","LC","RC"],                   image: "https://images.unsplash.com/photo-1619767886558-efdc259b6e09?w=800&auto=format&fit=crop" },
        "Tesla":      { models: ["Model 3","Model S","Model X","Model Y","Cybertruck","Roadster"],            image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop" },
        "Porsche":    { models: ["911","718 Cayman","718 Boxster","Taycan","Panamera","Macan","Cayenne"],    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop" },
        "Toyota":     { models: ["Camry","Corolla","RAV4","Tacoma","Tundra","Highlander","4Runner","Prius","Supra"], image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop" },
        "Honda":      { models: ["Civic","Accord","CR-V","Pilot","Odyssey","Ridgeline","HR-V","Passport"],   image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&auto=format&fit=crop" },
        "BMW":        { models: ["3 Series","5 Series","7 Series","X1","X3","X5","X7","M3","M5","i3","i8"], image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop" },
        "Mercedes":   { models: ["C-Class","E-Class","S-Class","GLA","GLC","GLE","GLS","AMG GT"],            image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop" },
        "Audi":       { models: ["A3","A4","A6","A8","Q3","Q5","Q7","Q8","e-tron","R8"],                     image: "https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?w=800&auto=format&fit=crop" },
        "Nissan":     { models: ["Altima","Sentra","Maxima","Rogue","Pathfinder","Frontier","Titan","370Z","GT-R"], image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&auto=format&fit=crop" },
        "Hyundai":    { models: ["Elantra","Sonata","Tucson","Santa Fe","Palisade","Kona","Ioniq 5"],         image: "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&auto=format&fit=crop" },
        "Kia":        { models: ["Forte","K5","Stinger","Sportage","Sorento","Telluride","Soul","EV6"],       image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&auto=format&fit=crop" },
        "Land Rover": { models: ["Range Rover","Range Rover Sport","Evoque","Velar","Discovery","Defender"],  image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop" },
        "Jaguar":     { models: ["XE","XF","XJ","E-Pace","F-Pace","I-Pace","F-Type"],                        image: "https://images.unsplash.com/photo-1547744152-14d985cb937f?w=800&auto=format&fit=crop" }
    },

    // Global Inventory: indexed as { [make]: { [model]: { [year]: Part[] } } }
    // Pre-seeded with 20 test parts across multiple makes/models for development.
    globalInventory: {
        "Toyota": {
            "Camry": {
                "2022": [
                    { partNumber: "TY-8821-BRK", partName: "Brake Pad Set",         description: "Front Brake Pad Set — Ceramic",                imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 49.99, stock: 12, make: "Toyota", model: "Camry", year: "2022" },
                    { partNumber: "TY-3301-FLT", partName: "Oil Filter",             description: "Engine Oil Filter — Extended Life",             imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 12.99, stock: 30, make: "Toyota", model: "Camry", year: "2022" },
                    { partNumber: "TY-0192-SPK", partName: "Spark Plugs",            description: "Iridium Spark Plug Set (qty 4)",                imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&auto=format&fit=crop", price: 34.50, stock: 20, make: "Toyota", model: "Camry", year: "2022" },
                    { partNumber: "TY-2201-WPR", partName: "Wiper Blades",           description: "OEM Front Wiper Blade Set",                     imageUrl: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400&auto=format&fit=crop", price: 28.00, stock: 15, make: "Toyota", model: "Camry", year: "2022" }
                ]
            },
            "Corolla": {
                "2021": [
                    { partNumber: "TY-5501-THR", partName: "Throttle Body",          description: "Electronic Throttle Body Assembly",             imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 145.00, stock: 5, make: "Toyota", model: "Corolla", year: "2021" },
                    { partNumber: "TY-4410-CAB", partName: "Cabin Air Filter",       description: "HEPA Cabin Air Filter",                         imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 18.50, stock: 25, make: "Toyota", model: "Corolla", year: "2021" }
                ]
            }
        },
        "Honda": {
            "Accord": {
                "2021": [
                    { partNumber: "HN-4410-ALT", partName: "Alternator",             description: "Alternator — Remanufactured OEM",               imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 189.00, stock: 4, make: "Honda", model: "Accord", year: "2021" },
                    { partNumber: "HN-0055-BLT", partName: "Serpentine Belt",        description: "Serpentine Drive Belt",                         imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&auto=format&fit=crop", price: 22.75,  stock: 18, make: "Honda", model: "Accord", year: "2021" },
                    { partNumber: "HN-3302-RAD", partName: "Radiator",               description: "Aluminum Radiator Assembly",                    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 220.00, stock: 3, make: "Honda", model: "Accord", year: "2021" }
                ]
            },
            "Civic": {
                "2023": [
                    { partNumber: "HN-1100-STR", partName: "Starter Motor",          description: "Starter Motor — Remanufactured",                imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 135.00, stock: 6, make: "Honda", model: "Civic", year: "2023" },
                    { partNumber: "HN-7700-CVJ", partName: "CV Joint Boot Kit",      description: "Inner and Outer CV Boot Kit",                   imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 44.99, stock: 9, make: "Honda", model: "Civic", year: "2023" }
                ]
            }
        },
        "BMW": {
            "3 Series": {
                "2020": [
                    { partNumber: "BM-7755-SUS", partName: "Front Strut Assembly",   description: "Front Strut Assembly — Left",                   imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 210.00, stock: 2, make: "BMW", model: "3 Series", year: "2020" },
                    { partNumber: "BM-2200-COL", partName: "Ignition Coil",          description: "Ignition Coil Pack — Set of 6",                 imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&auto=format&fit=crop", price: 88.00, stock: 7, make: "BMW", model: "3 Series", year: "2020" }
                ]
            },
            "5 Series": {
                "2021": [
                    { partNumber: "BM-5501-TRQ", partName: "Torque Converter",       description: "Automatic Transmission Torque Converter",      imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 395.00, stock: 2, make: "BMW", model: "5 Series", year: "2021" }
                ]
            }
        },
        "Mercedes": {
            "C-Class": {
                "2022": [
                    { partNumber: "MB-8810-ABS", partName: "ABS Sensor",             description: "Front ABS Wheel Speed Sensor",                  imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 62.00, stock: 11, make: "Mercedes", model: "C-Class", year: "2022" },
                    { partNumber: "MB-4400-FPM", partName: "Fuel Pump Module",       description: "In-Tank Fuel Pump and Sender Assembly",         imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 178.00, stock: 4, make: "Mercedes", model: "C-Class", year: "2022" }
                ]
            }
        },
        "Nissan": {
            "Altima": {
                "2020": [
                    { partNumber: "NS-3300-CVT", partName: "CVT Filter Kit",         description: "CVT Transmission Service Kit",                  imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 55.00, stock: 8, make: "Nissan", model: "Altima", year: "2020" }
                ]
            }
        },
        "Hyundai": {
            "Elantra": {
                "2022": [
                    { partNumber: "HY-6600-ORG", partName: "Oxygen Sensor",          description: "Upstream O2 Sensor — Bank 1",                  imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&auto=format&fit=crop", price: 39.99, stock: 14, make: "Hyundai", model: "Elantra", year: "2022" },
                    { partNumber: "HY-1100-PCV", partName: "PCV Valve",              description: "PCV Valve with Grommet",                        imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 14.99, stock: 22, make: "Hyundai", model: "Elantra", year: "2022" }
                ]
            }
        }
    },

    // Transaction log
    transactions: [
        { orderId: "ORD-DEMO-001", userId: "u001", displayName: "John Smith", folderName: "Hames", customerNumber: "853934", total: 134.48, date: "2026-04-10", deliveryDate: "2026-04-15", itemCount: 3, status: "completed" }
    ],

    // Return requests: created by users, actioned by admin.
    returnRequests: []
};


// ─── Persistence ──────────────────────────────────────────────────────────────

function _loadDB() {
    try {
        const saved = localStorage.getItem('partfind_db');
        return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DB_DEFAULTS));
    } catch (e) {
        return JSON.parse(JSON.stringify(DB_DEFAULTS));
    }
}

function saveDB() {
    localStorage.setItem('partfind_db', JSON.stringify(DB));
}

// Wipe localStorage and reload — use the "Reset DB" button in the inventory panel during dev.
function resetDB() {
    localStorage.removeItem('partfind_db');
    location.reload();
}

const DB = _loadDB();


// ─── Inventory Module ─────────────────────────────────────────────────────────
// IMPORTANT: Defined BEFORE Admin so Admin.addPart() can safely call Inventory.addPart().
// Previously Inventory was defined after Admin, causing a ReferenceError at call time
// because const declarations are not hoisted — this was the root cause of the
// Global Inventory tab staying empty.

const Inventory = {

    // Write a part into the Make → Model → Year index.
    // Called automatically by Admin.addPart(); also used by _backfillInventory().
    // Silently skips duplicates (same partNumber in the same slot).
    addPart(make, model, year, part) {
        if (!make || !model || !year) return { ok: false, error: 'Make, Model, and Year are required.' };

        // Ensure DB.globalInventory exists (guard for very old localStorage saves)
        if (!DB.globalInventory) DB.globalInventory = {};

        const inv = DB.globalInventory;
        if (!inv[make])              inv[make] = {};
        if (!inv[make][model])       inv[make][model] = {};
        if (!inv[make][model][year]) inv[make][model][year] = [];

        const slot = inv[make][model][year];
        // Update existing entry rather than silently skipping, so edits propagate
        const existing = slot.findIndex(p => p.partNumber === part.partNumber);
        if (existing === -1) {
            slot.push({ ...part });
        } else {
            slot[existing] = { ...part };
        }
        return { ok: true };
    },

    // Return every Make/Model/Year slot as a flat array, sorted Make A-Z → Model A-Z → Year desc.
    getAll() {
        if (!DB.globalInventory) return [];
        const inv    = DB.globalInventory;
        const result = [];
        for (const make of Object.keys(inv).sort()) {
            for (const model of Object.keys(inv[make]).sort()) {
                const years = Object.keys(inv[make][model]).sort((a, b) => Number(b) - Number(a));
                for (const year of years) {
                    const parts = inv[make][model][year];
                    if (parts && parts.length > 0) {
                        result.push({ make, model, year, parts });
                    }
                }
            }
        }
        return result;
    },

    getMakes() {
        if (!DB.globalInventory) return [];
        return Object.keys(DB.globalInventory).sort();
    },

    getModels(make) {
        if (!DB.globalInventory || !make || !DB.globalInventory[make]) return [];
        return Object.keys(DB.globalInventory[make]).sort();
    },

    getYears(make, model) {
        const slot = DB.globalInventory?.[make]?.[model];
        return slot ? Object.keys(slot).sort((a, b) => Number(b) - Number(a)) : [];
    },

    getSlot(make, model, year) {
        return DB.globalInventory?.[make]?.[model]?.[year] || [];
    },

    totalParts() {
        if (!DB.globalInventory) return 0;
        let n = 0;
        for (const make of Object.values(DB.globalInventory))
            for (const model of Object.values(make))
                for (const year of Object.values(model))
                    n += year.length;
        return n;
    },

    // Return a flat list of every part across all slots — used by the search autofill.
    getAllFlat() {
        const result = [];
        for (const entry of this.getAll()) {
            for (const p of entry.parts) {
                result.push({ ...p, make: entry.make, model: entry.model, year: entry.year });
            }
        }
        return result;
    }
};


// ─── Backfill ─────────────────────────────────────────────────────────────────
// Scans every part in every folder across all users and ensures it is present
// in globalInventory. Runs once on page load after DB and Inventory are ready.
// This repairs inventory for parts that were added before the ordering bug was fixed,
// and also handles any future mismatch between folder parts and the index.
function _backfillInventory() {
    if (!DB.globalInventory) DB.globalInventory = {};
    let added = 0;
    for (const user of DB.users) {
        for (const folder of (user.serviceFolders || [])) {
            for (const part of (folder.parts || [])) {
                if (part.make && part.model && part.year) {
                    Inventory.addPart(part.make, part.model, part.year, part);
                    added++;
                }
            }
        }
    }
    if (added > 0) saveDB();
}

_backfillInventory();


// ─── Past Delivery Date Cleanup ───────────────────────────────────────────────
// Runs on every page load. Removes any delivery dates that are strictly before
// today from every user's availableDeliveryDates array so the admin never sees
// or accidentally re-uses stale dates.
function _purgePastDeliveryDates() {
    const today = new Date().toISOString().split('T')[0];
    let changed = false;
    for (const user of DB.users) {
        if (!Array.isArray(user.availableDeliveryDates)) continue;
        const before = user.availableDeliveryDates.length;
        user.availableDeliveryDates = user.availableDeliveryDates.filter(d => d >= today);
        if (user.availableDeliveryDates.length !== before) changed = true;
    }
    if (changed) saveDB();
}

_purgePastDeliveryDates();


// ─── Admin CRUD Module ────────────────────────────────────────────────────────

const Admin = {

    // Users
    getUsers() {
        return DB.users.filter(u => u.role === 'user');
    },

    getUserById(id) {
        return DB.users.find(u => u.id === id) || null;
    },

    addUser({ username, password, displayName }) {
        if (DB.users.find(u => u.username === username)) return { ok: false, error: 'Username already exists.' };
        const id = 'u' + Date.now();
        DB.users.push({ id, username, password, role: 'user', displayName, email: username + '@example.com', availableDeliveryDates: [], orderHistory: [], serviceFolders: [] });
        saveDB();
        return { ok: true, id };
    },

    deleteUser(userId) {
        const i = DB.users.findIndex(u => u.id === userId && u.role !== 'admin');
        if (i === -1) return false;
        DB.users.splice(i, 1);
        saveDB();
        return true;
    },

    // Service Folders
    getFolders(userId) {
        const user = this.getUserById(userId);
        return user ? user.serviceFolders : [];
    },

    addFolder(userId, { folderName, customerNumber }) {
        const user = this.getUserById(userId);
        if (!user) return { ok: false, error: 'User not found.' };
        if (user.serviceFolders.find(f => f.folderName === folderName)) return { ok: false, error: 'Folder name already exists for this user.' };
        user.serviceFolders.push({ folderName, customerNumber, cart: [], parts: [] });
        saveDB();
        return { ok: true };
    },

    deleteFolder(userId, folderName) {
        const user = this.getUserById(userId);
        if (!user) return false;
        const i = user.serviceFolders.findIndex(f => f.folderName === folderName);
        if (i === -1) return false;
        user.serviceFolders.splice(i, 1);
        saveDB();
        return true;
    },

    // Parts
    addPart(userId, folderName, part) {
        const user = this.getUserById(userId);
        if (!user) return { ok: false, error: 'User not found.' };
        const folder = user.serviceFolders.find(f => f.folderName === folderName);
        if (!folder) return { ok: false, error: 'Folder not found.' };
        if (folder.parts.find(p => p.partNumber === part.partNumber)) return { ok: false, error: 'Part # already exists in this folder.' };

        folder.parts.push(part);

        // Sync to global inventory — Inventory is now defined above Admin so this is safe
        if (part.make && part.model && part.year) {
            Inventory.addPart(part.make, part.model, part.year, part);
        }

        saveDB();
        return { ok: true };
    },

    deletePart(userId, folderName, partNumber) {
        const user = this.getUserById(userId);
        if (!user) return false;
        const folder = user.serviceFolders.find(f => f.folderName === folderName);
        if (!folder) return false;
        const i = folder.parts.findIndex(p => p.partNumber === partNumber);
        if (i === -1) return false;
        folder.parts.splice(i, 1);
        saveDB();
        return true;
    },

    // Cart (folder-scoped)
    getCart(userId, folderName) {
        const user = this.getUserById(userId);
        if (!user) return [];
        const folder = user.serviceFolders.find(f => f.folderName === folderName);
        return folder ? (folder.cart || []) : [];
    },

    setCart(userId, folderName, cartItems) {
        const user = this.getUserById(userId);
        if (!user) return false;
        const folder = user.serviceFolders.find(f => f.folderName === folderName);
        if (!folder) return false;
        folder.cart = cartItems;
        saveDB();
        return true;
    },

    clearCart(userId, folderName) {
        return this.setCart(userId, folderName, []);
    },

    removeCartItem(userId, folderName, partNumber) {
        const user = this.getUserById(userId);
        if (!user) return false;
        const folder = user.serviceFolders.find(f => f.folderName === folderName);
        if (!folder) return false;
        folder.cart = (folder.cart || []).filter(i => i.partNumber !== partNumber);
        saveDB();
        return true;
    },

    getTotalCartCount(userId) {
        const user = this.getUserById(userId);
        if (!user) return 0;
        return user.serviceFolders.reduce((total, folder) => {
            return total + (folder.cart || []).reduce((n, i) => n + i.qty, 0);
        }, 0);
    },

    // Delivery dates
    getDeliveryDates(userId) {
        const user = this.getUserById(userId);
        return user ? (user.availableDeliveryDates || []) : [];
    },

    setDeliveryDates(userId, dates) {
        const user = this.getUserById(userId);
        if (!user) return false;
        user.availableDeliveryDates = dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
        saveDB();
        return true;
    },

    addDeliveryDate(userId, date) {
        const user = this.getUserById(userId);
        if (!user) return false;
        if (!user.availableDeliveryDates) user.availableDeliveryDates = [];
        if (!user.availableDeliveryDates.includes(date)) {
            user.availableDeliveryDates.push(date);
            user.availableDeliveryDates.sort();
        }
        saveDB();
        return true;
    },

    removeDeliveryDate(userId, date) {
        const user = this.getUserById(userId);
        if (!user) return false;
        user.availableDeliveryDates = (user.availableDeliveryDates || []).filter(d => d !== date);
        saveDB();
        return true;
    },

    // Order history
    getOrderHistory(userId) {
        const user = this.getUserById(userId);
        return user ? (user.orderHistory || []) : [];
    },

    // Add a part directly to the global inventory (not tied to a folder).
    // Smart upsert: if the partNumber already exists anywhere in globalInventory,
    // increment its stock by `quantity` instead of creating a duplicate entry.
    addGlobalPart({ partNumber, make, model, year, partName, description, imageUrl, price, quantity }) {
        if (!partNumber || !make || !model)
            return { ok: false, error: 'Part #, Make, and Model are required.' };
        const resolvedYear = year || String(new Date().getFullYear());

        const qty = Math.max(1, parseInt(quantity) || 1);
        if (!DB.globalInventory) DB.globalInventory = {};
        const inv = DB.globalInventory;

        // Search all slots for an existing matching partNumber
        for (const mk of Object.keys(inv)) {
            for (const mo of Object.keys(inv[mk])) {
                for (const yr of Object.keys(inv[mk][mo])) {
                    const slot = inv[mk][mo][yr];
                    const idx  = slot.findIndex(p => p.partNumber === partNumber);
                    if (idx !== -1) {
                        slot[idx].stock = (slot[idx].stock || 0) + qty;
                        saveDB();
                        return { ok: true, upserted: true };
                    }
                }
            }
        }

        // Not found — create a new entry in the specified slot
        const newPart = {
            partNumber,
            partName:    partName || '',
            description: description || '',
            imageUrl:    imageUrl  || '',
            price:       parseFloat(price) || 0,
            stock:       qty,
            make, model, year: resolvedYear
        };
        const result = Inventory.addPart(make, model, resolvedYear, newPart);
        if (!result.ok) return result;
        saveDB();
        return { ok: true, upserted: false };
    }
};


// ─── Auth Module ──────────────────────────────────────────────────────────────

const Auth = {

    login(username, password) {
        const user = DB.users.find(u => u.username === username && u.password === password);
        if (!user) return null;
        const session = { id: user.id, username: user.username, displayName: user.displayName, role: user.role };
        sessionStorage.setItem('partfind_session', JSON.stringify(session));
        return session;
    },

    logout() {
        sessionStorage.removeItem('partfind_session');
        window.location.href = 'login.html';
    },

    getSession() {
        const raw = sessionStorage.getItem('partfind_session');
        return raw ? JSON.parse(raw) : null;
    },

    requireAuth(requiredRole = null) {
        const session = this.getSession();
        if (!session) { window.location.href = 'login.html'; return null; }
        if (requiredRole && session.role !== requiredRole) { this.redirectByRole(session.role); return null; }
        return session;
    },

    redirectByRole(role) {
        window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'recommended-parts.html';
    },

    getUserFolders() {
        const session = this.getSession();
        if (!session) return [];
        const user = DB.users.find(u => u.id === session.id);
        return user ? user.serviceFolders : [];
    },

    getAllUsers() {
        return DB.users.map(({ password, ...safe }) => safe);
    }
};


// ─── Checkout Module ──────────────────────────────────────────────────────────

const Checkout = {

    generateOrderId() {
        const ts   = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ORD-${ts}-${rand}`;
    },

    async processPayment({ total, cardToken, method }) {
        // Test mode: the Stripe test card number bypasses the simulated delay
        // and immediately returns a success token flagged as a test transaction.
        if (cardToken === 'tok_test_4242') {
            return { ok: true, token: 'pay_TEST_' + Date.now().toString(36).toUpperCase(), testMode: true };
        }
        // Production placeholder: simulate a short network round-trip
        await new Promise(r => setTimeout(r, 1400));
        if (!cardToken && method !== 'paypal') return { ok: false, error: 'No payment token provided.' };
        return { ok: true, token: 'pay_' + Math.random().toString(36).substring(2, 14) };
    },

    async placeOrder({ userId, folderName, deliveryDate, cardToken, paymentMethod }) {
        const user   = Admin.getUserById(userId);
        const folder = user?.serviceFolders.find(f => f.folderName === folderName);
        const cart   = folder?.cart || [];

        if (!user)           return { ok: false, error: 'User not found.' };
        if (!folder)         return { ok: false, error: 'Folder not found.' };
        if (cart.length < 1) return { ok: false, error: 'Cart is empty.' };
        if (!deliveryDate)   return { ok: false, error: 'No delivery date selected.' };
        if (!(user.availableDeliveryDates || []).includes(deliveryDate))
                             return { ok: false, error: 'Selected date is not available.' };

        const total   = cart.reduce((n, i) => n + i.price * i.qty, 0);
        const orderId = this.generateOrderId();
        const now     = new Date().toISOString().split('T')[0];

        const payment = await this.processPayment({ total, cardToken, method: paymentMethod });
        if (!payment.ok) return { ok: false, error: payment.error };

        // ── Remove purchased parts from the folder's recommended list ────────────
        const purchasedNums = new Set(cart.map(i => i.partNumber));
        folder.parts = (folder.parts || []).filter(p => !purchasedNums.has(p.partNumber));

        // ── Decrement stock in global inventory ────────────────────────────────
        // The part entry is NEVER removed — only its stock count is decremented.
        // If a part doesn't have a stock field yet, we default it to 10 before decrementing
        // so older entries (added before stock tracking was introduced) still work correctly.
        for (const item of cart) {
            for (const make of Object.keys(DB.globalInventory || {})) {
                for (const model of Object.keys(DB.globalInventory[make])) {
                    for (const year of Object.keys(DB.globalInventory[make][model])) {
                        const slot = DB.globalInventory[make][model][year];
                        const idx  = slot.findIndex(p => p.partNumber === item.partNumber);
                        if (idx !== -1) {
                            // Default stock to 10 for parts that predate stock tracking
                            if (slot[idx].stock === undefined) slot[idx].stock = 10;
                            slot[idx].stock = Math.max(0, slot[idx].stock - item.qty);
                        }
                    }
                }
            }
        }

        if (!user.orderHistory) user.orderHistory = [];
        const order = {
            orderId,
            folderName,
            customerNumber: folder.customerNumber,
            date:           now,
            deliveryDate,
            paymentToken:   payment.token,
            paymentMethod:  paymentMethod || 'card',
            total:          Math.round(total * 100) / 100,
            status:         'confirmed',
            testMode:       payment.testMode || false,
            items:          cart.map(i => ({ ...i }))
        };
        user.orderHistory.unshift(order);

        if (!DB.transactions) DB.transactions = [];
        DB.transactions.unshift({
            orderId,
            userId:         user.id,
            displayName:    user.displayName,
            folderName,
            customerNumber: folder.customerNumber,
            total:          Math.round(total * 100) / 100,
            date:           now,
            deliveryDate,
            itemCount:      cart.reduce((n, i) => n + i.qty, 0),
            status:         'completed'
        });

        folder.cart = [];
        saveDB();
        return { ok: true, order };
    }
};


// --- Returns Module ----------------------------------------------------------

const Returns = {

    // Create a new return request from the user side.
    // orderId + partNumber uniquely identify the line item being returned.
    create({ userId, displayName, orderId, folderName, customerNumber, part, reason }) {
        if (!DB.returnRequests) DB.returnRequests = [];

        // Prevent duplicate requests for the same order line
        const dup = DB.returnRequests.find(
            r => r.orderId === orderId && r.partNumber === part.partNumber && r.status === 'pending'
        );
        if (dup) return { ok: false, error: 'A return request for this part is already pending.' };

        const reqId = 'RET-' + Date.now().toString(36).toUpperCase();
        DB.returnRequests.push({
            reqId,
            userId,
            displayName,
            orderId,
            folderName,
            customerNumber,
            partNumber:  part.partNumber,
            partName:    part.partName || part.description,
            partPrice:   part.price,
            partQty:     part.qty,
            imageUrl:    part.imageUrl || '',
            reason,
            status:      'pending',      // pending | approved | rejected
            dateCreated: new Date().toISOString().split('T')[0],
            dateActioned: null
        });

        // Mark the item in the user's order history as "Return Pending"
        const user = DB.users.find(u => u.id === userId);
        if (user) {
            const order = (user.orderHistory || []).find(o => o.orderId === orderId);
            if (order) {
                const item = (order.items || []).find(i => i.partNumber === part.partNumber);
                if (item) item.returnStatus = 'pending';
            }
        }

        saveDB();
        return { ok: true, reqId };
    },

    // Admin: get all return requests, optionally filtered by status.
    getAll(status = null) {
        const reqs = DB.returnRequests || [];
        return status ? reqs.filter(r => r.status === status) : reqs;
    },

    // Count of pending requests — used for the notification bell.
    pendingCount() {
        return (DB.returnRequests || []).filter(r => r.status === 'pending').length;
    },

    // Admin: approve a return. Restocks the part in global inventory.
    approve(reqId) {
        const req = (DB.returnRequests || []).find(r => r.reqId === reqId);
        if (!req) return { ok: false, error: 'Request not found.' };
        if (req.status !== 'pending') return { ok: false, error: 'Request already actioned.' };

        req.status      = 'approved';
        req.dateActioned = new Date().toISOString().split('T')[0];

        // Restock in global inventory — find matching part and increment stock
        let restocked = false;
        const inv = DB.globalInventory || {};
        outer: for (const make of Object.keys(inv)) {
            for (const model of Object.keys(inv[make])) {
                for (const year of Object.keys(inv[make][model])) {
                    const slot = inv[make][model][year];
                    const part = slot.find(p => p.partNumber === req.partNumber);
                    if (part) {
                        part.stock = (part.stock || 0) + req.partQty;
                        restocked = true;
                        break outer;
                    }
                }
            }
        }

        // Update the item's returnStatus in the user's order history
        const user = DB.users.find(u => u.id === req.userId);
        if (user) {
            const order = (user.orderHistory || []).find(o => o.orderId === req.orderId);
            if (order) {
                const item = (order.items || []).find(i => i.partNumber === req.partNumber);
                if (item) item.returnStatus = 'approved';
            }
        }

        saveDB();
        return { ok: true, restocked };
    },

    // Admin: reject a return.
    reject(reqId) {
        const req = (DB.returnRequests || []).find(r => r.reqId === reqId);
        if (!req) return { ok: false, error: 'Request not found.' };
        if (req.status !== 'pending') return { ok: false, error: 'Request already actioned.' };

        req.status       = 'rejected';
        req.dateActioned = new Date().toISOString().split('T')[0];

        const user = DB.users.find(u => u.id === req.userId);
        if (user) {
            const order = (user.orderHistory || []).find(o => o.orderId === req.orderId);
            if (order) {
                const item = (order.items || []).find(i => i.partNumber === req.partNumber);
                if (item) item.returnStatus = 'rejected';
            }
        }

        saveDB();
        return { ok: true };
    }
};