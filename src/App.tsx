/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { database } from "./services/firebaseService";
import { ref, onValue, push, set, update } from "firebase/database";
import { 
  Bell, ChevronDown, Search, 
  SlidersHorizontal, Flame, Utensils, Soup, IceCream, 
  Star, Clock, Bike, Home, ReceiptText, User, 
  ArrowLeft, MapPin, Wallet, CreditCard, CheckCircle, 
  Circle, ShoppingBag, Minus, Plus, QrCode, Banknote,
  Settings, Lock, Phone, Mail, HelpCircle, LogOut, Trash2, BellRing, Bird, Cookie,
  AlertTriangle, TrendingUp, BarChart3, ShoppingCart,
  Package, Egg, Leaf, Box, Droplet, Sparkles, X, Coffee, Camera
} from "lucide-react";
import { BottomNav, NavItem } from "./components/BottomNav";

type View = 'welcome' | 'home' | 'detail' | 'checkout' | 'orders' | 'owner';

interface CartItem {
  item: any;
  quantity: number;
  toppings: string[];
  totalPrice: number;
  notes?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  paymentMethod?: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
  status: 'diterima' | 'dimasak' | 'diantar' | 'selesai' | 'dibatalkan';
  paymentStatus: 'belum' | 'lunas';
}

