// ─── PartFind Database (db.js) ────────────────────────────────────────────────
//
// Flat-file "database" using plain JS objects + localStorage for persistence.
//
// Module order matters:
//   1. DB_DEFAULTS + persistence helpers (_loadDB, saveDB, resetDB, DB)
//   2. Inventory  ← defined before Admin so Admin.addPart can call it
//   3. Admin
//   4. Auth
//   5. Checkout
//   6. Returns
// ─────────────────────────────────────────────────────────────────────────────

const DB_VERSION = 3; // bump this to force-reset users on all browsers

const DB_DEFAULTS = {
    _version: DB_VERSION,
    users: [
        {
            id: "u001",
            username: "ACBW Wasson",
            password: "Calcutta",
            role: "user",
            displayName: "ACBW Wasson",
            email: "",
            orderHistory: [],
            serviceFolders: []
        },
        {
            id: "u002",
            username: "ACBW North",
            password: "Guadalupe",
            role: "user",
            displayName: "ACBW North",
            email: "",
            orderHistory: [],
            serviceFolders: []
        },
        {
            id: "u003",
            username: "ACBW San Marcos",
            password: "Lourdes",
            role: "user",
            displayName: "ACBW San Marcos",
            email: "",
            orderHistory: [],
            serviceFolders: []
        },
        {
            id: "u004",
            username: "ACBW Spicewood",
            password: "Paris",
            role: "user",
            displayName: "ACBW Spicewood",
            email: "",
            orderHistory: [],
            serviceFolders: []
        },
        {
            id: "a001",
            username: "admin",
            password: "admin2025",
            role: "admin",
            displayName: "Administrator",
            email: "admin@acbw.com",
            orderHistory: [],
            serviceFolders: []
        }
    ],

    vehicles: {
        "Tesla":  {
            models: ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster"],
            image:  "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop"
        },
        "Rivian": {
            models: ["R1T", "R1S", "R2", "R3", "R3X"],
            image:  "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop"
        }
    },

    // Global Inventory: indexed as { [make]: { [model]: { [year]: Part[] } } }
    globalInventory: {
        "Tesla": {
            "Model 3": {
                "2023": [
                    { partNumber: "TS-M3-BRK-F",  partName: "Front Brake Pad Set",   description: "OEM Front Brake Pad Set — Ceramic",               imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 89.99,  stock: 12, make: "Tesla", model: "Model 3", year: "2023" },
                    { partNumber: "TS-M3-BRK-R",  partName: "Rear Brake Pad Set",    description: "OEM Rear Brake Pad Set — Ceramic",                 imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 74.99,  stock: 10, make: "Tesla", model: "Model 3", year: "2023" },
                    { partNumber: "TS-M3-12V",    partName: "12V Battery",            description: "OEM 12V Lithium-Ion Auxiliary Battery",            imageUrl: "https://images.unsplash.com/photo-1609188076864-c35269136b09?w=400&auto=format&fit=crop", price: 149.00, stock: 6,  make: "Tesla", model: "Model 3", year: "2023" },
                    { partNumber: "TS-M3-CAF",    partName: "Cabin Air Filter",       description: "HEPA Cabin Air Filter w/ Activated Carbon",        imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 39.99,  stock: 20, make: "Tesla", model: "Model 3", year: "2023" },
                    { partNumber: "TS-M3-WPR",    partName: "Wiper Blade Set",        description: "OEM Front Wiper Blade Set (Driver + Passenger)",   imageUrl: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400&auto=format&fit=crop", price: 44.99,  stock: 15, make: "Tesla", model: "Model 3", year: "2023" }
                ],
                "2022": [
                    { partNumber: "TS-M3-BRK-F22",partName: "Front Brake Pad Set",   description: "OEM Front Brake Pad Set — Ceramic (2022)",         imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 89.99,  stock: 8,  make: "Tesla", model: "Model 3", year: "2022" },
                    { partNumber: "TS-M3-RTR-22",  partName: "Front Brake Rotor",    description: "Front Vented Brake Rotor — Left or Right",         imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 129.00, stock: 4,  make: "Tesla", model: "Model 3", year: "2022" }
                ]
            },
            "Model Y": {
                "2024": [
                    { partNumber: "TS-MY-BRK-F",  partName: "Front Brake Pad Set",   description: "OEM Front Brake Pad Set — Model Y",                imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 94.99,  stock: 10, make: "Tesla", model: "Model Y", year: "2024" },
                    { partNumber: "TS-MY-CAF",    partName: "Cabin Air Filter",       description: "HEPA Cabin Air Filter — Model Y",                  imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 44.99,  stock: 14, make: "Tesla", model: "Model Y", year: "2024" },
                    { partNumber: "TS-MY-CLT",    partName: "Coolant (1 Gal)",        description: "OEM Electric Vehicle Coolant — 1 Gallon",          imageUrl: "https://images.unsplash.com/photo-1617650728575-1b8e7e3e19cb?w=400&auto=format&fit=crop", price: 29.99,  stock: 22, make: "Tesla", model: "Model Y", year: "2024" }
                ],
                "2023": [
                    { partNumber: "TS-MY-SUS-FL", partName: "Front Strut Assembly",  description: "Front Left Strut Assembly — OEM",                  imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 295.00, stock: 3,  make: "Tesla", model: "Model Y", year: "2023" },
                    { partNumber: "TS-MY-WPR",    partName: "Wiper Blade Set",        description: "OEM Front Wiper Blade Set — Model Y",              imageUrl: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400&auto=format&fit=crop", price: 47.99,  stock: 12, make: "Tesla", model: "Model Y", year: "2023" }
                ]
            },
            "Model S": {
                "2022": [
                    { partNumber: "TS-MS-SUS-F",  partName: "Air Suspension Strut",  description: "Front Active Air Suspension Strut — Left",         imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 498.00, stock: 2,  make: "Tesla", model: "Model S", year: "2022" },
                    { partNumber: "TS-MS-DRH",    partName: "Door Handle Assembly",  description: "Retractable Door Handle Assembly — Front",         imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&auto=format&fit=crop", price: 185.00, stock: 5,  make: "Tesla", model: "Model S", year: "2022" },
                    { partNumber: "TS-MS-CAF",    partName: "Cabin Air Filter",       description: "HEPA Cabin Air Filter — Model S",                  imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 49.99,  stock: 8,  make: "Tesla", model: "Model S", year: "2022" }
                ]
            },
            "Cybertruck": {
                "2024": [
                    { partNumber: "TS-CT-BMP-F",  partName: "Front Bumper Bracket",  description: "Front Bumper Impact Absorber Bracket",             imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&auto=format&fit=crop", price: 215.00, stock: 3,  make: "Tesla", model: "Cybertruck", year: "2024" },
                    { partNumber: "TS-CT-FOG",    partName: "Fog Light Assembly",    description: "Front Fog Light Assembly — LED",                   imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&auto=format&fit=crop", price: 168.00, stock: 4,  make: "Tesla", model: "Cybertruck", year: "2024" }
                ]
            }
        },
        "Rivian": {
            "R1T": {
                "2023": [
                    { partNumber: "RV-R1T-SKD",   partName: "Front Skid Plate",      description: "Aluminum Front Skid Plate — Rock Guard",           imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&auto=format&fit=crop", price: 349.00, stock: 4,  make: "Rivian", model: "R1T", year: "2023" },
                    { partNumber: "RV-R1T-RUB",   partName: "Running Board Set",     description: "Integrated Side Running Board Set (Pair)",         imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 529.00, stock: 2,  make: "Rivian", model: "R1T", year: "2023" },
                    { partNumber: "RV-R1T-CAF",   partName: "Cabin Air Filter",      description: "Cabin Air Filter — R1T",                           imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 44.99,  stock: 10, make: "Rivian", model: "R1T", year: "2023" },
                    { partNumber: "RV-R1T-12V",   partName: "12V Auxiliary Battery", description: "OEM 12V Auxiliary Battery Replacement",            imageUrl: "https://images.unsplash.com/photo-1609188076864-c35269136b09?w=400&auto=format&fit=crop", price: 189.00, stock: 5,  make: "Rivian", model: "R1T", year: "2023" }
                ],
                "2022": [
                    { partNumber: "RV-R1T-BRK22", partName: "Front Brake Pad Set",   description: "OEM Front Brake Pads — R1T (2022)",                imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 109.99, stock: 6,  make: "Rivian", model: "R1T", year: "2022" }
                ]
            },
            "R1S": {
                "2023": [
                    { partNumber: "RV-R1S-RRK",   partName: "Roof Rail Extension",   description: "Roof Rail Cross-Bar Extension Kit",                imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&auto=format&fit=crop", price: 299.00, stock: 3,  make: "Rivian", model: "R1S", year: "2023" },
                    { partNumber: "RV-R1S-CAF",   partName: "Cabin Air Filter",      description: "HEPA Cabin Air Filter — R1S",                      imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 44.99,  stock: 9,  make: "Rivian", model: "R1S", year: "2023" },
                    { partNumber: "RV-R1S-BRK-F", partName: "Front Brake Pad Set",   description: "OEM Front Brake Pads — R1S",                       imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop", price: 114.99, stock: 7,  make: "Rivian", model: "R1S", year: "2023" },
                    { partNumber: "RV-R1S-SUS-F", partName: "Front Strut Assembly",  description: "Front Strut Assembly — Left",                      imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 385.00, stock: 2,  make: "Rivian", model: "R1S", year: "2023" }
                ]
            },
            "R2": {
                "2026": [
                    { partNumber: "RV-R2-BRK-F",  partName: "Front Brake Rotor Set", description: "Front Vented Brake Rotor Set (Pair)",              imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&auto=format&fit=crop", price: 198.00, stock: 5,  make: "Rivian", model: "R2", year: "2026" },
                    { partNumber: "RV-R2-CAF",    partName: "Cabin Air Filter",      description: "Cabin Air Filter — R2",                            imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop", price: 39.99,  stock: 8,  make: "Rivian", model: "R2", year: "2026" }
                ]
            }
        }
    },

    // Transaction log
    transactions: [],

    // Return requests: created by users, actioned by admin.
    returnRequests: []
};


// ─── Persistence ──────────────────────────────────────────────────────────────

function _loadDB() {
    try {
        const saved = localStorage.getItem('partfind_db');
        if (!saved) return JSON.parse(JSON.stringify(DB_DEFAULTS));
        const parsed = JSON.parse(saved);
        // Version guard: if stored version doesn't match current, reset users.
        // Preserves inventory and transactions across resets.
        if (parsed._version !== DB_VERSION) {
            parsed._version = DB_VERSION;
            parsed.users = JSON.parse(JSON.stringify(DB_DEFAULTS.users));
            localStorage.setItem('partfind_db', JSON.stringify(parsed));
        }
        return parsed;
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

const Inventory = {

    // Write a part into the Make → Model → Year index.
    addPart(make, model, year, part) {
        if (!make || !model || !year) return { ok: false, error: 'Make, Model, and Year are required.' };
        if (!DB.globalInventory) DB.globalInventory = {};
        const inv = DB.globalInventory;
        if (!inv[make])              inv[make] = {};
        if (!inv[make][model])       inv[make][model] = {};
        if (!inv[make][model][year]) inv[make][model][year] = [];
        const slot = inv[make][model][year];
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
        DB.users.push({ id, username, password, role: 'user', displayName, email: '', orderHistory: [], serviceFolders: [] });
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

    setUserEmail(userId, email) {
        const user = this.getUserById(userId);
        if (!user) return false;
        user.email = email;
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
    addPart(userId, folderName, { partNumber, quantity }) {
        const user = this.getUserById(userId);
        if (!user) return { ok: false, error: 'User not found.' };
        const folder = user.serviceFolders.find(f => f.folderName === folderName);
        if (!folder) return { ok: false, error: 'Folder not found.' };
        if (folder.parts.find(p => p.partNumber === partNumber))
            return { ok: false, error: 'Part already exists in this folder.' };

        // Part must exist in global inventory — look it up there
        const inv = DB.globalInventory || {};
        let globalPart = null;
        outer: for (const mk of Object.keys(inv)) {
            for (const mo of Object.keys(inv[mk])) {
                for (const yr of Object.keys(inv[mk][mo])) {
                    const found = inv[mk][mo][yr].find(p => p.partNumber === partNumber);
                    if (found) { globalPart = found; break outer; }
                }
            }
        }
        if (!globalPart) return { ok: false, error: 'Part not found in global inventory.' };

        const qty = Math.max(1, parseInt(quantity) || 1);
        folder.parts.push({ ...globalPart, quantity: qty });
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

    // Order history
    getOrderHistory(userId) {
        const user = this.getUserById(userId);
        return user ? (user.orderHistory || []) : [];
    },

    // Update packing status on an order — mirrors to the transactions log.
    updateOrderPackingStatus(userId, orderId, newStatus) {
        const user = this.getUserById(userId);
        if (!user) return false;
        const order = (user.orderHistory || []).find(o => o.orderId === orderId);
        if (order) order.packingStatus = newStatus;
        // Mirror to transactions log so the Transactions panel stays in sync
        const tx = (DB.transactions || []).find(t => t.orderId === orderId);
        if (tx) tx.packingStatus = newStatus;
        saveDB();
        return true;
    },

    // Add a part directly to the global inventory (not tied to a folder).
    // Smart upsert: if the partNumber already exists, increments stock instead.
    // Accepts an optional `images` array (URLs/data-URLs). First entry = primary.
    addGlobalPart({ partNumber, make, model, year, partName, description, imageUrl, images, price, quantity }) {
        if (!partNumber || !make || !model)
            return { ok: false, error: 'Part #, Make, and Model are required.' };
        const resolvedYear = year || String(new Date().getFullYear());
        const qty = Math.max(1, parseInt(quantity) || 1);
        if (!DB.globalInventory) DB.globalInventory = {};
        const inv = DB.globalInventory;

        // Normalise the images array and keep imageUrl in sync with images[0]
        const resolvedImages = (images && images.length > 0)
            ? images.filter(Boolean)
            : (imageUrl ? [imageUrl] : []);
        const resolvedImageUrl = resolvedImages[0] || '';

        // Search all slots for an existing matching partNumber
        for (const mk of Object.keys(inv)) {
            for (const mo of Object.keys(inv[mk])) {
                for (const yr of Object.keys(inv[mk][mo])) {
                    const slot = inv[mk][mo][yr];
                    const idx  = slot.findIndex(p => p.partNumber === partNumber);
                    if (idx !== -1) {
                        // Upsert: increment stock; update images only if new ones supplied
                        slot[idx].stock = (slot[idx].stock || 0) + qty;
                        if (resolvedImages.length > 0) {
                            slot[idx].images   = resolvedImages;
                            slot[idx].imageUrl = resolvedImageUrl;
                        }
                        saveDB();
                        return { ok: true, upserted: true };
                    }
                }
            }
        }

        // Not found — create a new entry
        const newPart = {
            partNumber,
            partName:    partName    || '',
            description: description || '',
            imageUrl:    resolvedImageUrl,
            images:      resolvedImages,
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

    // Returns an array of 10 valid business-day date strings (YYYY-MM-DD).
    // Rule A: start with the next calendar day after today.
    // Rule B: if current hour >= 18 (6 PM), push out one additional day.
    // Rule C: skip any Saturday/Sunday until a valid weekday is reached,
    //         then collect the next 10 consecutive Mon–Fri dates.
    calcPickupDates() {
        const now  = new Date();
        const hour = now.getHours();

        // Start with tomorrow
        let start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // Rule B: if after 6 PM, skip one extra day
        if (hour >= 18) {
            start = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
        }

        // Advance past any leading weekend days
        while (start.getDay() === 0 || start.getDay() === 6) {
            start = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
        }

        // Collect 10 business days (Mon–Fri)
        const dates = [];
        let cur = new Date(start);
        while (dates.length < 10) {
            const dow = cur.getDay();
            if (dow !== 0 && dow !== 6) {
                const y = cur.getFullYear();
                const m = String(cur.getMonth() + 1).padStart(2, '0');
                const d = String(cur.getDate()).padStart(2, '0');
                dates.push(`${y}-${m}-${d}`);
            }
            cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
        }
        return dates;
    },

    // Place a pickup order — no payment processing.
    // Decrements inventory stock, saves order to user history and transactions log,
    // and clears the cart. Orders default to packingStatus 'Prepare for Pickup'.
    async submitOrder({ userId, folderName, pickupDate }) {
        const user   = Admin.getUserById(userId);
        const folder = user?.serviceFolders.find(f => f.folderName === folderName);
        const cart   = folder?.cart || [];

        if (!user)           return { ok: false, error: 'User not found.' };
        if (!folder)         return { ok: false, error: 'Folder not found.' };
        if (cart.length < 1) return { ok: false, error: 'Cart is empty.' };
        if (!pickupDate)     return { ok: false, error: 'No pickup date selected.' };

        const total   = cart.reduce((n, i) => n + i.price * i.qty, 0);
        const orderId = this.generateOrderId();
        const now     = new Date().toISOString().split('T')[0];

        // Decrement stock in global inventory for each purchased item
        for (const item of cart) {
            for (const make of Object.keys(DB.globalInventory || {})) {
                for (const model of Object.keys(DB.globalInventory[make])) {
                    for (const year of Object.keys(DB.globalInventory[make][model])) {
                        const slot = DB.globalInventory[make][model][year];
                        const idx  = slot.findIndex(p => p.partNumber === item.partNumber);
                        if (idx !== -1) {
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
            deliveryDate:   pickupDate,
            total:          Math.round(total * 100) / 100,
            status:         'confirmed',
            packingStatus:  'Prepare for Pickup',
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
            deliveryDate:   pickupDate,
            itemCount:      cart.reduce((n, i) => n + i.qty, 0),
            status:         'completed',
            packingStatus:  'Prepare for Pickup',
            items:          cart.map(i => ({ ...i }))
        });

        folder.cart = [];

        // Post-order folder management: remove/decrement ordered parts from folder.parts
        // (cart was captured at the top of this function before clearing)
        const orderedMap = {};
        for (const item of cart) { orderedMap[item.partNumber] = item.qty; }

        folder.parts = (folder.parts || []).filter(p => {
            const ordQty = orderedMap[p.partNumber];
            if (ordQty === undefined) return true;       // not in this order — keep
            const assignedQty = p.quantity || 1;
            if (ordQty >= assignedQty) return false;     // fully consumed — remove
            p.quantity = assignedQty - ordQty;           // partially consumed — decrement
            return true;
        });

        // If every part in the folder was consumed, delete the folder entirely
        if (folder.parts.length === 0) {
            user.serviceFolders = user.serviceFolders.filter(f => f.folderName !== folderName);
        }

        saveDB();
        return { ok: true, order };
    }
};


// ─── Returns Module ───────────────────────────────────────────────────────────

const Returns = {

    create({ userId, displayName, orderId, folderName, customerNumber, part, reason }) {
        if (!DB.returnRequests) DB.returnRequests = [];
        const dup = DB.returnRequests.find(
            r => r.orderId === orderId && r.partNumber === part.partNumber && r.status === 'pending'
        );
        if (dup) return { ok: false, error: 'A return request for this part is already pending.' };

        const reqId = 'RET-' + Date.now().toString(36).toUpperCase();
        DB.returnRequests.push({
            reqId, userId, displayName, orderId, folderName, customerNumber,
            partNumber:   part.partNumber,
            partName:     part.partName || part.description,
            partPrice:    part.price,
            partQty:      part.qty,
            imageUrl:     part.imageUrl || '',
            reason,
            status:       'pending',
            dateCreated:  new Date().toISOString().split('T')[0],
            dateActioned: null
        });

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

    getAll(status = null) {
        const reqs = DB.returnRequests || [];
        return status ? reqs.filter(r => r.status === status) : reqs;
    },

    pendingCount() {
        return (DB.returnRequests || []).filter(r => r.status === 'pending').length;
    },

    approve(reqId) {
        const req = (DB.returnRequests || []).find(r => r.reqId === reqId);
        if (!req) return { ok: false, error: 'Request not found.' };
        if (req.status !== 'pending') return { ok: false, error: 'Request already actioned.' };
        req.status       = 'approved';
        req.dateActioned = new Date().toISOString().split('T')[0];

        let restocked = false;
        const inv = DB.globalInventory || {};
        outer: for (const make of Object.keys(inv)) {
            for (const model of Object.keys(inv[make])) {
                for (const year of Object.keys(inv[make][model])) {
                    const slot = inv[make][model][year];
                    const part = slot.find(p => p.partNumber === req.partNumber);
                    if (part) { part.stock = (part.stock || 0) + req.partQty; restocked = true; break outer; }
                }
            }
        }

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
