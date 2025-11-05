import { Component } from '@angular/core';
import {
  // Componentes standalone de Ionic usados en la plantilla
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonAvatar,
  IonList, IonItem, IonLabel, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonSelect, IonSelectOption,
  // Componentes agregados para el menú responsivo
  IonMenu, IonMenuButton, IonMenuToggle, IonListHeader
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
// Quitamos TitleCasePipe
import { NgIf, NgFor, DatePipe } from '@angular/common';

//  Modelos de datos (en memoria y localStorage) 

type User = {
  id: string;
  username: string;     // nombre de usuario (login)
  password: string;
  storeName: string;    // nombre de la tienda
  storeImage: string;
};

type Product = {
  id: string;
  name: string;         // nombre del producto
  description: string;  // descripción
  stock: number;
  costPrice: number;    // precio de costo
  salePrice: number;    // precio de venta
  image: string;
};

type Client = {
  id: string;           // UUID autogenerado
  name: string;
  address: string;      // domicilio
  phone: string;        // teléfono
  email: string;
  image: string;
};

type SaleItem = {
  productId: string;
  name: string;         // nombre (copiado para snapshot textual)
  qty: number;
  price: number;        // precio unitario (venta)
  subtotal: number;     // qty * price
};
type Sale = {
  id: string;           // UUID autogenerado
  date: string;
  clientId: string;     // referencia al cliente
  clientName: string;
  items: SaleItem[];    // línea(s) de la venta
  total: number;
};

// Claves de localStorage para persistencia
const USERS_KEY    = 'users';
const SESSION_KEY  = 'session_user';
const PRODUCTS_KEY = 'products';
const CLIENTS_KEY  = 'clients';
const SALES_KEY    = 'sales';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  // Declaración de módulos/standalone components usados en la plantilla
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonAvatar,
    IonList, IonItem, IonLabel, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol, IonSelect, IonSelectOption,
    IonMenu, IonMenuButton, IonMenuToggle, IonListHeader,
    
    FormsModule, NgIf, NgFor, DatePipe
    // TitleCasePipe se quitó de aquí
  ],
})
export class HomePage {

  // Autenticación
  authMode: 'login' | 'register' = 'login';
  authError = '';
  session: User | null = null;
  loginForm = { username: '', password: '' };
  registerForm = { username: '', password: '', storeName: '', storeImage: '' };
  
  // UI / Navegación simple
  section: 'dashboard' | 'products' |
           'clients' | 'sales' | 'reports' = 'dashboard';

  // Productos
  products: Product[] = [];
  productForm: Partial<Product> = { stock: 0, costPrice: 0, salePrice: 0 };
  
  // Clientes
  clients: Client[] = [];
  clientForm: Partial<Client> = {};
  
  // Ventas
  sales: Sale[] = [];
  saleForm: { clientId?: string; items: SaleItem[] } = { items: [] };
  saleAdd: { productId?: string; qty: number } = { qty: 1 };
  saleError = '';
  
  // Reportes
  report = {
    totalSales: 0,
    totalRevenue: 0,
    totalItems: 0,
    topClient: { name: '', amount: 0 } as { name: string; amount: number } | null,
    topProduct: { name: '', qty: 0 } as { name: string; qty: number } | null
  };

  constructor() {
    // ===== Auto-login =====
    const storedSession = this.get<User | null>(SESSION_KEY, null);
    if (storedSession) this.session = storedSession;
    // ===== Cargar datos de la app =====
    this.products = this.get<Product[]>(PRODUCTS_KEY, []);
    this.clients  = this.get<Client[]>(CLIENTS_KEY, []);
    this.sales    = this.get<Sale[]>(SALES_KEY, []);
    this.refreshReport(); // Inicializa métricas agregadas
  }

  // Devuelve el título de la sección actual en español.
  getSpanishTitle(): string {
    // Lee la variable 'this.section'
    switch(this.section) {
      case 'dashboard': return this.session?.storeName || 'Mi Tienda';
      case 'products':  return 'Productos';
      case 'clients':   return 'Clientes';
      case 'sales':     return 'Ventas';
      case 'reports':   return 'Reportes';
      // Fallback por si acaso
      default:          return this.session?.storeName || 'Mi Tienda';
    }
  }

  // Helpers de persistencia (localStorage) y utilidades