export default function App() {
  const [view, setView] = useState<View>(() => {
    try {
      const saved = localStorage.getItem('app_view');
      if (saved && ['welcome', 'home', 'detail', 'checkout', 'orders', 'owner'].includes(saved)) {
        return saved as View;
      }
    } catch (e) {
      console.error("Error parsing view from localStorage", e);
    }
    return 'welcome';
  });
  const [address, setAddress] = useState(() => localStorage.getItem('app_address') || '');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('app_selectedItem');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing selectedItem from localStorage", e);
    }
    return null;
  });
  const [notification, setNotification] = useState<string | null>(null);
  const [homeActiveTab, setHomeActiveTab] = useState(() => localStorage.getItem('app_homeTab') || 'home');
  const [homeActiveCategory, setHomeActiveCategory] = useState('Mie');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('app_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing cart from localStorage", e);
    }
    return [];
  });

  const [userRole, setUserRole] = useState<'guest' | 'customer' | 'owner'>(() => {
    const saved = localStorage.getItem('app_userRole');
    return (saved as any) || 'guest';
  });
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('app_customerName') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('app_customerPhone') || '');
  const [customerEmail, setCustomerEmail] = useState(() => localStorage.getItem('app_customerEmail') || '');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TUNAI');
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('app_inventory');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing inventory from localStorage", e);
    }
    return [
      { 
        id: 1, 
        name: 'Indomie Goreng', 
        stock: 15, 
        unit: 'bks', 
        max: 100, 
        min: 5, 
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
        min: 1, 
        icon: 'Egg', 
        color: 'bg-amber-100 text-amber-600',
        imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Telur%20Ayam%20Organik%20Nature%20Eggs%20%20(10%20pcs%20_%20pack).jpg'
      },
      { 
        id: 3, 
        name: 'Minyak', 
        stock: 5, 
        unit: 'ltr', 
        max: 20, 
        min: 1, 
        icon: 'Droplet', 
        color: 'bg-yellow-100 text-yellow-600',
        imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/TROPICAL%20MINYAK%20GORENG%20%202000mL.jpg'
      },
      { 
        id: 4, 
        name: 'Tusuk Sate', 
        stock: 100, 
        unit: 'pcs', 
        max: 500, 
        min: 100, 
        icon: 'Flame', 
        color: 'bg-stone-100 text-stone-600',
        imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/Tusuk%20sate%20_%20tusuk%20pentol%2C%20Sempol%2C%20sate%20kambing%20_%20sapi_%20Merk%20_panda%20alami_%20isi%20%C2%B1200%20biji.jpg'
      },
      { 
        id: 5, 
        name: 'Packaging Box Kertas', 
        stock: 30, 
        unit: 'pcs', 
        max: 200, 
        min: 10, 
        icon: 'Box', 
        color: 'bg-stone-100 text-stone-600',
        imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/MSP%20~%20LUNCH%20BOX%20_%20PAPER%20BOX%20COKELAT%20M%26L%20_50PCS%20_%20S%20100PCS.jpg'
      },
      { 
        id: 6, 
        name: 'Garpu', 
        stock: 50, 
        unit: 'pcs', 
        max: 200, 
        min: 10, 
        icon: 'Utensils', 
        color: 'bg-slate-100 text-slate-600',
        imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/(50%20pieces)%20Disposable%20Fork%20%26%20Spoon%20High%20Quality%20Plastic%20PP%20Fork%20Spoon_%20Plastic%20Cutlery%20_%20Garpu%20Plastik%20_%20Sudu%20Plastik.jpg'
      },
      { 
        id: 7, 
        name: 'Saus Tomat', 
        stock: 2, 
        unit: 'btl', 
        max: 5, 
        min: 1, 
        icon: 'Droplet', 
        color: 'bg-red-50 text-red-500',
        imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/INDOFOOD%20TOMATO%20SAUCE%20SAUS%20TOMAT%20BOTOL%20275ML.jpg'
      },
      { 
        id: 8, 
        name: 'Saus Sambal', 
        stock: 3, 
        unit: 'btl', 
        max: 5, 
        min: 1, 
        icon: 'Droplet', 
        color: 'bg-orange-50 text-orange-500',
        imageUrl: 'https://raw.githubusercontent.com/Dinni-hub/manajemen-stok/main/INDOFOOD%20Sambal%20Pedas%20275ml%20ACCJKT.jpg'
      },
    ];
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('app_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp)
        }));
      }
    } catch (e) {
      console.error("Error parsing orders from localStorage", e);
    }
    return [];
  });

  const isFirebaseConfigured = useMemo(() => {
    return !!import.meta.env.VITE_FIREBASE_API_KEY && 
           import.meta.env.VITE_FIREBASE_API_KEY !== 'YOUR_FIREBASE_API_KEY';
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const ordersRef = ref(database, 'orders');
      const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const ordersArray = Object.keys(data).map(key => ({
            ...data[key],
            id: key,
            timestamp: new Date(data[key].timestamp)
          }));
          setOrders(ordersArray.reverse());
        } else {
          setOrders([]);
        }
      }, (error) => {
        console.error("Firebase Orders error:", error);
      });

      const inventoryRef = ref(database, 'inventory');
      const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setInventory(data);
        }
      }, (error) => {
        console.error("Firebase Inventory error:", error);
      });

      return () => {
        unsubscribeOrders();
        unsubscribeInventory();
      };
    }
  }, [isFirebaseConfigured]);

  useEffect(() => {
    localStorage.setItem('app_view', view);
    // If we are in detail view but have no item, go back home
    if (view === 'detail' && !selectedItem) {
      setView('home');
    }
  }, [view, selectedItem]);

  useEffect(() => {
    if (selectedItem) {
      localStorage.setItem('app_selectedItem', JSON.stringify(selectedItem));
    } else {
      localStorage.removeItem('app_selectedItem');
    }
  }, [selectedItem]);

  useEffect(() => {
    localStorage.setItem('app_homeTab', homeActiveTab);
  }, [homeActiveTab]);

  useEffect(() => {
    localStorage.setItem('app_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('app_userRole', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('app_customerName', customerName);
  }, [customerName]);

  useEffect(() => {
    localStorage.setItem('app_customerPhone', customerPhone);
  }, [customerPhone]);

  useEffect(() => {
    localStorage.setItem('app_customerEmail', customerEmail);
  }, [customerEmail]);

  useEffect(() => {
    localStorage.setItem('app_address', address);
  }, [address]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      localStorage.setItem('app_inventory', JSON.stringify(inventory));
    }
  }, [inventory, isFirebaseConfigured]);
  
  // Calculate stats from orders
  const { totalRevenue, totalOrders } = useMemo(() => {
    const total = orders.reduce((sum, order) => sum + order.total, 0);
    return { totalRevenue: total, totalOrders: orders.length };
  }, [orders]);

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setView('detail');
  };

  const handlePlaceOrder = (name: string, phone: string, email: string, orderAddress: string) => {
    if (cart.length === 0) return;

    const finalName = name || 'Pelanggan';
    setCustomerName(finalName);
    setCustomerPhone(phone);
    setCustomerEmail(email);
    setAddress(orderAddress);

    // 1. Create Order Records
    const newOrders: Order[] = cart.map(cartItem => ({
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      customerName: finalName,
      customerPhone: phone,
      customerEmail: email,
      customerAddress: orderAddress,
      paymentMethod: paymentMethod,
      items: [cartItem],
      total: cartItem.totalPrice,
      timestamp: new Date(), // Use Date object locally
      status: 'diterima',
      paymentStatus: 'belum'
    }));
    
    if (isFirebaseConfigured) {
      const ordersRef = ref(database, 'orders');
      newOrders.forEach(order => {
        // Convert to string for Firebase
        const orderForFirebase = { ...order, timestamp: order.timestamp.toISOString() };
        push(ordersRef, orderForFirebase);
      });
      // Also update orders state locally for immediate UI update if needed, 
      // though the onValue listener should handle it.
      setOrders(prev => [...newOrders, ...prev]);
    } else {
      const updatedOrders = [...newOrders, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem('app_orders', JSON.stringify(updatedOrders));
    }

    // 2. Update Stats (Now handled by useMemo on orders)
    // 3. Deduct Inventory
    const newInventory = [...inventory];
    
    cart.forEach(cartItem => {
      // Deduct Main Item
      if (cartItem.item.name.includes('Goreng')) {
        const idx = newInventory.findIndex(i => i.name === 'Indomie Goreng');
        if (idx > -1) newInventory[idx].stock = Math.max(0, newInventory[idx].stock - cartItem.quantity);
      }
      
      // Deduct Toppings
      cartItem.toppings.forEach(topping => {
        if (topping.includes('Telur')) {
          const idx = newInventory.findIndex(i => i.name === 'Telur');
          if (idx > -1) newInventory[idx].stock = Math.max(0, newInventory[idx].stock - cartItem.quantity);
        }
        if (topping.includes('Caisim')) {
          const idx = newInventory.findIndex(i => i.name === 'Caisim');
          if (idx > -1) newInventory[idx].stock = Math.max(0, newInventory[idx].stock - (0.1 * cartItem.quantity)); // Assume 100g per portion
        }
      });

      // Deduct Packaging & Utensils
      const pkgIdx = newInventory.findIndex(i => i.name === 'Packaging Box Kertas');
      if (pkgIdx > -1) newInventory[pkgIdx].stock = Math.max(0, newInventory[pkgIdx].stock - cartItem.quantity);
      
      const utnIdx = newInventory.findIndex(i => i.name === 'Garpu');
      if (utnIdx > -1) newInventory[utnIdx].stock = Math.max(0, newInventory[utnIdx].stock - cartItem.quantity);
    });

    setInventory(newInventory);
    if (isFirebaseConfigured) {
      set(ref(database, 'inventory'), newInventory);
    } else {
      localStorage.setItem('app_inventory', JSON.stringify(newInventory));
    }
    setCart([]);
    setView('orders');
  };

  const handleCancelOrder = (orderId: string) => {
    if (isFirebaseConfigured) {
      const orderRef = ref(database, `orders/${orderId}`);
      update(orderRef, { status: 'dibatalkan' });
    } else {
      const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'dibatalkan' as const } : o);
      setOrders(updatedOrders);
      localStorage.setItem('app_orders', JSON.stringify(updatedOrders));
    }
    setNotification("Pesanan telah dibatalkan.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    setNotification('Item dihapus dari keranjang');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-0 md:p-4 bg-stone-100">
      <div className="w-full max-w-[430px] bg-[#F5F2EA] h-[100dvh] md:h-[884px] md:max-h-[95vh] flex flex-col relative shadow-2xl md:rounded-[3rem] overflow-hidden border-0 md:border-8 border-white/20">
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 20 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-12 left-6 right-6 z-[100] bg-[#3D2B1F] text-white p-4 rounded-2xl shadow-2xl text-center text-sm font-bold pointer-events-none"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>
        {view === 'welcome' && (
          <WelcomeScreen onStart={() => setView('home')} />
        )}
        {view === 'owner' && (
          <OwnerScreen 
            inventory={inventory}
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            orders={orders}
            setOrders={setOrders}
            isFirebaseConfigured={isFirebaseConfigured}
            onUpdateStock={(id, newStock) => {
              const updatedInventory = inventory.map(item => 
                item.id === id ? { ...item, stock: newStock } : item
              );
              setInventory(updatedInventory);
              if (isFirebaseConfigured) {
                set(ref(database, 'inventory'), updatedInventory);
              } else {
                localStorage.setItem('app_inventory', JSON.stringify(updatedInventory));
              }
            }}
            onUpdateItem={(updatedItem) => {
              const updatedInventory = inventory.map(item => 
                item.id === updatedItem.id ? updatedItem : item
              );
              setInventory(updatedInventory);
              if (isFirebaseConfigured) {
                set(ref(database, 'inventory'), updatedInventory);
              } else {
                localStorage.setItem('app_inventory', JSON.stringify(updatedInventory));
              }
            }}
            onLogout={() => {
              setUserRole('guest');
              setView('welcome');
            }}
            onSwitchToCustomer={() => {
              setView('home');
            }}
            onUpdateOrderStatus={(orderId, status) => {
              if (isFirebaseConfigured) {
                // Update Firebase
                const orderRef = ref(database, `orders/${orderId}`);
                update(orderRef, { status });
              } else {
                const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status } : o);
                setOrders(updatedOrders);
                localStorage.setItem('app_orders', JSON.stringify(updatedOrders));
              }
              
              // Trigger specific notifications based on status
              if (status === 'dimasak') {
                setNotification('Pesanan Anda sedang dimasak oleh koki!');
              } else if (status === 'diantar') {
                setNotification('Pesanan Anda sudah selesai dan siap diantar!');
              } else if (status === 'selesai') {
                setNotification('Pesanan telah sampai! Selamat menikmati.');
              }
              
              setTimeout(() => setNotification(null), 5000);
            }}
          />
        )}
        {view === 'home' && (
            <HomeScreen 
            address={address} 
            addresses={addresses}
            setAddresses={setAddresses}
            customerName={customerName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            onCheckout={() => setView('checkout')} 
            onSelectItem={handleSelectItem}
            hasActiveOrder={orders.some(o => o.customerName === customerName && o.status !== 'selesai')}
            activeTab={homeActiveTab}
            setActiveTab={setHomeActiveTab}
            activeCategory={homeActiveCategory}
            setActiveCategory={setHomeActiveCategory}
            searchQuery={homeSearchQuery}
            setSearchQuery={setHomeSearchQuery}
            onAddressChange={(newAddr) => setAddress(newAddr)}
            onViewOrders={() => setView('orders')}
            cart={cart}
            userRole={userRole}
            onOpenOwnerDashboard={() => setView('owner')}
            onUpdateProfile={(name, phone, email) => {
              setCustomerName(name);
              setCustomerPhone(phone);
              setCustomerEmail(email);
              if (email.toLowerCase() === 'indominite@gmail.com') {
                setUserRole('owner');
              } else {
                setUserRole('customer');
              }
            }}
            onLogout={() => {
              setUserRole('guest');
              setView('welcome');
            }}
            onBackToWelcome={() => setView('welcome')}
            orders={orders}
            onRemoveFromCart={handleRemoveFromCart}
          />
        )}
        {view === 'detail' && (
          <DetailScreen 
            item={selectedItem} 
            onBack={() => setView('home')} 
            onAddToCart={(cartDetails) => {
              setCart(prev => [...prev, cartDetails]);
              setView('home');
              setNotification('Berhasil ditambahkan ke keranjang');
              setTimeout(() => setNotification(null), 3000);
            }}
            onBuyNow={(cartDetails) => {
              setCart(prev => [...prev, cartDetails]);
              setView('checkout');
            }}
          />
        )}
        {view === 'checkout' && (
          <CheckoutScreen 
            address={address} 
            onAddressChange={setAddress}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            cart={cart}
            onBack={() => setView('home')} 
            onOrderPlaced={(name, phone, email, addr) => handlePlaceOrder(name, phone, email, addr)}
            customerName={customerName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            onUpdateProfile={(name, phone, email) => {
              setCustomerName(name);
              setCustomerPhone(phone);
              setCustomerEmail(email);
              if (email.toLowerCase() === 'indominite@gmail.com') {
                setUserRole('owner');
              } else {
                setUserRole('customer');
              }
            }}
          />
        )}
        {view === 'orders' && (
          <OrdersScreen 
            onBack={() => setView('home')} 
            onGoHome={(tab = 'home') => {
              setHomeActiveTab(tab);
              setView('home');
            }}
            orders={orders}
            customerName={customerName}
            cart={cart}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#F5F2EA]">
      <div className="flex-1 flex flex-col items-center px-8 pt-6 pb-8 overflow-y-auto overflow-x-hidden">
        <div className="relative flex flex-col items-center mb-6">
          <div className="relative flex h-80 w-80 items-center justify-center rounded-full bg-white/40 border border-[#3D2B1F]/10 shadow-sm">
            <div className="z-10 flex h-64 w-64 items-center justify-center rounded-full bg-[#3D2B1F] text-[#F5F2EA] shadow-2xl overflow-hidden">
              <img 
                src="https://raw.githubusercontent.com/Dinni-hub/logo-indomi-nite/main/WhatsApp%20Image%202026-02-12%20at%2011.24.46.jpeg" 
                alt="Indomi Nite Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <h1 className="text-4xl font-serif tracking-tight text-[#3D2B1F] mt-8 text-center leading-tight">
            Indomi Nite
          </h1>
          <p className="text-[#D4AF37] font-bold uppercase tracking-[0.2em] text-[11px] mt-2">
            Solusi Ngemil Anak Kampus
          </p>
          <div className="h-0.5 w-12 bg-[#D4AF37]/40 mt-4 mb-4 rounded-full"></div>
        </div>

        <div className="flex w-full flex-col gap-4 mb-12 mt-auto">
          <button 
            onClick={() => onStart()}
            className="flex w-full items-center justify-center rounded-2xl h-16 bg-[#3D2B1F] text-[#F5F2EA] text-xl font-bold shadow-xl transition-colors hover:bg-black active:scale-95"
          >
            Mulai
          </button>
        </div>

        {/* Branding Footer */}
        <div className="w-full flex flex-col items-center mb-12">
          <div className="bg-white rounded-[1.5rem] p-4 w-full max-w-[300px] border border-[#3D2B1F]/10 shadow-sm flex flex-col items-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#3D2B1F]/50 mb-3">Proudly Powered By</p>
            <div className="flex items-center justify-center gap-8 w-full">
              <div className="h-14 w-14 flex items-center justify-center">
                <img 
                  src="https://raw.githubusercontent.com/Dinni-hub/logo-ai-campus-bg-putih/main/AI_Campus-removebg-preview.png" 
                  alt="AI Campus Logo" 
                  className="max-h-full max-w-full object-contain scale-[1.3]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="h-8 w-px bg-[#3D2B1F]/10"></div>
              <div className="h-14 w-14 flex items-center justify-center">
                <img 
                  src="https://raw.githubusercontent.com/Dinni-hub/logo/main/Logo%20MBD.png" 
                  alt="MBD Logo" 
                  className="max-h-full max-w-full object-contain scale-[1.7]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] font-medium text-[#3D2B1F]/60 tracking-wide text-center">
            Karya Mahasiswa Manajemen Bisnis Digital ISTTS (AI Campus)
          </p>
        </div>
      </div>
      <div className="mb-3 flex w-full justify-center">
        <div className="h-1.5 w-36 rounded-full bg-[#3D2B1F]/20"></div>
      </div>
    </div>
  );
}

function OwnerScreen({ inventory, totalRevenue, totalOrders, orders, onUpdateStock, onUpdateItem, onLogout, onSwitchToCustomer, onUpdateOrderStatus, setOrders, isFirebaseConfigured }: { inventory: any[], totalRevenue: number, totalOrders: number, orders: Order[], onUpdateStock: (id: number, stock: number) => void, onUpdateItem: (item: any) => void, onLogout: () => void, onSwitchToCustomer: () => void, onUpdateOrderStatus: (orderId: string, status: 'diterima' | 'dimasak' | 'diantar' | 'selesai') => void, setOrders: React.Dispatch<React.SetStateAction<Order[]>>, isFirebaseConfigured: boolean }) {
  const [activeTab, setActiveTab] = useState<'beranda' | 'laporan' | 'stok' | 'pengaturan'>('beranda');
  const [viewDetail, setViewDetail] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Icon mapping
  const IconMap: any = {
    Package, Soup, Egg, Flame, Leaf, Utensils, Box, Droplet, Sparkles, Coffee, Camera
  };

  // Calculate daily sales from orders
  const dailyData = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const todayOrders = orders.filter(o => o.timestamp.toDateString() === today);
    
    // Group by hour
    const hourlySales: { [key: number]: number } = {};
    todayOrders.forEach(order => {
      const h = order.timestamp.getHours();
      hourlySales[h] = (hourlySales[h] || 0) + 1;
    });

    // Show all 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(h => ({
      time: `${h.toString().padStart(2, '0')}:00`,
      sales: hourlySales[h] || 0,
      isCurrent: h === now.getHours()
    }));
  }, [orders]);

  const generateReceiptText = (order: Order) => {
    const date = order.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = order.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    let text = `*NOTA PEMBELIAN INDOMI NITE*\n`;
    text += `--------------------------------\n`;
    text += `ID Pesanan: #${order.id}\n`;
    text += `Tanggal: ${date} ${time}\n`;
    text += `Pelanggan: ${order.customerName}\n`;
    text += `--------------------------------\n`;
    text += `*Item:*\n`;
    order.items.forEach(cart => {
      text += `- ${cart.item.name} x${cart.quantity}\n`;
      if (cart.toppings.length > 0) {
        text += `  Topping: ${cart.toppings.join(', ')}\n`;
      }
      if (cart.notes) {
        text += `  Catatan: ${cart.notes}\n`;
      }
    });
    text += `--------------------------------\n`;
    text += `*TOTAL: Rp ${order.total.toLocaleString()}*\n`;
    text += `--------------------------------\n`;
    text += `Terima kasih sudah memesan di Indomi Nite!`;
    return text;
  };

  const handleShareWhatsApp = (order: Order) => {
    if (!order.customerPhone) {
      alert('Nomor WhatsApp pelanggan tidak tersedia.');
      return;
    }
    const text = encodeURIComponent(generateReceiptText(order));
    const url = `https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${text}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = (order: Order) => {
    if (!order.customerEmail) {
      alert('Email pelanggan tidak tersedia.');
      return;
    }
    const subject = encodeURIComponent(`Nota Pembelian Indomi Nite - #${order.id}`);
    const body = encodeURIComponent(generateReceiptText(order).replace(/\*/g, ''));
    const url = `mailto:${order.customerEmail}?subject=${subject}&body=${body}`;
    window.open(url, '_blank');
  };

  const handleDownloadReport = () => {
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    let csvContent = "Laporan Penjualan Indomi Nite\n";
    csvContent += `Tanggal: ${date}\n\n`;
    csvContent += "ID Pesanan,Pelanggan,Menu,Total,Waktu,Status\n";
    
    orders.forEach(order => {
      const items = order.items.map(i => i.item.name).join('; ');
      const time = order.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      csvContent += `${order.id},${order.customerName},${items},${order.total},${time},${order.status}\n`;
    });
    
    csvContent += `\nTotal Pendapatan: Rp ${totalRevenue.toLocaleString()}\n`;
    csvContent += `Total Pesanan: ${totalOrders}\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_IndomiNite_${date.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate total profit based on HPP
  const totalProfit = useMemo(() => {
    return orders.reduce((totalProfit, order) => {
      let orderHpp = 0;
      order.items.forEach(cartItem => {
        // Base HPP
        let itemHpp = 0;
        if (cartItem.item.name.includes('Goreng')) {
          itemHpp = 4018;
        } else {
          itemHpp = (cartItem.item.priceNum || 0) * 0.7;
        }
        orderHpp += itemHpp * cartItem.quantity;

        // Toppings HPP
        cartItem.toppings.forEach(toppingName => {
          if (toppingName === 'Telur Rebus') {
            orderHpp += 2500 * cartItem.quantity;
          } else {
            // Default 30% margin for other toppings
            // We need to find the topping price. 
            // Since we don't have a global topping list easily accessible here, 
            // we'll use a heuristic or just assume 70% HPP.
            const toppingPrice = toppingName === 'Sosis' ? 1000 : 1000; // Simplified
            orderHpp += toppingPrice * 0.7 * cartItem.quantity;
          }
        });
      });
      return totalProfit + (order.total - orderHpp);
    }, 0);
  }, [orders]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const result = [];
    
    // Start from March 2026
    const startYear = 2026;
    const startMonth = 2; // March is index 2

    for (let i = 0; i < 10; i++) { // Mar to Dec
      const monthIdx = startMonth + i;
      const year = startYear;
      
      const monthSales = orders.filter(o => 
        o.timestamp.getMonth() === monthIdx && 
        o.timestamp.getFullYear() === year
      ).length;
      
      result.push({
        name: months[monthIdx],
        sales: monthSales
      });
    }
    return result;
  }, [orders]);

  // Calculate total items sold
  const totalItemsSold = totalOrders; 

  const lowStockItems = inventory.filter(item => item.stock <= (item.min || 0));

  if (viewDetail) {
    return (
      <div className="flex flex-col h-full bg-[#F5F2EA] relative">
        
        {/* Header */}
        <div className="px-6 pt-4 pb-4 flex items-center justify-between">
          <button 
            onClick={() => setViewDetail(false)}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#3D2B1F]/5 text-[#3D2B1F]"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-bold text-[#3D2B1F]">Detail Perhitungan Bahan</h2>
          <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#3D2B1F]/5 text-[#3D2B1F]">
            <div className="flex gap-1">
              <div className="h-1 w-1 bg-[#3D2B1F] rounded-full"></div>
              <div className="h-1 w-1 bg-[#3D2B1F] rounded-full"></div>
              <div className="h-1 w-1 bg-[#3D2B1F] rounded-full"></div>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#3D2B1F]">Ringkasan Penggunaan</h3>
            <p className="text-xs text-[#3D2B1F]/40">Update terakhir: Hari ini, 18:30</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-[#3D2B1F]/5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-[#3D2B1F]/60">
                <Trash2 size={14} />
                <span className="text-xs font-bold">Total Terpakai</span>
              </div>
              <p className="text-2xl font-bold text-[#3D2B1F] leading-none mb-1">{totalItemsSold}</p>
              <p className="text-lg font-bold text-[#3D2B1F] mb-2">Porsi</p>
              <p className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                <TrendingUp size={10} /> Baru Mulai
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#3D2B1F]/5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-[#3D2B1F]/60">
                <AlertTriangle size={14} />
                <span className="text-xs font-bold">Total Pendapatan</span>
              </div>
              <p className="text-2xl font-bold text-[#3D2B1F] leading-none mb-1">{(totalRevenue / 1000).toFixed(0)}k</p>
              <p className="text-lg font-bold text-[#3D2B1F] mb-2">Rupiah</p>
              <p className="text-[10px] font-bold text-[#3D2B1F]/40 flex items-center gap-1">
                -
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#3D2B1F]">Daftar Bahan Baku</h3>
            <button className="text-xs font-bold text-[#D4AF37]">Lihat Semua</button>
          </div>

          <div className="space-y-4 mb-8">
            {inventory.map((item) => {
              const IconComponent = IconMap[item.icon] || Package;
              const isLowStock = item.stock <= (item.min || 0);
              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#3D2B1F]/5 shadow-sm flex items-center gap-4">
                  <div className={`h-16 w-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${item.color}`}>
                    <IconComponent size={32} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#3D2B1F] text-sm">{item.name}</p>
                    <p className="text-xs text-[#3D2B1F]/40 mt-1">Dibutuhkan: {item.max} {item.unit} | Stok: {item.stock} {item.unit}</p>
                    <div className="h-1.5 w-full bg-[#3D2B1F]/5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isLowStock ? 'bg-red-500' : item.stock < item.max * 0.5 ? 'bg-orange-400' : 'bg-green-500'}`}
                        style={{ width: `${(item.stock / item.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    {isLowStock ? (
                      <>
                        <div className="h-6 w-6 rounded-full bg-[#3D2B1F]/10 flex items-center justify-center text-[#3D2B1F] mb-1">
                          <Package size={14} />
                        </div>
                        <span className="text-[8px] font-bold text-[#3D2B1F] uppercase tracking-wider">KRITIS</span>
                      </>
                    ) : item.stock < item.max * 0.5 ? (
                      <>
                        <div className="h-6 w-6 rounded-full bg-[#3D2B1F]/10 flex items-center justify-center text-[#3D2B1F] mb-1">
                          <Package size={14} />
                        </div>
                        <span className="text-[8px] font-bold text-[#3D2B1F] uppercase tracking-wider">MENIPIS</span>
                      </>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                        <CheckCircle size={14} fill="currentColor" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F2EA] relative">
      {!isFirebaseConfigured && (
        <div className="bg-red-500 text-white px-6 py-2 text-[10px] font-bold text-center uppercase tracking-widest z-50">
          Firebase Belum Dikonfigurasi - Data Tidak Akan Tersimpan/Muncul
        </div>
      )}
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between bg-white shadow-sm z-10 relative">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="text-[#3D2B1F] p-2 -ml-2 rounded-full hover:bg-[#3D2B1F]/5"
        >
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-[#3D2B1F]"></div>
            <div className="w-3 h-0.5 bg-[#3D2B1F]"></div>
            <div className="w-5 h-0.5 bg-[#3D2B1F]"></div>
          </div>
        </button>
        <h1 className="text-lg font-bold text-[#3D2B1F]">Indomi Nite</h1>
        <button 
          onClick={() => setActiveTab('pengaturan')}
          className="h-9 w-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors"
        >
          <User size={18} />
        </button>
      </div>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-64 bg-[#F5F2EA] z-50 shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-serif font-bold text-[#3D2B1F]">Menu</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#3D2B1F] shadow-sm"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-2 flex-1">
                {[
                  { id: 'beranda', label: 'Beranda', icon: Home },
                  { id: 'laporan', label: 'Laporan', icon: BarChart3 },
                  { id: 'stok', label: 'Stok', icon: Package },
                  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
                ].map((menu) => (
                  <button 
                    key={menu.id}
                    onClick={() => {
                      setActiveTab(menu.id as any);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${activeTab === menu.id ? 'bg-[#3D2B1F] text-white shadow-lg' : 'text-[#3D2B1F] hover:bg-[#3D2B1F]/5'}`}
                  >
                    <menu.icon size={20} />
                    <span className="font-bold text-sm">{menu.label}</span>
                  </button>
                ))}
                
                {/* Switch to Customer Mode Button */}
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSwitchToCustomer();
                  }}
                  className="w-full p-4 rounded-xl flex items-center gap-4 transition-all text-[#3D2B1F] hover:bg-[#3D2B1F]/5 mt-4 border-t border-[#3D2B1F]/10"
                >
                  <Utensils size={20} />
                  <span className="font-bold text-sm">Mode Pelanggan</span>
                </button>
              </div>

              <div className="pt-6 border-t border-[#3D2B1F]/10">
                <button 
                  onClick={onLogout}
                  className="w-full p-4 rounded-xl bg-red-50 text-red-600 font-bold flex items-center gap-4 hover:bg-red-100 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="text-sm">Keluar</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-6">
        {activeTab === 'beranda' && (
          <>
            {/* Quick Stats Today */}
            <div className="mb-8">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-[#3D2B1F]/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-widest mb-1">Total Pesanan Hari Ini</p>
                  <p className="text-3xl font-bold text-[#3D2B1F]">
                    {orders.filter(o => o.timestamp.toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-[#3D2B1F]/5 flex items-center justify-center text-[#3D2B1F]">
                  <ShoppingBag size={28} />
                </div>
              </div>
            </div>

            {/* Active Orders Section */}
            {orders.filter(o => o.status !== 'selesai').length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#3D2B1F]">Pesanan Masuk (Aktif)</h3>
                  <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full">
                    {orders.filter(o => o.status !== 'selesai').length} Pesanan
                  </span>
                </div>
                <div className="space-y-3">
                  {orders.filter(o => o.status !== 'selesai').map(order => (
                    <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#3D2B1F] text-base">{order.customerName}</p>
                          <p className="text-xs text-[#3D2B1F]/60 mt-0.5">
                            {order.items.map(i => `${i.item.name} x${i.quantity}`).join(', ')}
                          </p>
                          <p className="text-[10px] text-[#3D2B1F]/40 mt-1 font-medium">
                            Dipesan pukul {order.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                            order.status === 'diterima' ? 'bg-blue-50 text-blue-600' :
                            order.status === 'dimasak' ? 'bg-orange-50 text-orange-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>
                            {order.status}
                          </span>
                          <p className="text-xs font-bold text-[#3D2B1F]">Rp {order.total.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t border-[#3D2B1F]/5">
                        <button 
                          onClick={() => onUpdateOrderStatus(order.id, 'selesai')}
                          className="flex-1 bg-[#3D2B1F] text-white text-xs font-bold py-3 rounded-xl shadow-lg hover:bg-black transition-all active:scale-95"
                        >
                          Selesaikan Pesanan
                        </button>
                        <button 
                          onClick={() => handleShareWhatsApp(order)}
                          className="h-11 w-11 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors"
                          title="Kirim Nota WA"
                        >
                          <Phone size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pesanan Selesai Hari Ini */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-[#3D2B1F]/5">
              <h3 className="font-bold text-[#3D2B1F] mb-4">Pesanan Selesai Hari Ini</h3>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'selesai' && o.timestamp.toDateString() === new Date().toDateString()).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-16 w-16 rounded-full bg-[#3D2B1F]/5 flex items-center justify-center text-[#3D2B1F]/20 mb-3">
                      <CheckCircle size={32} />
                    </div>
                    <p className="text-sm text-[#3D2B1F]/40">Belum ada pesanan selesai hari ini.</p>
                  </div>
                ) : (
                  orders.filter(o => o.status === 'selesai' && o.timestamp.toDateString() === new Date().toDateString()).map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b border-[#3D2B1F]/5 pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-[#3D2B1F] text-sm">{order.customerName}</p>
                        <p className="text-[10px] text-[#3D2B1F]/50">
                          {order.items[0].item.name} {order.items.length > 1 ? `+${order.items.length - 1} lainnya` : ''} • {order.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#3D2B1F] text-sm">Rp {order.total.toLocaleString()}</p>
                        <div className="flex items-center justify-end gap-1 text-green-600">
                          <CheckCircle size={10} />
                          <span className="text-[10px] font-bold uppercase">Selesai</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'laporan' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('beranda')}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/5 shadow-sm"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="text-xl font-bold text-[#3D2B1F]">Laporan Penjualan</h2>
              </div>
              <button 
                onClick={handleDownloadReport}
                className="flex items-center gap-2 bg-[#3D2B1F] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-black transition-all active:scale-95"
              >
                <ReceiptText size={14} /> Download CSV
              </button>
            </div>
            
            {/* Report Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#3D2B1F]/5">
                <p className="text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-widest mb-1">Total Omzet</p>
                <p className="text-xl font-bold text-[#3D2B1F]">Rp {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#3D2B1F]/5">
                <p className="text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-widest mb-1">Estimasi Profit</p>
                <p className="text-xl font-bold text-green-600">Rp {totalProfit.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#3D2B1F]/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#3D2B1F]">Grafik Penjualan Harian ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorSales2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorSales2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#3D2B1F]/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#3D2B1F]">Grafik Penjualan Bulanan ({new Date().getFullYear()})</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="sales" fill="#3D2B1F" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stok' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setActiveTab('beranda')}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/5 shadow-sm"
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-xl font-bold text-[#3D2B1F]">Manajemen Stok</h2>
            </div>
            
            {/* Low Stock Notifications */}
            {lowStockItems.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-800">Stok Menipis: {lowStockItems.length} Item</p>
                  <p className="text-[10px] text-red-600">
                    {lowStockItems.slice(0, 2).map(i => i.name).join(', ')} {lowStockItems.length > 2 ? '...' : ''} hampir habis.
                  </p>
                </div>
              </div>
            )}

            {/* Editable Stock Management */}
              <div className="space-y-4">
                <h3 className="font-bold text-[#3D2B1F]">Manajemen Stok Bahan</h3>
              {inventory.map((item) => {
                const IconComponent = IconMap[item.icon] || Package;
                const isLowStock = item.stock <= (item.min || 0);
                return (
                  <div key={item.id} className="bg-white p-5 rounded-2xl border border-[#3D2B1F]/5 shadow-sm flex items-center justify-between relative group">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden ${item.color}`}>
                           {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                           ) : (
                             <IconComponent size={24} />
                           )}
                        </div>
                        <p className="font-bold text-[#3D2B1F]">{item.name}</p>
                      </div>
                      <p className={`text-xs font-bold ${item.stock === 0 ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-green-600'}`}>
                        {item.stock === 0 ? 'Habis' : isLowStock ? 'Stok Menipis' : 'Tersedia'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onUpdateStock(item.id, Math.max(0, item.stock - 1))}
                        className="h-8 w-8 rounded-full bg-[#3D2B1F]/5 flex items-center justify-center text-[#3D2B1F] hover:bg-[#3D2B1F]/10"
                      >
                        <Minus size={16} />
                      </button>
                      <input 
                        type="number"
                        value={item.stock}
                        onChange={(e) => onUpdateStock(item.id, parseFloat(e.target.value) || 0)}
                        className="w-16 text-center font-bold text-[#3D2B1F] text-sm bg-[#F5F2EA] rounded-lg py-1"
                      />
                      <span className="text-xs font-bold text-[#3D2B1F]/40">{item.unit}</span>
                      <button 
                        onClick={() => onUpdateStock(item.id, item.stock + 1)}
                        className="h-8 w-8 rounded-full bg-[#3D2B1F] text-white flex items-center justify-center hover:bg-black"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'pengaturan' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setActiveTab('beranda')}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/5 shadow-sm"
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-xl font-bold text-[#3D2B1F]">Pengaturan</h2>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#3D2B1F]/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-[#D4AF37] flex items-center justify-center text-white text-2xl font-bold">
                  O
                </div>
                <div>
                  <h3 className="font-bold text-[#3D2B1F]">Owner Account</h3>
                  <p className="text-xs text-[#3D2B1F]/60">indominite@gmail.com</p>
                  <div className="flex items-center gap-1 mt-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                    <CheckCircle size={10} />
                    <span className="text-[9px] font-bold">Terhubung & Sinkronisasi Otomatis</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                 <button 
                  onClick={onSwitchToCustomer}
                  className="w-full py-4 rounded-xl bg-[#3D2B1F]/5 text-[#3D2B1F] font-bold flex items-center justify-center gap-2 hover:bg-[#3D2B1F]/10 transition-colors"
                >
                  <Utensils size={20} /> Mode Pelanggan
                </button>
              </div>

              <button 
                onClick={onLogout}
                className="w-full py-4 rounded-xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              >
                <LogOut size={20} /> Keluar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="bg-white h-20 border-t border-[#3D2B1F]/5 flex items-center justify-around px-6">
        <button 
          onClick={() => setActiveTab('beranda')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'beranda' ? 'text-[#3D2B1F]' : 'text-[#3D2B1F]/30'}`}
        >
          <Home size={20} />
          <span className="text-[9px] font-bold">Beranda</span>
        </button>
        <button 
          onClick={() => setActiveTab('laporan')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'laporan' ? 'text-[#3D2B1F]' : 'text-[#3D2B1F]/30'}`}
        >
          <BarChart3 size={20} />
          <span className="text-[9px] font-bold">Laporan</span>
        </button>
        <button 
          onClick={() => setActiveTab('stok')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'stok' ? 'text-[#3D2B1F]' : 'text-[#3D2B1F]/30'}`}
        >
          <ReceiptText size={20} />
          <span className="text-[9px] font-bold">Stok</span>
        </button>
        <button 
          onClick={() => setActiveTab('pengaturan')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'pengaturan' ? 'text-[#3D2B1F]' : 'text-[#3D2B1F]/30'}`}
        >
          <Settings size={20} />
          <span className="text-[9px] font-bold">Pengaturan</span>
        </button>
      </div>
    </div>
  );
}

function HomeScreen({ 
  address, addresses, setAddresses, customerName, customerPhone, customerEmail, onCheckout, onSelectItem, hasActiveOrder, 
  activeTab, setActiveTab, activeCategory, setActiveCategory, searchQuery, setSearchQuery,
  onAddressChange, onViewOrders, cart, onLogout, userRole, onOpenOwnerDashboard, onUpdateProfile, orders, onBackToWelcome,
  onRemoveFromCart
}: { 
  address: string, addresses: any[], setAddresses: React.Dispatch<React.SetStateAction<any[]>>, customerName: string, customerPhone: string, customerEmail: string, onCheckout: () => void, onSelectItem: (item: any) => void, hasActiveOrder: boolean, 
  activeTab: string, setActiveTab: (t: string) => void, activeCategory: string, setActiveCategory: (c: string) => void, searchQuery: string, setSearchQuery: (q: string) => void,
  onAddressChange: (addr: string) => void, onViewOrders?: () => void, cart?: CartItem[], onLogout?: () => void, userRole?: 'guest' | 'customer' | 'owner', onOpenOwnerDashboard?: () => void, onUpdateProfile?: (name: string, phone: string, email: string) => void, orders: Order[], onBackToWelcome: () => void,
  onRemoveFromCart?: (index: number) => void
}) {
  const [notification, setNotification] = useState<string | null>(null);
  const [profileSubView, setProfileSubView] = useState<string | null>(null);

  // Profile States
  const [userProfile, setUserProfile] = useState({
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    image: ''
  });

  useEffect(() => {
    setUserProfile(prev => ({
      ...prev,
      name: customerName,
      email: customerEmail,
      phone: customerPhone
    }));
  }, [customerName, customerEmail, customerPhone]);


  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('TUNAI');
  const [notifSettings, setNotifSettings] = useState({
    promo: true,
    status: true,
    newsletter: false
  });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({ label: '', detail: '' });

  // Drag to scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    // Sync main address when prop changes
    setAddresses(prev => prev.map(addr => 
      addr.isMain ? { ...addr, detail: address } : addr
    ));
  }, [address]);

  useEffect(() => {
    setProfileSubView(null); // Reset subview when tab changes
  }, [activeTab]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };



  const handleProfileClick = () => {
    setActiveTab('profile');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const menuItems = [
    { 
      name: 'Indomie Goreng Klasik', 
      type: 'Mie • Polos', 
      price: 'Rp 6.000', 
      priceNum: 6000,
      rating: '4.9', 
      time: '5-10 min', 
      delivery: 'Gratis Ongkir', 
      img: 'https://raw.githubusercontent.com/Dinni-hub/indomi-spesial-goreng/main/Tolong_buatkan_indomi_goreng_polos_dengan_taburan__05ef31bed7.jpeg', 
      categories: ['Mie'],
      description: 'Original, gurih, dan bikin nagih'
    },
    { 
      name: 'Telur Gulung', 
      type: 'Snack • Gurih', 
      price: 'Rp 1.000 / tusuk', 
      priceNum: 1000,
      rating: '4.9', 
      time: '5-10 min', 
      delivery: 'Gratis Ongkir', 
      img: 'https://raw.githubusercontent.com/Dinni-hub/telur-gulung-2/main/Telur%20Gulung%20Jajanan%20Lezat%20Gampang%20Dibuat%20-%20Resep%20_%20ResepKoki.jpg', 
      categories: ['Snack', 'Spesial Buat Kamu'],
      description: 'Lembut, gurih, dan bikin nagih.'
    },
  ];

  return (
    <motion.div 
      key="home"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#F5F2EA]"
    >
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 left-6 right-6 z-[100] bg-[#3D2B1F] text-white p-4 rounded-2xl shadow-2xl text-center text-sm font-bold"
          >
            {notification}
          </motion.div>
        )}

      </AnimatePresence>
      
      {activeTab === 'home' && (
        <div className="flex-1 overflow-y-auto pb-40">
          {/* Header */}
          <div className="px-6 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBackToWelcome}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#3D2B1F]/5 transition-colors"
              >
                <ArrowLeft size={20} className="text-[#3D2B1F]" />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#3D2B1F]/50">{getGreeting()}</p>
                <h2 className="text-xl font-serif font-bold text-[#3D2B1F]">{userProfile.name || 'Pelanggan'}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#3D2B1F]/5">
                <Bell size={20} />
              </button>
              <div 
                className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer"
                onClick={() => setActiveTab('profile')}
              >
                <img src={userProfile.image || "https://picsum.photos/seed/user/100/100"} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Location Removed */}

          {/* Search Bar (Static in Home) */}
          <div className="px-6 mt-8">
            <h2 className="text-2xl font-serif font-bold text-[#3D2B1F]">Pilih menu sesukamu</h2>
          </div>



          {/* Categories */}
          <div className="mt-6">
            <div className="px-6 mb-3">
              <h3 className="text-xl font-bold text-[#3D2B1F]">Kategori</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto px-6 pb-2 no-scrollbar">
              {[
                { name: 'Mie', icon: <Utensils size={20} /> },
                { name: 'Snack', icon: <Cookie size={20} /> },
              ].map((cat, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveCategory(cat.name)}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-md transition-all ${activeCategory === cat.name ? 'bg-[#3D2B1F] text-white' : 'bg-white text-[#3D2B1F]'}`}>
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-bold text-[#3D2B1F]">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Section */}
          <div className="mt-6 px-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#3D2B1F]">Menu {activeCategory}</h3>
            </div>
            <div className="space-y-6">
              {menuItems.filter(item => item.categories.includes(activeCategory)).map((rest, i) => (
                <div 
                  key={i} 
                  onClick={() => onSelectItem(rest)}
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-[#3D2B1F]/5 shadow-sm cursor-pointer group"
                >
                  <div className="h-64 w-full overflow-hidden bg-white">
                    <img 
                      src={rest.img} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                      alt={rest.name} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xl font-bold text-[#3D2B1F]">{rest.name}</h4>
                      <p className="font-bold text-[#3D2B1F]">{rest.price}</p>
                    </div>
                    <p className="text-sm text-[#3D2B1F]/60 mb-4 leading-relaxed">
                      {rest.description}
                    </p>
                    <div className="flex items-center gap-6 pt-4 border-t border-[#3D2B1F]/5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#3D2B1F]/70">
                        <Clock size={16} className="text-[#D4AF37]" /> 
                        <span>{rest.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-[#3D2B1F]/70">
                        <Bike size={16} className="text-[#D4AF37]" /> 
                        <span>{rest.delivery}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {menuItems.filter(item => item.categories.includes(activeCategory)).length === 0 && (
                <p className="text-center text-[#3D2B1F]/40 py-10">Belum ada menu untuk kategori ini.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="px-6 pt-4 flex-1 flex flex-col overflow-y-auto pb-40">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setActiveTab('home')}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/5 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" size={18} />
              <input 
                autoFocus
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu favoritmu..." 
                className="w-full h-12 bg-white rounded-2xl pl-12 pr-4 text-sm font-medium border border-[#3D2B1F]/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/10"
              />
            </div>
          </div>

          <div className="space-y-6">
            {menuItems.filter(item => 
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              item.description.toLowerCase().includes(searchQuery.toLowerCase())
            ).length > 0 ? (
              menuItems.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((rest, i) => (
                <div 
                  key={i} 
                  onClick={() => onSelectItem(rest)}
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-[#3D2B1F]/5 shadow-sm cursor-pointer group"
                >
                  <div className="h-48 w-full overflow-hidden bg-white">
                    <img 
                      src={rest.img} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                      alt={rest.name} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-[#3D2B1F]">{rest.name}</h4>
                      <p className="font-bold text-[#3D2B1F] text-sm">{rest.price}</p>
                    </div>
                    <p className="text-xs text-[#3D2B1F]/60 leading-relaxed">
                      {rest.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 rounded-full bg-[#3D2B1F]/5 flex items-center justify-center text-[#3D2B1F]/20 mb-4">
                  <Search size={40} />
                </div>
                <p className="text-[#3D2B1F]/60 font-bold">Menu tidak ditemukan</p>
                <p className="text-xs text-[#3D2B1F]/40 mt-1">Coba cari dengan kata kunci lain</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'riwayat' && (
        <div className="px-6 pt-4 flex-1 flex flex-col overflow-y-auto pb-40">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setActiveTab('home')}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/5 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-3xl font-serif text-[#3D2B1F]">Riwayat Pesanan</h2>
          </div>
          
          {orders.filter(o => o.customerName === customerName).length > 0 ? (
            <div className="space-y-4">
              {orders.filter(o => o.customerName === customerName).map((order) => (
                <div key={order.id} className="bg-white p-4 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#3D2B1F]/60">#{order.id}</span>
                      <span className={`text-[10px] font-bold uppercase ${order.status === 'selesai' ? 'text-green-500' : order.status === 'dibatalkan' ? 'text-red-500' : 'text-orange-500'}`}>
                        {order.status}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#3D2B1F]">{order.timestamp.toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-sm text-[#3D2B1F]">{item.item.name} x{item.quantity}</p>
                    ))}
                  </div>
                  <div className="text-xs text-[#3D2B1F]/70">
                    <p>Alamat: {order.customerAddress || '-'}</p>
                    <p>Pembayaran: {order.paymentMethod || '-'}</p>
                    <p className="font-bold mt-1">Total: Rp {order.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#3D2B1F]/40 py-10">Belum ada riwayat pembelian.</p>
          )}
        </div>
      )}

      {activeTab === 'cart' && (
        <div className="px-6 pt-4 flex-1 flex flex-col overflow-y-auto pb-40">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setActiveTab('home')}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/5 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-3xl font-serif text-[#3D2B1F]">Keranjang</h2>
          </div>
          
          {cart && cart.length > 0 ? (
            <div className="space-y-6">
              {cart.map((cartItem, idx) => (
                <div key={idx} className="bg-white p-4 rounded-[2rem] flex gap-4 border border-[#3D2B1F]/5 shadow-sm">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden shrink-0">
                    <img src={cartItem.item.img} className="w-full h-full object-cover" alt={cartItem.item.name} referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#3D2B1F]">{cartItem.item.name}</h4>
                    <p className="text-xs text-[#3D2B1F]/60 mt-1">
                      {cartItem.quantity}x • Rp {cartItem.totalPrice.toLocaleString()}
                    </p>
                    {cartItem.toppings.length > 0 && (
                      <p className="text-[10px] text-[#3D2B1F]/40 mt-1 truncate">
                        {cartItem.toppings.join(', ')}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => onRemoveFromCart && onRemoveFromCart(idx)}
                    className="h-10 w-10 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              
              <div className="pt-4 border-t border-[#3D2B1F]/10 mt-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-[#3D2B1F]">Total Pembayaran</span>
                  <span className="text-xl font-bold text-[#3D2B1F]">
                    Rp {cart.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                  </span>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full h-14 bg-[#3D2B1F] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
                >
                  Lanjut Pembayaran
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="h-24 w-24 rounded-full bg-[#3D2B1F]/5 flex items-center justify-center text-[#3D2B1F]/20 mb-4">
                <ShoppingBag size={48} />
              </div>
              <p className="text-[#3D2B1F]/60 font-bold">Keranjang Kosong</p>
              <p className="text-xs text-[#3D2B1F]/40 mt-1">Yuk, cari menu favoritmu!</p>
              <button 
                onClick={() => setActiveTab('home')}
                className="mt-8 px-8 py-3 bg-[#3D2B1F] text-white rounded-xl font-bold text-sm"
              >
                Cari Menu
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="px-6 pt-4 flex-1 flex flex-col overflow-y-auto pb-40">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setActiveTab('home')}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/5 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-3xl font-serif text-[#3D2B1F]">Orders</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
            <div className="h-24 w-24 rounded-full bg-[#3D2B1F]/5 flex items-center justify-center text-[#3D2B1F]/20 mb-4">
              <ReceiptText size={48} />
            </div>
            {hasActiveOrder ? (
              <>
                <p className="text-[#3D2B1F]/60 font-bold">Ada pesanan aktif!</p>
                <p className="text-xs text-[#3D2B1F]/40 mt-1">Pesanan spesialmu sedang dalam proses.</p>
                <button 
                  onClick={() => onViewOrders && onViewOrders()}
                  className="mt-8 px-8 py-3 bg-[#D4AF37] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#D4AF37]/30"
                >
                  Lihat Orders
                </button>
              </>
            ) : (
              <>
                <p className="text-[#3D2B1F]/60 font-bold">Tidak ada pesanan aktif</p>
                <p className="text-xs text-[#3D2B1F]/40 mt-1">Keinginan makan malam Anda akan muncul di sini.</p>
                <button 
                  onClick={() => setActiveTab('home')}
                  className="mt-8 px-8 py-3 bg-[#3D2B1F] text-white rounded-xl font-bold text-sm"
                >
                  Pesan Sekarang
                </button>
              </>
            )}
          </div>
        </div>
      )}



      {activeTab === 'profile' && (
        <>
        <div className="px-6 pt-4 flex-1 flex flex-col overflow-y-auto pb-40">
          {!profileSubView ? (
            <>
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setActiveTab('home')}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/5 shadow-sm"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-3xl font-serif text-[#3D2B1F]">Profil</h2>
              </div>
              <div className="flex flex-col items-center mb-10">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-xl mb-4 cursor-pointer" onClick={() => document.getElementById('profile-upload')?.click()}>
                    <img src={userProfile.image || "https://picsum.photos/seed/user/200/200"} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles size={24} className="text-white" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    id="profile-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const imageUrl = URL.createObjectURL(file);
                        setUserProfile(prev => ({ ...prev, image: imageUrl }));
                        showNotification("Foto profil diperbarui!");
                      }
                    }}
                  />
                </div>
                <h3 className="text-xl font-bold text-[#3D2B1F]">{userProfile.name || 'Pelanggan'}</h3>
                <p className="text-sm text-[#3D2B1F]/50">{userProfile.email}</p>
              </div>
              <div className="space-y-4 pb-36">
                {[
                  { name: 'Pengaturan Akun', icon: <Settings size={20} /> },
                  { name: 'Metode Pembayaran', icon: <CreditCard size={20} /> },
                  { name: 'Alamat Pengiriman', icon: <Box size={20} /> },
                  { name: 'Pusat Bantuan', icon: <HelpCircle size={20} /> }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProfileSubView(item.name)}
                    className="bg-white p-5 rounded-2xl flex items-center justify-between border border-[#3D2B1F]/5 shadow-sm cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-[#3D2B1F]/40">{item.icon}</div>
                      <span className="font-bold text-[#3D2B1F] text-sm md:text-base">{item.name}</span>
                    </div>
                    <ChevronDown size={18} className="text-[#3D2B1F]/30 -rotate-90" />
                  </motion.div>
                ))}
                
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    showNotification("Anda telah keluar.");
                    if (onLogout) onLogout();
                  }}
                  className="w-full mt-4 p-5 rounded-2xl flex items-center justify-center gap-3 bg-red-50 text-red-600 font-bold border border-red-100"
                >
                  <LogOut size={20} />
                  Keluar Akun
                </motion.button>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setProfileSubView(null)}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/5 shadow-sm"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-serif text-[#3D2B1F]">{profileSubView}</h2>
              </div>

              {profileSubView === 'Pengaturan Akun' && (
                <div className="space-y-6 pb-36">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#3D2B1F]/40 ml-2">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={userProfile.name} 
                      onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                      className="w-full h-14 bg-white rounded-2xl px-6 text-sm font-medium border border-[#3D2B1F]/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/10" 
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#3D2B1F]/40 ml-2">Nomor Telepon</label>
                    <input 
                      type="tel" 
                      value={userProfile.phone} 
                      onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                      className="w-full h-14 bg-white rounded-2xl px-6 text-sm font-medium border border-[#3D2B1F]/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/10" 
                      placeholder="Contoh: 08123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#3D2B1F]/40 ml-2">Email</label>
                    <input 
                      type="email" 
                      value={userProfile.email} 
                      onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                      className="w-full h-14 bg-white rounded-2xl px-6 text-sm font-medium border border-[#3D2B1F]/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/10" 
                      placeholder="Contoh: budi@gmail.com"
                    />
                  </div>
                </div>
              )}

              {profileSubView === 'Metode Pembayaran' && (
                <div className="space-y-4 pb-36">

                  <div 
                    onClick={() => setSelectedPaymentMethod('QRIS')}
                    className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${selectedPaymentMethod === 'QRIS' ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] shadow-lg' : 'bg-white text-[#3D2B1F] border-[#3D2B1F]/5 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${selectedPaymentMethod === 'QRIS' ? 'bg-white/10' : 'bg-blue-50 text-blue-600'}`}>
                        <QrCode size={24} />
                      </div>
                      <div>
                        <p className="font-bold">QRIS</p>
                        <p className={`text-xs ${selectedPaymentMethod === 'QRIS' ? 'text-white/60' : 'text-[#3D2B1F]/40'}`}>Scan & Bayar</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'QRIS' ? <CheckCircle size={20} /> : <div className="text-[#D4AF37] text-xs font-bold">PILIH</div>}
                  </div>

                  <div 
                    onClick={() => setSelectedPaymentMethod('TUNAI')}
                    className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${selectedPaymentMethod === 'TUNAI' ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] shadow-lg' : 'bg-white text-[#3D2B1F] border-[#3D2B1F]/5 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${selectedPaymentMethod === 'TUNAI' ? 'bg-white/10' : 'bg-green-50 text-green-600'}`}>
                        <Banknote size={24} />
                      </div>
                      <div>
                        <p className="font-bold">TUNAI</p>
                        <p className={`text-xs ${selectedPaymentMethod === 'TUNAI' ? 'text-white/60' : 'text-[#3D2B1F]/40'}`}>Bayar di Tempat</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'TUNAI' ? <CheckCircle size={20} /> : <div className="text-[#D4AF37] text-xs font-bold">PILIH</div>}
                  </div>
                </div>
              )}

              {profileSubView === 'Alamat Pengiriman' && (
                <div className="space-y-6 pb-36">
                  <div className="bg-white p-6 rounded-3xl border border-[#3D2B1F]/5 shadow-sm">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#3D2B1F]/40 ml-2">Lokasi Pengiriman (Area Kampus)</label>
                        <textarea 
                          placeholder="Contoh: depan gedung E, depan gedung U, kantin kejujuran"
                          value={address}
                          onChange={(e) => onAddressChange(e.target.value)}
                          className="w-full h-32 bg-stone-50 rounded-2xl p-4 text-sm font-medium border border-[#3D2B1F]/5 focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/10 resize-none placeholder:text-[#3D2B1F]/30" 
                        />
                        <p className="text-xs text-[#3D2B1F]/40 ml-2">
                          Masukkan detail lokasi Anda di area kampus agar kurir mudah menemukan Anda.
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          if (!address.trim()) {
                            showNotification("Mohon isi lokasi pengiriman.");
                            return;
                          }
                          showNotification("Lokasi pengiriman diperbarui!");
                          setProfileSubView(null);
                        }}
                        className="w-full h-14 bg-[#3D2B1F] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
                      >
                        Simpan Lokasi
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {profileSubView === 'Notifikasi' && (
                <div className="space-y-4 pb-36">
                  {[
                    { key: 'promo', title: 'Promo & Penawaran', desc: 'Dapatkan info diskon terbaru' },
                    { key: 'orders', title: 'Status Pesanan', desc: 'Update real-time pesananmu' },
                    { key: 'newsletter', title: 'Email Newsletter', desc: 'Berita kuliner mingguan' }
                  ].map((notif) => (
                    <div key={notif.key} className="bg-white p-5 rounded-2xl border border-[#3D2B1F]/5 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#3D2B1F]">{notif.title}</p>
                        <p className="text-xs text-[#3D2B1F]/40">{notif.desc}</p>
                      </div>
                      <div 
                        onClick={() => setNotifSettings({...notifSettings, [notif.key]: !notifSettings[notif.key as keyof typeof notifSettings]})}
                        className={`h-6 w-12 rounded-full relative p-1 cursor-pointer transition-colors ${notifSettings[notif.key as keyof typeof notifSettings] ? 'bg-[#3D2B1F]' : 'bg-[#3D2B1F]/10'}`}
                      >
                        <motion.div 
                          animate={{ x: notifSettings[notif.key as keyof typeof notifSettings] ? 24 : 0 }}
                          className="h-4 w-4 bg-white rounded-full shadow-sm"
                        ></motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {profileSubView === 'Pusat Bantuan' && (
                <div className="space-y-4 pb-36">
                  <div className="bg-white p-6 rounded-3xl border border-[#3D2B1F]/5 shadow-sm text-center">
                    <div className="h-20 w-20 rounded-full bg-[#3D2B1F]/5 flex items-center justify-center text-[#3D2B1F] mx-auto mb-4">
                      <HelpCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-[#3D2B1F] mb-2">Ada Kendala?</h3>
                    <p className="text-sm text-[#3D2B1F]/60 mb-6">Tim dukungan kami siap membantumu 24/7 untuk setiap pesanan.</p>
                    <a 
                      href="https://wa.me/6285648695615" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full h-14 bg-[#3D2B1F] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                    >
                      <Phone size={18} /> Hubungi Kami
                    </a>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#3D2B1F]/40 ml-2 mt-4">Pertanyaan Populer</p>
                    {[
                      { q: 'Cara membatalkan pesanan', a: 'Anda dapat membatalkan pesanan dalam waktu 1 menit setelah pemesanan dilakukan melalui tab Orders.' },
                      { q: 'Metode pembayaran tersedia', a: 'Kami menerima pembayaran Tunai saat pemesanan.' },
                      { q: 'Area jangkauan pengiriman', a: 'Saat ini kami melayani pengiriman untuk area kampus dan sekitarnya dalam radius 1km.' }
                    ].map((faq, i) => (
                      <div key={i} className="bg-white rounded-xl border border-[#3D2B1F]/5 overflow-hidden">
                        <div 
                          onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                        >
                          <span className="text-sm font-bold text-[#3D2B1F]">{faq.q}</span>
                          <ChevronDown size={16} className={`text-[#3D2B1F]/30 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                        </div>
                        <AnimatePresence>
                          {expandedFaq === i && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4"
                            >
                              <p className="text-xs text-[#3D2B1F]/60 leading-relaxed border-t border-[#3D2B1F]/5 pt-3">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {profileSubView === 'Pengaturan Akun' && (
          <div className="absolute bottom-28 left-6 right-6 z-30">
            <button 
              onClick={() => {
                if (onUpdateProfile) {
                  onUpdateProfile(userProfile.name, userProfile.phone, userProfile.email);
                }
                showNotification("Profil berhasil diperbarui!");
                setProfileSubView(null);
              }}
              className="w-full h-16 bg-[#3D2B1F] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              Simpan Perubahan
            </button>
          </div>
        )}
        </>
      )}

      {/* Owner Dashboard Button */}
      {userRole === 'owner' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenOwnerDashboard}
          className="absolute bottom-28 right-6 z-50 h-14 w-14 rounded-full bg-[#D4AF37] text-white shadow-xl flex items-center justify-center border-4 border-[#F5F2EA]"
        >
          <Settings size={24} />
        </motion.button>
      )}



      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-24 bg-[#3D2B1F] flex items-center justify-between px-10 rounded-t-[3.5rem] shadow-2xl z-50">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-white' : 'text-white/40'}`}
        >
          <Home size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'cart' ? 'text-white' : 'text-white/40'}`}
        >
          <div className="relative">
            <ShoppingBag size={24} />
            {cart && cart.length > 0 && (
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#3D2B1F]"></div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Keranjang</span>
        </button>
        <button 
          onClick={() => setActiveTab('riwayat')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'riwayat' ? 'text-white' : 'text-white/40'}`}
        >
          <div className="relative">
            <ReceiptText size={24} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Riwayat</span>
        </button>
        <button 
          onClick={() => {
            if (hasActiveOrder && onViewOrders) {
              onViewOrders();
            } else {
              setActiveTab('orders');
            }
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'orders' ? 'text-white' : 'text-white/40'}`}
        >
          <div className="relative">
            <ShoppingBag size={24} />
            {hasActiveOrder && (
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#3D2B1F]"></div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Pesanan</span>
        </button>
        <button 
          onClick={handleProfileClick}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-white' : 'text-white/40'}`}
        >
          <User size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </motion.div>
  );
}

function CheckoutScreen({ address, onAddressChange, paymentMethod, onPaymentMethodChange, cart, onBack, onOrderPlaced, customerName, customerPhone, customerEmail, onUpdateProfile }: { address: string, onAddressChange: (addr: string) => void, paymentMethod: string, onPaymentMethodChange: (method: string) => void, cart: CartItem[], onBack: () => void, onOrderPlaced: (name: string, phone: string, email: string, addr: string) => void, customerName: string, customerPhone: string, customerEmail: string, onUpdateProfile: (name: string, phone: string, email: string) => void }) {
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [email, setEmail] = useState(customerEmail);
  const [error, setError] = useState<string | null>(null);

  if (!cart || cart.length === 0) return null;

  const totalPayment = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const toppingsPriceMap: {[key: string]: number} = {
    'Telur Rebus': 3000,
    'Extra Es Batu': 1000,
    'Sosis': 1000,
  };

  return (
    <motion.div 
      key="checkout"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Header */}
      <div className="flex items-center px-6 pt-4 pb-2 sticky top-0 bg-[#F5F2EA]/90 backdrop-blur-sm z-20">
        <button 
          onClick={onBack}
          className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#3D2B1F]/5"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 text-center text-xl font-serif font-bold pr-10">Pembayaran</h2>
      </div>

      {/* Selection */}
      <div className="px-6 mt-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3D2B1F]/50 mb-4 border-b border-[#3D2B1F]/10 pb-2">Pilihan Anda</h3>
        <div className="space-y-6">
          {cart.map((cartItem, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 shadow-md">
                <img src={cartItem.item.img} className="w-full h-full object-cover grayscale-[0.2]" alt={cartItem.item.name} referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <p className="font-serif font-bold text-[#3D2B1F]">{cartItem.item.name}</p>
                {(!cartItem.item.categories.includes('Snack') || cartItem.item.name === 'Telur Gulung') && (
                  <div className="text-[11px] text-[#3D2B1F]/50 mt-1 space-y-0.5">
                    {cartItem.toppings.length > 0 && (
                      <p>{cartItem.toppings.join(', ')} (+Rp {cartItem.toppings.reduce((acc: number, t: string) => acc + (toppingsPriceMap[t] || 0), 0).toLocaleString()})</p>
                    )}
                    {cartItem.notes && (
                      <p className="italic">Catatan: {cartItem.notes}</p>
                    )}
                  </div>
                )}
                <p className="font-bold text-[#3D2B1F] mt-1">Rp {cartItem.totalPrice.toLocaleString()}</p>
              </div>
              <div className="bg-[#3D2B1F]/5 rounded-full px-3 py-1.5 flex items-center gap-3">
                <span className="text-sm font-bold">{cartItem.quantity}x</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Info Form */}
      <div className="px-6 mt-10">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3D2B1F]/50 mb-3">Informasi Pemesan</h3>
        <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#3D2B1F]/40 ml-2 mb-1 block">Nama Lengkap *</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 bg-white rounded-2xl px-6 text-sm font-medium border border-[#3D2B1F]/10 focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20"
                placeholder="Masukkan nama Anda"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#3D2B1F]/40 ml-2 mb-1 block">Nomor WhatsApp *</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-14 bg-white rounded-2xl px-6 text-sm font-medium border border-[#3D2B1F]/10 focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20"
                placeholder="Untuk mengirim nota pesanan"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#3D2B1F]/40 ml-2 mb-1 block">Alamat Pengiriman *</label>
              <textarea 
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                className="w-full h-24 bg-white rounded-2xl p-4 text-sm font-medium border border-[#3D2B1F]/10 focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 resize-none"
                placeholder="Contoh: depan gedung E, depan gedung U, kantin kejujuran"
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold ml-2">{error}</p>}
          </div>
        </div>



      {/* Payment */}
      <div className="px-6 mt-10">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3D2B1F]/50 mb-3">Metode Pembayaran</h3>
        <div className="space-y-3">
          <button 
            onClick={() => onPaymentMethodChange('QRIS')}
            className={`w-full p-5 rounded-2xl flex items-center gap-4 transition-all ${paymentMethod === 'QRIS' ? 'bg-[#3D2B1F]/10 border-2 border-[#3D2B1F] text-[#3D2B1F]' : 'bg-[#3D2B1F]/5 border border-[#3D2B1F]/10 text-[#3D2B1F]'}`}
          >
            <QrCode size={20} className="text-[#3D2B1F]" />
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-[#3D2B1F]">QRIS</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#3D2B1F]">SCAN UNTUK MEMBAYAR</p>
            </div>
            {paymentMethod === 'QRIS' && <CheckCircle size={20} className="text-[#3D2B1F]" />}
          </button>

          <button 
            onClick={() => onPaymentMethodChange('TUNAI')}
            className={`w-full p-5 rounded-2xl flex items-center gap-4 transition-all ${paymentMethod === 'TUNAI' ? 'bg-[#3D2B1F]/10 border-2 border-[#3D2B1F] text-[#3D2B1F]' : 'bg-[#3D2B1F]/5 border border-[#3D2B1F]/10 text-[#3D2B1F]'}`}
          >
            <Banknote size={20} className="text-[#3D2B1F]" />
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-[#3D2B1F]">TUNAI</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#3D2B1F]">SIAPKAN UANG PAS YA!</p>
            </div>
            {paymentMethod === 'TUNAI' && <CheckCircle size={20} className="text-[#3D2B1F]" />}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mx-6 mt-10 mb-6 p-6 rounded-3xl bg-[#3D2B1F]/5 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#3D2B1F]/50">Subtotal</span>
          <span className="font-bold text-[#3D2B1F]">Rp {cart.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#3D2B1F]/50">Biaya Pengiriman</span>
          <span className="font-bold text-green-600">Gratis</span>
        </div>
        <div className="h-px bg-[#3D2B1F]/10 w-full"></div>
        <div className="flex justify-between items-end pt-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3D2B1F]">Total Pembayaran</span>
          <span className="text-3xl font-serif font-bold text-[#3D2B1F] leading-none">Rp {totalPayment.toLocaleString()}</span>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="w-full px-6 pb-10 pt-4">
        <motion.button 
          onClick={() => {
            if (!name || !phone || !address) {
              setError('Mohon lengkapi Nama, Nomor WhatsApp, dan Alamat Pengiriman.');
              return;
            }
            onUpdateProfile(name, phone, email);
            onOrderPlaced(name, phone, email, address);
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#3D2B1F] text-[#F5F2EA] h-16 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl"
        >
          Pesan Sekarang
          <ShoppingBag size={20} />
        </motion.button>
      </div>
      </div>
    </motion.div>
  );
}

function DetailScreen({ item, onBack, onAddToCart, onBuyNow }: { item: any, onBack: () => void, onAddToCart: (cartDetails: CartItem) => void, onBuyNow: (cartDetails: CartItem) => void }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toppings = item.name === 'Telur Gulung'
    ? [
        { name: 'Sosis', price: 1000 }
      ]
    : [
        { name: 'Telur Rebus', price: 3000 },
      ];

  const isSnack = item.categories.includes('Snack');

  const toggleTopping = (name: string) => {
    setSelectedToppings(prev => 
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  const toppingsCost = selectedToppings.reduce((acc, t) => {
    const topping = toppings.find(top => top.name === t);
    return acc + (topping?.price || 0);
  }, 0);

  const totalPrice = (item.priceNum + toppingsCost) * quantity;

  const handleAddToCart = () => {
    onAddToCart({
      item,
      quantity,
      toppings: selectedToppings,
      totalPrice,
      notes
    });
  };

  const handleBuyNow = () => {
    onBuyNow({
      item,
      quantity,
      toppings: selectedToppings,
      totalPrice,
      notes
    });
  };

  return (
    <motion.div 
      key="detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-full bg-white"
    >
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="relative h-[350px] w-full shrink-0 bg-white">
        <img 
          src={item.img} 
          className="w-full h-full object-cover object-center"
          alt={item.name} 
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
          <button 
            onClick={onBack}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <button className="h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white">
            <SlidersHorizontal size={20} className="rotate-90" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#F5F2EA] -mt-10 rounded-t-[3rem] px-8 pt-8 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-serif font-bold text-[#3D2B1F] max-w-[200px]">{item.name}</h2>
          <p className="text-xl font-bold text-[#3D2B1F]">{item.price}</p>
        </div>

        <p className="text-sm text-[#3D2B1F]/70 leading-relaxed mb-6">
          {item.description}
        </p>

        {(!isSnack || item.name === 'Telur Gulung') && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#3D2B1F] mb-4">
                Add On
              </h3>
              <div className="space-y-3">
                {toppings.map((topping, i) => (
                  <div 
                    key={i} 
                    onClick={() => toggleTopping(topping.name)}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedToppings.includes(topping.name) ? 'bg-[#3D2B1F] border-[#3D2B1F]' : 'border-[#3D2B1F]/20'}`}>
                        {selectedToppings.includes(topping.name) && <CheckCircle size={14} className="text-white" />}
                      </div>
                      <span className="font-bold text-[#3D2B1F]">{topping.name}</span>
                    </div>
                    <span className="text-sm text-[#3D2B1F]/50 font-bold">+Rp {topping.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>


          </>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-bold text-[#3D2B1F] mb-3">Instruksi Khusus</h3>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={item.name === 'Telur Gulung' ? "Contoh: tanpa saus, saus pedas, saus tomat" : isSnack ? "Contoh: Bumbu dipisah, ekstra pedas..." : "Contoh: Telur setengah matang, tanpa bumbu pedas..."}
            className="w-full h-24 bg-white rounded-3xl p-6 text-sm font-medium border border-[#3D2B1F]/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/10 resize-none"
          ></textarea>
        </div>

        <div className="w-full pb-10 pt-4 flex flex-col gap-3 px-6">
          <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-[#3D2B1F]/10 shadow-sm mb-2">
            <span className="text-sm font-bold text-[#3D2B1F]">Jumlah Porsi</span>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-[#3D2B1F]/5 text-[#3D2B1F] hover:bg-[#3D2B1F]/10 transition-colors"
              >
                <Minus size={16} />
              </button>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    setQuantity(val);
                  } else if (e.target.value === '') {
                    setQuantity('' as any);
                  }
                }}
                onBlur={() => {
                  if (!quantity || quantity < 1) setQuantity(1);
                }}
                className="text-xl font-bold text-[#3D2B1F] w-16 text-center bg-transparent outline-none"
              />
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-[#3D2B1F] text-white hover:bg-black transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          <motion.button 
            onClick={handleAddToCart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#3D2B1F] text-[#F5F2EA] h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center shadow-md"
          >
            <span>+ Keranjang</span>
          </motion.button>
          
          <motion.button 
            onClick={handleBuyNow}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#3D2B1F] text-[#F5F2EA] h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center shadow-xl"
          >
            <span>Beli Langsung</span>
            <span className="text-[10px] opacity-80 ml-2">Rp {totalPrice.toLocaleString()}</span>
          </motion.button>
        </div>
      </div>
      </div>
    </motion.div>
  );
}

function OrdersScreen({ onBack, onGoHome, orders, cart, customerName }: { onBack: () => void, onGoHome: (tab?: string) => void, orders: Order[], cart?: CartItem[], customerName: string }) {
  const [now, setNow] = useState(Date.now());
  const activeOrders = orders.filter(o => o.status !== 'selesai' && o.status !== 'dibatalkan' && o.customerName === customerName);
  const cancelledOrders = orders.filter(o => o.status === 'dibatalkan' && o.customerName === customerName);
  const hasActiveOrder = activeOrders.length > 0;
  const hasAnyOrder = activeOrders.length > 0 || cancelledOrders.length > 0;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleProfileClick = () => {
    onGoHome('profile');
  };

  return (
    <motion.div 
      key="status"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col h-full bg-[#F5F2EA] overflow-hidden relative"
    >

      {/* Header */}
      <div className="flex items-center px-6 pt-4 pb-2">
        <button 
          onClick={onBack}
          className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#3D2B1F]/5"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 text-center text-xl font-serif font-bold pr-10 text-[#3D2B1F]">Status Pesanan</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-40">
        {!hasAnyOrder ? (
          <div className="flex flex-col items-center justify-center text-center px-8 pt-20 pb-10">
            <div className="w-24 h-24 rounded-full bg-[#3D2B1F]/5 flex items-center justify-center mb-6">
              <ReceiptText size={40} className="text-[#3D2B1F]/40" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#3D2B1F] mb-2">Belum Ada Pesanan</h3>
            <p className="text-[#3D2B1F]/60 mb-8 max-w-[250px]">
              Kamu belum membuat pesanan apapun. Yuk, pesan Mie spesialmu sekarang!
            </p>
            <button 
              onClick={() => onGoHome('home')}
              className="bg-[#3D2B1F] text-[#F5F2EA] px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-black transition-colors"
            >
              Pesan Sekarang
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 pt-0">
            {(() => {
              // Use the most recent or first active order for the general status/timer
              const primaryOrder = activeOrders[0];
              const startTime = new Date(primaryOrder.timestamp).getTime();
              const elapsed = (now - startTime) / 1000;
              const duration = 600; // 10 minutes
              const remaining = Math.max(0, duration - elapsed);
              const orderStatus = primaryOrder.status;

              return (
                <div className="flex flex-col items-center">
                  {/* Video at the top - Full Width */}
                  <div className="w-full mb-8 rounded-b-[3.5rem] overflow-hidden shadow-2xl">
                    <video
                      src="/video-elang.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full object-cover aspect-video"
                    />
                  </div>

                  {/* Content with Padding */}
                  <div className="w-full px-6 flex flex-col items-center">
                    {/* Circular Countdown Timer */}
                    <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                      <svg viewBox="0 0 224 224" className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="112" cy="112" r="100" stroke="#3D2B1F" strokeWidth="6" fill="transparent" className="opacity-10" />
                        <circle
                          cx="112" cy="112" r="100" stroke="#3D2B1F" strokeWidth="6" fill="transparent"
                          strokeDasharray={2 * Math.PI * 100}
                          strokeDashoffset={2 * Math.PI * 100 * (1 - remaining / duration)}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      
                      <div className="flex flex-col items-center z-10">
                        <span className="text-3xl font-mono font-bold text-[#3D2B1F] tracking-wider">
                          {`00:${Math.floor(remaining / 60).toString().padStart(2, '0')}:${Math.floor(remaining % 60).toString().padStart(2, '0')}`}
                        </span>
                        <span className="text-xs font-medium text-[#3D2B1F]/60 mt-1">
                          Estimasi 10 menit
                        </span>
                      </div>
                    </div>

                    {/* Status Text */}
                    <div className="w-full text-center mb-8">
                       <h3 className="text-xl font-serif font-bold text-[#3D2B1F] mb-2">
                        {orderStatus === 'diterima' && 'Pesanan Diterima'}
                        {orderStatus === 'dimasak' && 'Sedang Dimasak'}
                        {orderStatus === 'diantar' && 'Sedang Diantar'}
                       </h3>
                       <p className="text-sm text-[#3D2B1F]/60">
                        {orderStatus === 'diterima' && 'Menunggu koki menyiapkan pesananmu.'}
                        {orderStatus === 'dimasak' && 'Harap tunggu sebentar, ya.'}
                        {orderStatus === 'diantar' && 'Kurir sedang menuju ke tempatmu.'}
                       </p>
                    </div>

                    {/* Quote Box */}
                    <div className="w-full bg-[#3D2B1F]/5 rounded-[2rem] p-6 flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Utensils size={20} className="text-[#3D2B1F]" />
                      </div>
                      <p className="text-[#3D2B1F] font-serif italic font-medium">
                        "Pesanan spesialmu akan segera siap!"
                      </p>
                    </div>
                    
                    {/* Order Details Cards - One for each active/cancelled order */}
                    <div className="w-full space-y-6">
                      {[...activeOrders, ...cancelledOrders].map((order) => (
                        <div key={order.id} className={`w-full bg-white rounded-[2.5rem] p-6 shadow-sm border border-[#3D2B1F]/5 ${order.status === 'dibatalkan' ? 'opacity-60' : ''}`}>
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col">
                              <p className="text-xs font-bold text-[#3D2B1F] uppercase tracking-widest">Detail Pesanan</p>
                              {order.status === 'dibatalkan' && (
                                <span className="text-[10px] font-bold text-red-500 uppercase mt-0.5">Pesanan Dibatalkan</span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-[#3D2B1F]/40">#{order.id.slice(-4)}</span>
                          </div>
                          <div className="space-y-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-[#3D2B1F]">
                                    {item.quantity}x {item.item.name}
                                  </p>
                                  {item.toppings && item.toppings.length > 0 && (
                                    <p className="text-xs text-[#3D2B1F]/60 mt-0.5">
                                      Add On: {item.toppings.join(', ')}
                                    </p>
                                  )}
                                  {item.notes && (
                                    <p className="text-xs text-[#3D2B1F]/60 mt-0.5 italic">
                                      Catatan: {item.notes}
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-[#3D2B1F]">
                                  Rp {item.totalPrice.toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-[#3D2B1F]/5 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-[#3D2B1F]/60 uppercase tracking-widest">Metode Pembayaran</span>
                              <span className="text-xs font-bold text-[#3D2B1F]">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-[#3D2B1F]/60 uppercase tracking-widest">Total Pembayaran</span>
                              <span className="text-lg font-serif font-bold text-[#3D2B1F]">Rp {order.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-24 bg-[#3D2B1F] flex items-center justify-between px-6 rounded-t-[3.5rem] shadow-2xl z-50">
        <button 
          onClick={() => onGoHome('home')}
          className="flex flex-col items-center gap-1 transition-colors text-white/40"
        >
          <Home size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => onGoHome('cart')}
          className="flex flex-col items-center gap-1 transition-colors text-white/40"
        >
          <div className="relative">
            <ShoppingBag size={20} />
            {cart && cart.length > 0 && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-[#3D2B1F]"></div>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest">Keranjang</span>
        </button>
        <button 
          onClick={() => onGoHome('riwayat')}
          className="flex flex-col items-center gap-1 transition-colors text-white/40"
        >
          <ReceiptText size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Riwayat</span>
        </button>
        <button 
          onClick={() => onGoHome('orders')}
          className="flex flex-col items-center gap-1 transition-colors text-white"
        >
          <div className="relative">
            <ShoppingBag size={20} />
            {hasActiveOrder && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-[#3D2B1F]"></div>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest">Pesanan</span>
        </button>
        <button 
          onClick={handleProfileClick}
          className="flex flex-col items-center gap-1 transition-colors text-white/40"
        >
          <User size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </motion.div>
  );
}

