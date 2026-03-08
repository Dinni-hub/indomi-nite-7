import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";

const db = new Database("indominite.db");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Initialize default inventory if empty
  const getInventory = () => {
    const rows = db.prepare("SELECT data FROM inventory").all();
    if (rows.length === 0) {
      const defaultInventory = [
        { 
          id: 1, 
          name: 'Indomie Goreng', 
          stock: 15, 
          unit: 'bks', 
          max: 100, 
          min: 10, 
          icon: 'Package', 
          color: 'bg-orange-100 text-orange-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Indomie%20goreng%201%20bungkus%2085%20gram%20_%20indomie%20_%20mie%20goreng%20indomie.jpg'
        },
        { 
          id: 2, 
          name: 'Telur', 
          stock: 42, 
          unit: 'kg', 
          max: 100, 
          min: 10, 
          icon: 'Egg', 
          color: 'bg-yellow-100 text-yellow-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Telur%20Ayam%20Negeri%201%20kg%20_%20telur%20ayam%20_%20telur.jpg'
        },
        { 
          id: 3, 
          name: 'Sawi Hijau (Caisim)', 
          stock: 5, 
          unit: 'kg', 
          max: 20, 
          min: 2, 
          icon: 'Leaf', 
          color: 'bg-green-100 text-green-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Sawi%20Hijau%20Caisim%201%20Ikat%20_%20sawi%20hijau%20_%20caisim.jpg'
        },
        { 
          id: 4, 
          name: 'Cabe Rawit', 
          stock: 2.5, 
          unit: 'kg', 
          max: 10, 
          min: 1, 
          icon: 'Flame', 
          color: 'bg-red-100 text-red-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Cabe%20Rawit%20Merah%201%20kg%20_%20cabe%20rawit%20_%20cabe.jpg'
        },
        { 
          id: 5, 
          name: 'Sosis Sapi', 
          stock: 30, 
          unit: 'pcs', 
          max: 100, 
          min: 15, 
          icon: 'Box', 
          color: 'bg-red-100 text-red-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Sosis%20Sapi%201%20Pack%20_%20sosis%20sapi%20_%20sosis.jpg'
        },
        { 
          id: 6, 
          name: 'Bawang Merah', 
          stock: 8, 
          unit: 'kg', 
          max: 20, 
          min: 3, 
          icon: 'Sparkles', 
          color: 'bg-purple-100 text-purple-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Bawang%20Merah%201%20kg%20_%20bawang%20merah%20_%20bawang.jpg'
        },
        { 
          id: 7, 
          name: 'Bawang Putih', 
          stock: 6, 
          unit: 'kg', 
          max: 15, 
          min: 2, 
          icon: 'Sparkles', 
          color: 'bg-slate-100 text-slate-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Bawang%20Putih%201%20kg%20_%20bawang%20putih%20_%20bawang.jpg'
        },
        { 
          id: 8, 
          name: 'Minyak Goreng', 
          stock: 12, 
          unit: 'L', 
          max: 50, 
          min: 5, 
          icon: 'Droplet', 
          color: 'bg-amber-100 text-amber-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Minyak%20Goreng%201%20Liter%20_%20minyak%20goreng%20_%20minyak.jpg'
        },
        { 
          id: 9, 
          name: 'Kecap Manis', 
          stock: 10, 
          unit: 'btl', 
          max: 30, 
          min: 5, 
          icon: 'Droplet', 
          color: 'bg-stone-100 text-stone-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Kecap%20Manis%201%20Botol%20_%20kecap%20manis%20_%20kecap.jpg'
        },
        { 
          id: 10, 
          name: 'Saus Sambal', 
          stock: 8, 
          unit: 'btl', 
          max: 25, 
          min: 4, 
          icon: 'Droplet', 
          color: 'bg-red-100 text-red-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Saus%20Sambal%201%20Botol%20_%20saus%20sambal%20_%20saus.jpg'
        },
        { 
          id: 11, 
          name: 'Garam', 
          stock: 5, 
          unit: 'kg', 
          max: 15, 
          min: 2, 
          icon: 'Sparkles', 
          color: 'bg-gray-100 text-gray-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Garam%201%20Bungkus%20_%20garam%20_%20bumbu.jpg'
        },
        { 
          id: 12, 
          name: 'Lada Bubuk', 
          stock: 3, 
          unit: 'kg', 
          max: 10, 
          min: 1, 
          icon: 'Sparkles', 
          color: 'bg-stone-100 text-stone-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Lada%20Bubuk%201%20Botol%20_%20lada%20bubuk%20_%20bumbu.jpg'
        },
        { 
          id: 13, 
          name: 'Air Mineral', 
          stock: 48, 
          unit: 'btl', 
          max: 100, 
          min: 24, 
          icon: 'Droplet', 
          color: 'bg-blue-100 text-blue-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Air%20Mineral%201%20Botol%20_%20air%20mineral%20_%20minuman.jpg'
        },
        { 
          id: 14, 
          name: 'Es Batu', 
          stock: 15, 
          unit: 'kg', 
          max: 30, 
          min: 5, 
          icon: 'Box', 
          color: 'bg-cyan-100 text-cyan-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Es%20Batu%201%20Plastik%20_%20es%20batu%20_%20minuman.jpg'
        },
        { 
          id: 15, 
          name: 'Gula Pasir', 
          stock: 10, 
          unit: 'kg', 
          max: 25, 
          min: 5, 
          icon: 'Sparkles', 
          color: 'bg-yellow-100 text-yellow-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Gula%20Pasir%201%20kg%20_%20gula%20pasir%20_%20bumbu.jpg'
        },
        { 
          id: 16, 
          name: 'Teh Celup', 
          stock: 20, 
          unit: 'kotak', 
          max: 50, 
          min: 10, 
          icon: 'Coffee', 
          color: 'bg-orange-100 text-orange-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Teh%20Celup%201%20Kotak%20_%20teh%20celup%20_%20minuman.jpg'
        },
        { 
          id: 17, 
          name: 'Kopi Bubuk', 
          stock: 15, 
          unit: 'bks', 
          max: 40, 
          min: 8, 
          icon: 'Coffee', 
          color: 'bg-stone-100 text-stone-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Kopi%20Bubuk%201%20Bungkus%20_%20kopi%20bubuk%20_%20minuman.jpg'
        },
        { 
          id: 18, 
          name: 'Susu Kental Manis', 
          stock: 24, 
          unit: 'klg', 
          max: 60, 
          min: 12, 
          icon: 'Droplet', 
          color: 'bg-yellow-100 text-yellow-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Susu%20Kental%20Manis%201%20Kaleng%20_%20susu%20kental%20manis%20_%20minuman.jpg'
        },
        { 
          id: 19, 
          name: 'Packaging Box Kertas', 
          stock: 150, 
          unit: 'pcs', 
          max: 500, 
          min: 50, 
          icon: 'Box', 
          color: 'bg-stone-100 text-stone-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Packaging%20Box%20Kertas%201%20Pack%20_%20packaging%20box%20kertas%20_%20packaging.jpg'
        },
        { 
          id: 20, 
          name: 'Sendok Plastik', 
          stock: 200, 
          unit: 'pcs', 
          max: 1000, 
          min: 100, 
          icon: 'Utensils', 
          color: 'bg-gray-100 text-gray-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Sendok%20Plastik%201%20Pack%20_%20sendok%20plastik%20_%20packaging.jpg'
        },
        { 
          id: 21, 
          name: 'Garpu Plastik', 
          stock: 200, 
          unit: 'pcs', 
          max: 1000, 
          min: 100, 
          icon: 'Utensils', 
          color: 'bg-gray-100 text-gray-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Garpu%20Plastik%201%20Pack%20_%20garpu%20plastik%20_%20packaging.jpg'
        },
        { 
          id: 22, 
          name: 'Kantong Plastik', 
          stock: 300, 
          unit: 'pcs', 
          max: 1000, 
          min: 100, 
          icon: 'Box', 
          color: 'bg-gray-100 text-gray-600',
          imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Kantong%20Plastik%201%20Pack%20_%20kantong%20plastik%20_%20packaging.jpg'
        }
      ];
      const insert = db.prepare("INSERT INTO inventory (id, data) VALUES (?, ?)");
      const insertMany = db.transaction((items) => {
        for (const item of items) {
          insert.run(item.id, JSON.stringify(item));
        }
      });
      insertMany(defaultInventory);
      return defaultInventory;
    }
    return rows.map((r: any) => JSON.parse(r.data));
  };

  const getOrders = () => {
    const rows = db.prepare("SELECT data FROM orders").all();
    return rows.map((r: any) => JSON.parse(r.data));
  };

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    // Send initial state to the client
    socket.emit("initialState", {
      orders: getOrders(),
      inventory: getInventory()
    });

    socket.on("createOrder", (order) => {
      const insert = db.prepare("INSERT INTO orders (id, data) VALUES (?, ?)");
      insert.run(order.id, JSON.stringify(order));
      io.emit("orderCreated", order);
    });

    socket.on("updateOrder", (orderId, status) => {
      const row = db.prepare("SELECT data FROM orders WHERE id = ?").get(orderId) as any;
      if (row) {
        const order = JSON.parse(row.data);
        order.status = status;
        const update = db.prepare("UPDATE orders SET data = ? WHERE id = ?");
        update.run(JSON.stringify(order), orderId);
        io.emit("orderUpdated", { orderId, status });
      }
    });

    socket.on("updateInventory", (inventory) => {
      const update = db.prepare("UPDATE inventory SET data = ? WHERE id = ?");
      const updateMany = db.transaction((items) => {
        for (const item of items) {
          update.run(JSON.stringify(item), item.id);
        }
      });
      updateMany(inventory);
      io.emit("inventoryUpdated", inventory);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