  private get<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  }

  private set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private uuid(): string {
    return (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
  }

  // Autenticación (login, registro, logout)

  switchAuth(mode: 'login'|'register') {
    this.authMode = mode;
    this.authError = '';
  }

  doLogin() {
    const users = this.get<User[]>(USERS_KEY, []);
    const u = users.find(x => x.username === this.loginForm.username && x.password === this.loginForm.password);
    if (!u) { this.authError = 'Credenciales inválidas'; return; }
    this.session = u;
    this.set(SESSION_KEY, u);  // Persiste sesión (auto-login)
    this.authError = '';
  }

  doRegister() {
    const { username, password, storeName, storeImage } = this.registerForm;
    if (!username || !password || !storeName) {
      this.authError = 'Completa los campos obligatorios';
      return;
    }

    const users = this.get<User[]>(USERS_KEY, []);
    if (users.some(u => u.username === username)) {
      this.authError = 'El nombre de usuario ya existe';
      return;
    }

    // Crear y persistir usuario
    const newUser: User = { id: this.uuid(), username, password, storeName, storeImage };
    users.push(newUser);
    this.set(USERS_KEY, users);

    // Dejarlo en sesión inmediatamente
    this.set(SESSION_KEY, newUser);
    this.session = newUser;
    this.authMode = 'login';
    this.authError = '';
  }

  logout() {
    localStorage.removeItem(SESSION_KEY);
    this.session = null;
    this.section = 'dashboard';           // Vuelve a inicio
    this.loginForm = { username: '', password: '' };
  }

  // Productos (CRUD básico en memoria + persistencia)
  saveProduct() {
    const list = [...this.products];
    if (this.productForm.id) {
      // Edición (upsert por id)
      const i = list.findIndex(p => p.id === this.productForm.id);
      list[i] = { ...(list[i]), ...(this.productForm as Product) };
    } else {
      // Creación
      const item: Product = {
        id: this.uuid(),
        name: this.productForm.name || '',
        description: this.productForm.description || '',
        stock: Number(this.productForm.stock || 0),
        costPrice: Number(this.productForm.costPrice || 0),
        salePrice: Number(this.productForm.salePrice || 0),
        image: this.productForm.image || ''
      };
      list.push(item);
    }
    this.products = list;
    this.set(PRODUCTS_KEY, list);
    this.resetProduct();
  }

  editProduct(p: Product) {
    this.productForm = { ...p };
  }

  deleteProduct(id: string) {
    this.products = this.products.filter(p => p.id !== id);
    this.set(PRODUCTS_KEY, this.products);
    if (this.productForm.id === id) this.resetProduct();
  }

  resetProduct() {
    this.productForm = { stock: 0, costPrice: 0, salePrice: 0 };
  }

  // Clientes (CRUD básico en memoria + persistencia)

  saveClient() {
    const list = [...this.clients];
    if (this.clientForm.id) {
      // Edición
      const i = list.findIndex(c => c.id === this.clientForm.id);
      list[i] = { ...(list[i]), ...(this.clientForm as Client) };
    } else {
      // Creación
      const item: Client = {
        id: this.uuid(),
        name: this.clientForm.name || '',
        address: this.clientForm.address || '',
        phone: this.clientForm.phone || '',
        email: this.clientForm.email || '',
        image: this.clientForm.image || ''
      };
      list.push(item);
    }
    this.clients = list;
    this.set(CLIENTS_KEY, list);
    this.resetClient();
  }

  editClient(c: Client) {
    this.clientForm = { ...c };
  }

  deleteClient(id: string) {
    this.clients = this.clients.filter(c => c.id !== id);
    this.set(CLIENTS_KEY, this.clients);
    if (this.clientForm.id === id) this.resetClient();
  }

  resetClient() {
    this.clientForm = {};
  }

  // Ventas (carrito, validación de stock, persistencia)

  get saleTotal(): number {
    return this.saleForm.items.reduce((acc, it) => acc + it.subtotal, 0);
  }

  addItemToSale() {
    this.saleError = '';
    const pid = this.saleAdd.productId;
    const qty = Number(this.saleAdd.qty || 0);
    if (!pid || qty <= 0) {
      this.saleError = 'Selecciona producto y cantidad válida';
      return;
    }

    const p = this.products.find(x => x.id === pid);
    if (!p) {
      this.saleError = 'Producto no encontrado';
      return;
    }

    if (qty > p.stock) {
      this.saleError = `Stock insuficiente. Disponible: ${p.stock}`;
      return;
    }

    // Acumular si el producto ya está en el carrito
    const existing = this.saleForm.items.find(i => i.productId === pid);
    if (existing) {
      if (existing.qty + qty > p.stock) {
        this.saleError = `Supera stock. Disponible: ${p.stock}`;
        return;
      }
      existing.qty += qty;
      existing.subtotal = existing.qty * existing.price;
    } else {
      this.saleForm.items.push({
        productId: p.id,
        name: p.name,
        qty,
        price: p.salePrice,
        subtotal: qty * p.salePrice
      });
    }

    // Reset rápido del selector de cantidad
    this.saleAdd = { qty: 1, productId: this.saleAdd.productId };
  }

  removeItemFromSale(index: number) {
    this.saleForm.items.splice(index, 1);
  }

  saveSale() {
    this.saleError = '';
    if (!this.saleForm.clientId) {
      this.saleError = 'Selecciona un cliente';
      return;
    }
    if (!this.saleForm.items.length) {
      this.saleError = 'Agrega al menos un producto';
      return;
    }

    // Validar stock final contra inventario actual
    for (const it of this.saleForm.items) {
      const p = this.products.find(x => x.id === it.productId)!;
      if (it.qty > p.stock) {
        this.saleError = `Stock insuficiente para ${p.name}`;
        return;
      }
    }

    // Descontar stock y persistir productos
    const newProducts = this.products.map(p => {
      const it = this.saleForm.items.find(i => i.productId === p.id);
      return it ? { ...p, stock: p.stock - it.qty } : p;
    });
    this.products = newProducts;
    this.set(PRODUCTS_KEY, newProducts);

    // Construir objeto de venta (snapshot de items y cliente)
    const client = this.clients.find(c => c.id === this.saleForm.clientId)!;
    const total = this.saleForm.items.reduce((a, i) => a + i.subtotal, 0);
    const sale: Sale = {
      id: this.uuid(),
      date: new Date().toISOString(),
      clientId: client.id,
      clientName: client.name,
      items: JSON.parse(JSON.stringify(this.saleForm.items)),
      total
    };
    
    // Persistir venta
    const list = [...this.sales, sale];
    this.sales = list;
    this.set(SALES_KEY, list);
    
    // Reset de formulario y actualización de métricas
    this.resetSale();
    this.refreshReport();
  }

  resetSale() {
    this.saleForm = { items: [] };
    this.saleAdd = { qty: 1 };
    this.saleError = '';
  }

  // Reportes (cálculos agregados basados en `sales`)

  private refreshReport() {
    const totalSales   = this.sales.length;
    const totalRevenue = this.sales.reduce((a, s) => a + s.total, 0);
    
    // (FIX NaN)
    const totalItems   = this.sales.reduce(
      (a, s) => a + s.items.reduce((x, i) => x + (Number(i.qty) || 0), 0),
      0
    );

    // Agregación por cliente (monto total)
    const byClient = new Map<string, number>();
    const clientNames = new Map<string, string>();
    for (const s of this.sales) {
      byClient.set(s.clientId, (byClient.get(s.clientId) || 0) + s.total);
      clientNames.set(s.clientId, s.clientName);
    }

    let topClient: { name: string; amount: number } | null = null;
    for (const [id, amount] of byClient.entries()) {
      if (!topClient || amount > topClient.amount) {
        const snapshotName = clientNames.get(id);
        const currentClient = this.clients.find(c => c.id === id);
        topClient = { name: snapshotName || currentClient?.name || id, amount };
      }
    }

    // Agregación por producto (cantidad total)
    const byProduct = new Map<string, { name: string; qty: number }>();
    for (const s of this.sales) {
      for (const it of s.items) {
        const cur = byProduct.get(it.productId) || { name: it.name, qty: 0 };
        // (FIX NaN)
        cur.qty += (Number(it.qty) || 0);
        byProduct.set(it.productId, cur);
      }
    }

    let topProduct: { name: string; qty: number } | null = null;
    for (const v of byProduct.values()) {
      if (!topProduct || v.qty > topProduct.qty) {
        topProduct = { name: v.name, qty: v.qty };
      }
    }

    // Publicar resultados
    this.report = { totalSales, totalRevenue, totalItems, topClient, topProduct };
  }
}