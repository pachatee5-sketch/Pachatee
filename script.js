// ===== CONFIGURACIÃ"N FIREBASE =====
// IMPORTANTE: Reemplaza "YOUR-DATABASE-URL" con tu URL real de Firebase
// La obtienes en: Firebase Console → Realtime Database → URL arriba
const firebaseConfig = {
  apiKey: "AIzaSyBc4ZMnSPs6S7hoQJ6_SOqgdsIE72qYV1Q",
  authDomain: "pacha-tee.firebaseapp.com",
  projectId: "pacha-tee",
  storageBucket: "pacha-tee.firebasestorage.app",
  messagingSenderId: "944679451188",
  appId: "1:944679451188:web:347283fb594ef66cb02861",
  databaseURL: "https://pacha-tee-default-rtdb.firebaseio.com" // ← CAMBIA ESTO por tu URL
};

// Inicializar Firebase
let db;
let usarFirebase = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  usarFirebase = true;
  console.log('✓ Firebase conectado exitosamente');
} catch (error) {
  console.warn('Firebase no disponible, usando localStorage:', error);
  usarFirebase = false;
}

// ===== VARIABLES GLOBALES =====
let carrito = [];
let pasoCheckout = 1;
let inventario = {};
let ventas = [];

// Inventario inicial - PRODUCTOS ACTUALIZADOS
const INVENTARIO_INICIAL = {
  'Camiseta Lirio': { categoria: 'Camisetas', precio: 13, stock: 50, vendidos: 0 },
  'Camiseta Mujer': { categoria: 'Camisetas', precio: 13, stock: 50, vendidos: 0 },
  'Camiseta Condor': { categoria: 'Camisetas', precio: 13, stock: 50, vendidos: 0 },
  'Camiseta Medusa': { categoria: 'Camisetas', precio: 13, stock: 50, vendidos: 0 },
  'Camiseta Floripondio': { categoria: 'Camisetas', precio: 13, stock: 50, vendidos: 0 },
  'Camiseta Heliconia': { categoria: 'Camisetas', precio: 13, stock: 50, vendidos: 0 },
  'Camiseta Rana': { categoria: 'Camisetas', precio: 13, stock: 50, vendidos: 0 },
  'Camiseta Passiflora': { categoria: 'Camisetas', precio: 13, stock: 50, vendidos: 0 },
  'Tote Bag Natural': { categoria: 'Tote Bags', precio: 5, stock: 100, vendidos: 0 },
  'Tote Bag Ecológico': { categoria: 'Tote Bags', precio: 5, stock: 100, vendidos: 0 },
  'Tote Bag Océano': { categoria: 'Tote Bags', precio: 5, stock: 100, vendidos: 0 },
  'Tote Bag Selva': { categoria: 'Tote Bags', precio: 5, stock: 100, vendidos: 0 },
  'Tote Bag Urbano': { categoria: 'Tote Bags', precio: 5, stock: 100, vendidos: 0 },
  'Tote Bag Geométrico': { categoria: 'Tote Bags', precio: 5, stock: 100, vendidos: 0 },
  'Tote Bag Minimal': { categoria: 'Tote Bags', precio: 5, stock: 100, vendidos: 0 }
};

// ===== INICIALIZACIÃ"N =====
document.addEventListener('DOMContentLoaded', () => {
  inicializarEventos();
  cargarDatosStorage();
  actualizarCarrito();
  inicializarAnimaciones();
  inicializarParallax();
  inicializarContadores();
  inicializarTilt();
  inicializarCursorCustom();
  actualizarTop3Dinamico(); // Top 3 dinámico
});

// ===== STORAGE FIREBASE / LOCALSTORAGE =====
async function cargarDatosStorage() {
  try {
    if (usarFirebase) {
      // Cargar desde Firebase
      const inventarioSnapshot = await db.ref('inventario').once('value');
      const ventasSnapshot = await db.ref('ventas').once('value');
      
      if (inventarioSnapshot.exists()) {
        inventario = inventarioSnapshot.val();
      } else {
        inventario = { ...INVENTARIO_INICIAL };
        await db.ref('inventario').set(inventario);
      }
      
      if (ventasSnapshot.exists()) {
        ventas = Object.values(ventasSnapshot.val());
      } else {
        ventas = [];
      }
    } else {
      // Usar localStorage como respaldo
      const inventarioData = localStorage.getItem('pacha-inventario');
      const ventasData = localStorage.getItem('pacha-ventas');
      
      inventario = inventarioData ? JSON.parse(inventarioData) : { ...INVENTARIO_INICIAL };
      ventas = ventasData ? JSON.parse(ventasData) : [];
      
      if (!inventarioData) {
        localStorage.setItem('pacha-inventario', JSON.stringify(inventario));
      }
    }
    
    console.log('Datos cargados:', { productos: Object.keys(inventario).length, ventas: ventas.length });
    actualizarTop3Dinamico();
    
  } catch (error) {
    console.error('Error cargando datos:', error);
    inventario = { ...INVENTARIO_INICIAL };
    ventas = [];
  }
}

async function guardarInventario() {
  try {
    if (usarFirebase) {
      await db.ref('inventario').set(inventario);
    } else {
      localStorage.setItem('pacha-inventario', JSON.stringify(inventario));
    }
  } catch (error) {
    console.error('Error guardando inventario:', error);
  }
}

async function guardarVenta(venta) {
  try {
    if (usarFirebase) {
      await db.ref('ventas').push(venta);
    } else {
      ventas.push(venta);
      localStorage.setItem('pacha-ventas', JSON.stringify(ventas));
    }
  } catch (error) {
    console.error('Error guardando venta:', error);
  }
}

// ===== TOP 3 DINÃMICO =====
function actualizarTop3Dinamico() {
  // Calcular productos más vendidos
  const productosOrdenados = Object.entries(inventario)
    .map(([nombre, data]) => ({
      nombre: nombre,
      vendidos: data.vendidos || 0,
      precio: data.precio,
      categoria: data.categoria
    }))
    .sort((a, b) => b.vendidos - a.vendidos)
    .slice(0, 3); // Top 3

  // Actualizar en la página principal
  const featuredGrid = document.querySelector('.featured-grid-compact');
  if (featuredGrid && productosOrdenados.length > 0) {
    featuredGrid.innerHTML = productosOrdenados.map((producto, index) => {
      const badges = [' #1', ' #2', ' #3'];
      const icons = ['👑', '🥈', '🥉'];
      
      // Generar imagen path
      const categoria = producto.categoria === 'Camisetas' ? 'camisetas' : 'totes';
      const nombreArchivo = producto.nombre.toLowerCase()
        .replace(/\s+/g, '-')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const extension = producto.categoria === 'Camisetas' ? 'jpeg' : 'jpg';
      const imagePath = `assets/productos/${categoria}/${nombreArchivo}.${extension}`;
      
      return `
        <div class="product-card-compact featured fade-in-up" style="animation-delay: ${index * 0.1}s" data-tilt>
          <div class="best-seller-badge">
            <span class="badge-icon">${icons[index]}</span>
            <span class="badge-text">${badges[index]}</span>
          </div>
          <div class="product-image-compact">
            <img src="${imagePath}" alt="${producto.nombre}" loading="lazy" onerror="this.src='assets/placeholder.jpg'">
            <div class="product-shine"></div>
            <div class="product-overlay-compact">
              <button class="btn btn-primary btn-small" onclick="agregarAlCarrito('${producto.nombre}', ${producto.precio})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Agregar
              </button>
            </div>
          </div>
          <div class="product-info-compact">
            <div class="product-rating">
              ⭐⭐⭐⭐⭐ <span class="reviews">(${producto.vendidos || 0} vendidos)</span>
            </div>
            <h3>${producto.nombre}</h3>
            <p>${producto.categoria}</p>
            <div class="product-footer-compact">
              <span class="product-price-compact">$${producto.precio}</span>
              <span class="product-tag-compact">${producto.categoria}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Re-inicializar efectos tilt
    setTimeout(() => inicializarTilt(), 100);
  }
}

// ===== REGISTRAR VENTA =====
async function registrarVenta(datosCliente, metodoPago) {
  const venta = {
    id: 'PT-' + Date.now(),
    fecha: new Date().toISOString(),
    cliente: datosCliente,
    productos: carrito.map(item => ({
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad
    })),
    subtotal: carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
    envio: 3,
    total: carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0) + 3,
    metodoPago: metodoPago,
    estado: 'Pendiente'
  };

  // Actualizar inventario
  for (const item of carrito) {
    if (inventario[item.nombre]) {
      inventario[item.nombre].stock -= item.cantidad;
      inventario[item.nombre].vendidos = (inventario[item.nombre].vendidos || 0) + item.cantidad;
    }
  }

  await guardarInventario();
  await guardarVenta(venta);
  
  // Actualizar top 3 dinámico
  actualizarTop3Dinamico();
  
  return venta;
}

// ===== EVENTOS =====
function inicializarEventos() {
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const currentScroll = window.scrollY;
    
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.opacity = '0';
        menu.style.visibility = 'hidden';
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarCart();
      cerrarCheckout();
      cerrarMobileMenu();
    }
  });
}

// ===== ANIMACIONES =====
function inicializarAnimaciones() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-in-up').forEach(el => {
    observer.observe(el);
  });
}

// ===== PARALLAX EFFECT =====
function inicializarParallax() {
  const heroContent = document.querySelector('.hero-content');
  const heroBg = document.querySelector('.hero-bg');
  const shapes = document.querySelectorAll('.hero-shape');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxSpeed = 0.5;
    
    if (heroContent) {
      heroContent.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
      heroContent.style.opacity = 1 - (scrolled / 600);
    }
    
    if (heroBg) {
      heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
    
    shapes.forEach((shape, index) => {
      const speed = 0.2 + (index * 0.1);
      shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.05}deg)`;
    });
  });
}

// ===== CONTADOR ANIMADO =====
function inicializarContadores() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  const speed = 200;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = +counter.getAttribute('data-target');
        const increment = target / speed;
        let current = 0;
        
        const updateCounter = () => {
          current += increment;
          if (current < target) {
            counter.textContent = Math.ceil(current);
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        };
        
        updateCounter();
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
}

// ===== EFECTO TILT 3D =====
function inicializarTilt() {
  const tiltCards = document.querySelectorAll('[data-tilt]');
  
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });
}

// ===== CURSOR PERSONALIZADO =====
function inicializarCursorCustom() {
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  document.body.appendChild(cursor);
  
  const cursorFollower = document.createElement('div');
  cursorFollower.classList.add('cursor-follower');
  document.body.appendChild(cursorFollower);
  
  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });
  
  function updateFollower() {
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;
    
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';
    
    requestAnimationFrame(updateFollower);
  }
  updateFollower();
  
  const interactiveElements = document.querySelectorAll('a, button, .product-card, [onclick]');
  
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('cursor-hover');
      cursorFollower.classList.add('cursor-hover');
    });
    
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('cursor-hover');
      cursorFollower.classList.remove('cursor-hover');
    });
  });
}

// ===== DROPDOWN MENUS =====
function toggleDropdown(dropdownId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const dropdown = document.getElementById(dropdownId);
  const allDropdowns = document.querySelectorAll('.dropdown-menu');
  
  allDropdowns.forEach(menu => {
    if (menu.id !== dropdownId) {
      menu.style.opacity = '0';
      menu.style.visibility = 'hidden';
    }
  });
  
  if (dropdown) {
    const isVisible = dropdown.style.visibility === 'visible';
    dropdown.style.opacity = isVisible ? '0' : '1';
    dropdown.style.visibility = isVisible ? 'hidden' : 'visible';
  }
}

// ===== NAVEGACIÃ"N =====
function scrollToSection(id) {
  const element = document.getElementById(id);
  if (element) {
    const offset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
  cerrarMobileMenu();
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('mobile-menu-btn');
  
  menu.classList.toggle('active');
  btn.classList.toggle('active');
}

function cerrarMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('mobile-menu-btn');
  
  menu.classList.remove('active');
  btn.classList.remove('active');
}

// ===== TABS NOSOTROS =====
function cambiarTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tab) {
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const contenido = document.getElementById(`tab-${tab}`);
  if (contenido) {
    contenido.classList.add('active');
  }
}

function mostrarNosotros(tab) {
  scrollToSection('nosotros');
  setTimeout(() => {
    cambiarTab(tab);
  }, 500);
  
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.style.opacity = '0';
    menu.style.visibility = 'hidden';
  });
}

// ===== FILTROS TIENDA =====
function filtrarProductos(categoria) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-filter') === categoria) {
      btn.classList.add('active');
    }
  });

  const categorias = document.querySelectorAll('.category-section');
  
  categorias.forEach(cat => {
    const catId = cat.id.replace('categoria-', '');
    if (catId === categoria) {
      cat.classList.add('active');
    } else {
      cat.classList.remove('active');
    }
  });

  scrollToSection('tienda');
  cerrarMobileMenu();
  
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.style.opacity = '0';
    menu.style.visibility = 'hidden';
  });
}

// ===== CARRITO =====
function agregarAlCarrito(nombre, precio) {
  if (!inventario[nombre]) {
    mostrarNotificacion('❌ Producto no encontrado en inventario');
    return;
  }
  
  const stockDisponible = inventario[nombre].stock;
  const cantidadEnCarrito = carrito.find(item => item.nombre === nombre)?.cantidad || 0;
  
  if (cantidadEnCarrito >= stockDisponible) {
    mostrarNotificacion(`❌ Stock insuficiente. Solo hay ${stockDisponible} unidades disponibles`);
    return;
  }
  
  const itemExistente = carrito.find(item => item.nombre === nombre);
  
  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carrito.push({
      nombre: nombre,
      precio: precio,
      cantidad: 1
    });
  }
  
  actualizarCarrito();
  mostrarNotificacion('✓ Producto agregado al carrito');
}

function eliminarDelCarrito(nombre) {
  carrito = carrito.filter(item => item.nombre !== nombre);
  actualizarCarrito();
}

function cambiarCantidad(nombre, cambio) {
  const item = carrito.find(item => item.nombre === nombre);
  
  if (!item) return;
  
  if (cambio > 0) {
    const stockDisponible = inventario[nombre]?.stock || 0;
    const nuevaCantidad = item.cantidad + cambio;
    
    if (nuevaCantidad > stockDisponible) {
      mostrarNotificacion(`❌ Stock insuficiente. Solo hay ${stockDisponible} unidades disponibles`);
      return;
    }
  }
  
  item.cantidad += cambio;
  
  if (item.cantidad <= 0) {
    eliminarDelCarrito(nombre);
  } else {
    actualizarCarrito();
  }
}

function actualizarCarrito() {
  const cartCount = document.getElementById('cart-count');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  cartCount.textContent = totalItems;
  
  if (carrito.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Tu carrito está vacío</p>
      </div>
    `;
  } else {
    cartItems.innerHTML = carrito.map(item => {
      const stockDisponible = inventario[item.nombre]?.stock || 0;
      const stockWarning = item.cantidad >= stockDisponible ? 
        `<small style="color: #dc2626;">⚠️ Stock máximo alcanzado</small>` : 
        `<small style="color: #6b7280;">Stock disponible: ${stockDisponible}</small>`;
      
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.nombre}</div>
            <div class="cart-item-price">$${item.precio}</div>
            ${stockWarning}
            <div class="cart-item-quantity">
              <button class="qty-btn" onclick="cambiarCantidad('${item.nombre}', -1)">−</button>
              <span>${item.cantidad}</span>
              <button class="qty-btn" onclick="cambiarCantidad('${item.nombre}', 1)">+</button>
            </div>
            <button class="remove-btn" onclick="eliminarDelCarrito('${item.nombre}')">Eliminar</button>
          </div>
        </div>
      `;
    }).join('');
  }
  
  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  cartTotal.textContent = `$${total}`;
}

function toggleCart() {
  const panel = document.getElementById('cart-panel');
  panel.classList.toggle('active');
}

function cerrarCart() {
  const panel = document.getElementById('cart-panel');
  panel.classList.remove('active');
}

// ===== CHECKOUT =====
function abrirCheckout() {
  if (carrito.length === 0) {
    cerrarCart(); // ✅ CORREGIDO: era closeCart Panel()
    mostrarNotificacion('El carrito está vacío'); // ✅ CORREGIDO: era mostrarNotification
    return;
  }
  
  cerrarCart();
  const modal = document.getElementById('checkout-modal');
  modal.classList.add('active');
  pasoCheckout = 1;
  mostrarPasoCheckout(1);
  actualizarResumenCheckout();
}
function cerrarCheckout() {
  const modal = document.getElementById('checkout-modal');
  modal.classList.remove('active');
}

function siguientePaso(paso) {
  if (pasoCheckout === 2 && paso === 3) {
    const form = document.getElementById('shipping-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
  }
  
  pasoCheckout = paso;
  mostrarPasoCheckout(paso);
}

function mostrarPasoCheckout(paso) {
  document.querySelectorAll('.checkout-step').forEach(step => {
    step.classList.remove('active');
  });
  
  const currentStep = document.getElementById(`checkout-step-${paso}`);
  if (currentStep) {
    currentStep.classList.add('active');
  }
  
  document.querySelectorAll('.step').forEach((step, index) => {
    if (index < paso) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
}

function actualizarResumenCheckout() {
  const orderSummary = document.getElementById('order-summary');
  const subtotalPrice = document.getElementById('checkout-subtotal');
  const finalTotalPrice = document.getElementById('checkout-total');
  
  if (!orderSummary || !subtotalPrice || !finalTotalPrice) return;
  
  orderSummary.innerHTML = '';
  
  let subtotal = 0;
  
  carrito.forEach(item => {
    const itemTotal = item.precio * item.cantidad;
    subtotal += itemTotal;
    
    const orderItem = document.createElement('div');
    orderItem.className = 'order-item';
    orderItem.innerHTML = `
      <span>${item.nombre} × ${item.cantidad}</span>
      <span>$${itemTotal}</span>
    `;
    orderSummary.appendChild(orderItem);
  });
  
  const shipping = 3;
  const total = subtotal + shipping;
  
  subtotalPrice.textContent = `$${subtotal}`;
  finalTotalPrice.textContent = `$${total}`;
  
  const paidAmount = document.getElementById('paid-amount');
  if (paidAmount) {
    paidAmount.textContent = `$${total}`;
  }
}

function seleccionarPago(element) {
  document.querySelectorAll('.payment-option-card').forEach(c => {
    c.classList.remove('active');
  });
  element.classList.add('active');
  
  const radio = element.querySelector('input[type="radio"]');
  if (radio) {
    radio.checked = true;
  }
}

// ===== CONTINUACIÓN DEL CÓDIGO (PARTE FALTANTE) =====

async function completarPedido() {
  const metodoPago = document.querySelector('input[name="payment"]:checked');
  
  if (!metodoPago) {
    mostrarNotificacion('❌ Por favor selecciona un método de pago');
    return;
  }

  const form = document.getElementById('shipping-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const datosCliente = {
    nombre: document.getElementById('nombre').value,
    email: document.getElementById('email').value,
    telefono: document.getElementById('telefono').value,
    direccion: document.getElementById('direccion').value,
    ciudad: document.getElementById('ciudad').value,
    codigoPostal: document.getElementById('codigo-postal').value
  };

  try {
    const venta = await registrarVenta(datosCliente, metodoPago.value);
    
    // Mostrar confirmación
    mostrarConfirmacionPedido(venta);
    
    // Limpiar carrito
    carrito = [];
    actualizarCarrito();
    
    // Cerrar checkout
    cerrarCheckout();
    
    mostrarNotificacion('✓ Pedido completado exitosamente');
    
  } catch (error) {
    console.error('Error al completar pedido:', error);
    mostrarNotificacion('❌ Error al procesar el pedido. Intenta nuevamente.');
  }
}

function mostrarConfirmacionPedido(venta) {
  const modal = document.createElement('div');
  modal.className = 'confirmation-modal active';
  modal.innerHTML = `
    <div class="confirmation-content">
      <div class="confirmation-icon">✓</div>
      <h2>¡Pedido Confirmado!</h2>
      <p>Tu pedido <strong>${venta.id}</strong> ha sido recibido</p>
      <div class="confirmation-details">
        <p><strong>Total pagado:</strong> $${venta.total}</p>
        <p><strong>Método de pago:</strong> ${venta.metodoPago}</p>
        <p><strong>Estado:</strong> ${venta.estado}</p>
      </div>
      <p class="confirmation-message">
        Te enviaremos un correo de confirmación a <strong>${venta.cliente.email}</strong>
      </p>
      <button class="btn btn-primary" onclick="cerrarConfirmacion()">Entendido</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  setTimeout(() => {
    modal.remove();
  }, 10000);
}

function cerrarConfirmacion() {
  const modal = document.querySelector('.confirmation-modal');
  if (modal) {
    modal.remove();
  }
}

// ===== NOTIFICACIONES =====
function mostrarNotificacion(mensaje) {
  const notificacion = document.createElement('div');
  notificacion.className = 'notification';
  notificacion.textContent = mensaje;
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notificacion.classList.remove('show');
    setTimeout(() => {
      notificacion.remove();
    }, 300);
  }, 3000);
}

// ===== BÚSQUEDA DE PRODUCTOS =====
function buscarProductos(termino) {
  const resultados = Object.entries(inventario).filter(([nombre]) => 
    nombre.toLowerCase().includes(termino.toLowerCase())
  );
  
  return resultados.map(([nombre, data]) => ({
    nombre,
    ...data
  }));
}

function mostrarResultadosBusqueda(termino) {
  if (!termino || termino.length < 2) return;
  
  const resultados = buscarProductos(termino);
  
  if (resultados.length === 0) {
    mostrarNotificacion('No se encontraron productos');
    return;
  }
  
  // Scroll a la tienda y resaltar productos
  scrollToSection('tienda');
  
  // Resaltar productos encontrados
  document.querySelectorAll('.product-card').forEach(card => {
    const nombre = card.querySelector('h3')?.textContent || '';
    if (resultados.some(r => r.nombre === nombre)) {
      card.classList.add('highlight');
      setTimeout(() => card.classList.remove('highlight'), 2000);
    }
  });
}

// ===== VALIDACIÓN DE FORMULARIOS =====
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarTelefono(telefono) {
  const regex = /^[0-9]{10}$/;
  return regex.test(telefono.replace(/\D/g, ''));
}

// ===== GESTIÓN DE STOCK =====
function verificarStock(nombre, cantidad) {
  if (!inventario[nombre]) return false;
  return inventario[nombre].stock >= cantidad;
}

function obtenerStockDisponible(nombre) {
  return inventario[nombre]?.stock || 0;
}

// ===== ESTADÍSTICAS =====
function obtenerEstadisticas() {
  const totalVentas = ventas.length;
  const ingresoTotal = ventas.reduce((sum, v) => sum + v.total, 0);
  const productosMasVendidos = Object.entries(inventario)
    .map(([nombre, data]) => ({ nombre, vendidos: data.vendidos || 0 }))
    .sort((a, b) => b.vendidos - a.vendidos)
    .slice(0, 5);
  
  return {
    totalVentas,
    ingresoTotal,
    productosMasVendidos
  };
}

// ===== EXPORTAR DATOS =====
function exportarVentas() {
  const dataStr = JSON.stringify(ventas, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ventas_pacha_tee_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

function exportarInventario() {
  const dataStr = JSON.stringify(inventario, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventario_pacha_tee_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

// ===== RESETEAR DATOS =====
async function resetearInventario() {
  if (!confirm('¿Estás seguro de que quieres resetear el inventario? Esta acción no se puede deshacer.')) {
    return;
  }
  
  inventario = { ...INVENTARIO_INICIAL };
  await guardarInventario();
  actualizarTop3Dinamico();
  mostrarNotificacion('✓ Inventario reseteado exitosamente');
}

async function limpiarVentas() {
  if (!confirm('¿Estás seguro de que quieres eliminar todas las ventas? Esta acción no se puede deshacer.')) {
    return;
  }
  
  ventas = [];
  
  if (usarFirebase) {
    await db.ref('ventas').remove();
  } else {
    localStorage.setItem('pacha-ventas', JSON.stringify(ventas));
  }
  
  mostrarNotificacion('✓ Ventas eliminadas exitosamente');
}

// ===== UTILIDADES =====
function formatearFecha(fecha) {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatearPrecio(precio) {
  return `$${precio.toFixed(2)}`;
}

// ===== COPY TO CLIPBOARD =====
function copiarAlPortapapeles(texto) {
  navigator.clipboard.writeText(texto).then(() => {
    mostrarNotificacion('✓ Copiado al portapapeles');
  }).catch(err => {
    console.error('Error al copiar:', err);
    mostrarNotificacion('❌ Error al copiar');
  });
}

// ===== COMPARTIR =====
function compartirProducto(nombre, precio) {
  if (navigator.share) {
    navigator.share({
      title: `${nombre} - Pacha Tee`,
      text: `Mira este producto: ${nombre} por solo $${precio}`,
      url: window.location.href
    }).catch(err => console.log('Error al compartir:', err));
  } else {
    copiarAlPortapapeles(window.location.href);
  }
}

// ===== MODO OSCURO (OPCIONAL) =====
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('dark-mode', isDark);
}

function cargarPreferenciasUsuario() {
  const darkMode = localStorage.getItem('dark-mode') === 'true';
  if (darkMode) {
    document.body.classList.add('dark-mode');
  }
}

// ===== LAZY LOADING DE IMÁGENES =====
function inicializarLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
}

// ===== PERFORMANCE MONITORING =====
function monitorearPerformance() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`Tiempo de carga de la página: ${pageLoadTime}ms`);
    });
  }
}

// ===== INICIALIZACIÓN ADICIONAL =====
document.addEventListener('DOMContentLoaded', () => {
  cargarPreferenciasUsuario();
  inicializarLazyLoading();
  monitorearPerformance();
});

// ===== CONSOLA DE ADMINISTRACIÓN (PARA DESARROLLO) =====
window.pachaAdmin = {
  verInventario: () => console.table(inventario),
  verVentas: () => console.table(ventas),
  verCarrito: () => console.table(carrito),
  estadisticas: () => console.table(obtenerEstadisticas()),
  exportarVentas,
  exportarInventario,
  resetearInventario,
  limpiarVentas
};

console.log('%c🌿 Pacha Tee', 'font-size: 24px; color: #059669; font-weight: bold;');
console.log('%cConsola de administración disponible: window.pachaAdmin', 'color: #6b7280;');

// ===== ADMIN FUNCTIONS =====
let productoEditando = null;

function abrirAdmin() {
  document.getElementById('admin-login-modal').classList.add('active');
}

function cerrarAdminLogin() {
  document.getElementById('admin-login-modal').classList.remove('active');
}

function loginAdmin() {
  const usuario = document.getElementById('admin-user').value;
  const password = document.getElementById('admin-pass').value;
  
  // Credenciales simples (en producción usarías algo más seguro)
  if (usuario === 'admin' && password === 'pacha123') {
    cerrarAdminLogin();
    abrirAdminPanel();
  } else {
    mostrarNotificacion('❌ Credenciales incorrectas');
  }
}

function abrirAdminPanel() {
  document.getElementById('admin-panel-modal').classList.add('active');
  cargarPanelAdmin();
}

function cerrarAdminPanel() {
  document.getElementById('admin-panel-modal').classList.remove('active');
}

function cambiarAdminTab(tab) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelectorAll('.admin-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  event.target.classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  
  if (tab === 'inventario') {
    cargarTablaInventario();
  } else if (tab === 'ventas') {
    cargarTablaVentas();
  } else if (tab === 'estadisticas') {
    actualizarEstadisticas();
  }
}

function cargarPanelAdmin() {
  cargarTablaInventario();
  cargarTablaVentas();
  actualizarEstadisticas();
}

// ===== ESTADÍSTICAS =====
function actualizarEstadisticas() {
  const stats = obtenerEstadisticasDetalladas();
  
  // Actualizar cards
  document.getElementById('stats-ingreso').textContent = `$${stats.ingresoTotal.toFixed(2)}`;
  document.getElementById('stats-ventas').textContent = stats.totalVentas;
  document.getElementById('stats-clientes').textContent = stats.clientesUnicos;
  document.getElementById('stats-conversion').textContent = `${stats.tasaConversion}%`;
  
  // Top productos
  const topProductos = document.getElementById('top-productos');
  topProductos.innerHTML = stats.topProductos.map((producto, index) => `
    <div class="top-item">
      <div class="top-item-rank">${index + 1}</div>
      <div class="top-item-info">
        <div class="top-item-name">${producto.nombre}</div>
        <div class="top-item-details">${producto.categoria} • $${producto.precio}</div>
      </div>
      <div class="top-item-value">${producto.vendidos} vendidos</div>
    </div>
  `).join('');
  
  // Ventas por categoría
  const chartCategorias = document.getElementById('chart-categorias');
  chartCategorias.innerHTML = stats.ventasPorCategoria.map(cat => `
    <div class="chart-bar">
      <div class="chart-bar-label">${cat.categoria}</div>
      <div class="chart-bar-container">
        <div class="chart-bar-fill" style="width: ${cat.porcentaje}%"></div>
      </div>
      <div class="chart-bar-value">${cat.ventas}</div>
    </div>
  `).join('');
  
  // Alertas de stock bajo
  const alertasStock = document.getElementById('alertas-stock');
  alertasStock.innerHTML = stats.stockBajo.map(producto => `
    <div class="alert-item">
      <div class="alert-icon">⚠️</div>
      <div class="alert-text">
        <strong>${producto.nombre}</strong><br>
        Stock crítico: ${producto.stock} unidades
      </div>
    </div>
  `).join('');
  
  if (stats.stockBajo.length === 0) {
    alertasStock.innerHTML = '<div class="empty-state-small">✅ Todo el stock está en niveles óptimos</div>';
  }
  
  // Ventas últimos días
  const chartVentas = document.getElementById('chart-ventas');
  chartVentas.innerHTML = stats.ventasUltimosDias.map(dia => `
    <div class="chart-bar">
      <div class="chart-bar-label">${dia.dia}</div>
      <div class="chart-bar-container">
        <div class="chart-bar-fill" style="width: ${dia.porcentaje}%"></div>
      </div>
      <div class="chart-bar-value">$${dia.total}</div>
    </div>
  `).join('');
}

function obtenerEstadisticasDetalladas() {
  const totalVentas = ventas.length;
  const ingresoTotal = ventas.reduce((sum, v) => sum + v.total, 0);
  
  // Clientes únicos (por email)
  const emailsUnicos = [...new Set(ventas.map(v => v.cliente.email))];
  
  // Top productos
  const productosMasVendidos = Object.entries(inventario)
    .map(([nombre, data]) => ({ 
      nombre, 
      categoria: data.categoria,
      precio: data.precio,
      vendidos: data.vendidos || 0 
    }))
    .sort((a, b) => b.vendidos - a.vendidos)
    .slice(0, 5);
  
  // Ventas por categoría
  const categorias = {};
  Object.values(inventario).forEach(producto => {
    if (!categorias[producto.categoria]) {
      categorias[producto.categoria] = { ventas: 0, productos: 0 };
    }
    categorias[producto.categoria].ventas += producto.vendidos || 0;
    categorias[producto.categoria].productos += 1;
  });
  
  const ventasPorCategoria = Object.entries(categorias).map(([cat, data]) => ({
    categoria: cat,
    ventas: data.ventas,
    productos: data.productos
  }));
  
  // Calcular porcentajes
  const maxVentas = Math.max(...ventasPorCategoria.map(c => c.ventas));
  ventasPorCategoria.forEach(cat => {
    cat.porcentaje = maxVentas > 0 ? (cat.ventas / maxVentas) * 100 : 0;
  });
  
  // Stock bajo (< 10 unidades)
  const stockBajo = Object.entries(inventario)
    .filter(([nombre, data]) => data.stock < 10)
    .map(([nombre, data]) => ({ nombre, stock: data.stock }));
  
  // Ventas últimos 7 días
  const ultimos7Dias = [];
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    const fechaStr = fecha.toLocaleDateString('es-EC', { weekday: 'short' });
    
    const ventasDia = ventas.filter(v => {
      const ventaFecha = new Date(v.fecha);
      return ventaFecha.toDateString() === fecha.toDateString();
    });
    
    const totalDia = ventasDia.reduce((sum, v) => sum + v.total, 0);
    ultimos7Dias.push({
      dia: fechaStr,
      total: totalDia,
      ventas: ventasDia.length
    });
  }
  
  const maxDia = Math.max(...ultimos7Dias.map(d => d.total));
  ultimos7Dias.forEach(dia => {
    dia.porcentaje = maxDia > 0 ? (dia.total / maxDia) * 100 : 0;
  });
  
  // Tasa de conversión (simulada)
  const visitasSimuladas = 5000;
  const tasaConversion = totalVentas > 0 ? ((totalVentas / visitasSimuladas) * 100).toFixed(1) : 0;
  
  return {
    totalVentas,
    ingresoTotal,
    clientesUnicos: emailsUnicos.length,
    tasaConversion,
    topProductos: productosMasVendidos,
    ventasPorCategoria,
    stockBajo,
    ventasUltimosDias: ultimos7Dias
  };
}

// ===== INVENTARIO =====
function cargarTablaInventario() {
  const tabla = document.getElementById('tabla-inventario');
  tabla.innerHTML = '';
  
  Object.entries(inventario).forEach(([nombre, data]) => {
    const estadoStock = data.stock < 5 ? 'stock-bajo' : 
                       data.stock < 20 ? 'stock-medio' : 'stock-alto';
    
    const estadoTexto = data.stock < 5 ? 'Crítico' : 
                       data.stock < 20 ? 'Bajo' : 'Normal';
    
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td><strong>${nombre}</strong></td>
      <td>${data.categoria}</td>
      <td>$${data.precio}</td>
      <td>${data.stock}</td>
      <td>${data.vendidos || 0}</td>
      <td><span class="stock-indicator ${estadoStock}">${estadoTexto}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-icon-small" onclick="editarProducto('${nombre}')">✏️</button>
          <button class="btn btn-secondary btn-icon-small" onclick="actualizarStock('${nombre}', 10)">➕10</button>
          <button class="btn btn-secondary btn-icon-small" onclick="actualizarStock('${nombre}', -1)">➖1</button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });
}

function filtrarInventario(filtro) {
  const botones = document.querySelectorAll('.inventory-filters .filter-btn-small');
  botones.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const tabla = document.getElementById('tabla-inventario');
  const filas = tabla.querySelectorAll('tr');
  
  filas.forEach(fila => {
    const categoria = fila.cells[1]?.textContent || '';
    const stock = parseInt(fila.cells[3]?.textContent) || 0;
    
    let mostrar = true;
    
    if (filtro === 'camisetas' && !categoria.includes('Camisetas')) mostrar = false;
    if (filtro === 'totes' && !categoria.includes('Tote')) mostrar = false;
    if (filtro === 'bajo' && stock >= 10) mostrar = false;
    
    fila.style.display = mostrar ? '' : 'none';
  });
}

function editarProducto(nombre) {
  productoEditando = nombre;
  const producto = inventario[nombre];
  
  document.getElementById('edit-nombre').value = nombre;
  document.getElementById('edit-categoria').value = producto.categoria;
  document.getElementById('edit-precio').value = producto.precio;
  document.getElementById('edit-stock').value = producto.stock;
  document.getElementById('edit-vendidos').value = producto.vendidos || 0;
  
  // Configurar el formulario
  const form = document.getElementById('form-editar-producto');
  form.onsubmit = function(e) {
    e.preventDefault();
    guardarCambiosProducto();
  };
  
  document.getElementById('editar-producto-modal').classList.add('active');
}

function cerrarEditarProducto() {
  document.getElementById('editar-producto-modal').classList.remove('active');
  productoEditando = null;
}

function guardarCambiosProducto() {
  if (!productoEditando) return;
  
  const nuevoNombre = document.getElementById('edit-nombre').value;
  const categoria = document.getElementById('edit-categoria').value;
  const precio = parseFloat(document.getElementById('edit-precio').value);
  const stock = parseInt(document.getElementById('edit-stock').value);
  const vendidos = parseInt(document.getElementById('edit-vendidos').value) || 0;
  
  // Si cambió el nombre, eliminar el viejo y crear nuevo
  if (nuevoNombre !== productoEditando) {
    delete inventario[productoEditando];
  }
  
  inventario[nuevoNombre] = {
    categoria,
    precio,
    stock,
    vendidos
  };
  
  guardarInventario();
  cargarTablaInventario();
  actualizarEstadisticas();
  actualizarTop3Dinamico();
  cerrarEditarProducto();
  
  mostrarNotificacion('✅ Producto actualizado correctamente');
}

function actualizarStock(nombre, cantidad) {
  if (!inventario[nombre]) return;
  
  inventario[nombre].stock += cantidad;
  if (inventario[nombre].stock < 0) inventario[nombre].stock = 0;
  
  guardarInventario();
  cargarTablaInventario();
  actualizarEstadisticas();
  
  mostrarNotificacion(`✅ Stock de ${nombre} actualizado: ${inventario[nombre].stock} unidades`);
}

function abrirNuevoProducto() {
  productoEditando = null;
  
  document.getElementById('edit-nombre').value = '';
  document.getElementById('edit-categoria').value = 'Camisetas';
  document.getElementById('edit-precio').value = '';
  document.getElementById('edit-stock').value = '';
  document.getElementById('edit-vendidos').value = '0';
  
  const form = document.getElementById('form-editar-producto');
  form.onsubmit = function(e) {
    e.preventDefault();
    crearNuevoProducto();
  };
  
  document.getElementById('editar-producto-modal').classList.add('active');
}

function crearNuevoProducto() {
  const nombre = document.getElementById('edit-nombre').value;
  const categoria = document.getElementById('edit-categoria').value;
  const precio = parseFloat(document.getElementById('edit-precio').value);
  const stock = parseInt(document.getElementById('edit-stock').value);
  const vendidos = parseInt(document.getElementById('edit-vendidos').value) || 0;
  
  if (!nombre || !precio || isNaN(stock)) {
    mostrarNotificacion('❌ Completa todos los campos requeridos');
    return;
  }
  
  if (inventario[nombre]) {
    mostrarNotificacion('❌ Ya existe un producto con ese nombre');
    return;
  }
  
  inventario[nombre] = {
    categoria,
    precio,
    stock,
    vendidos
  };
  
  guardarInventario();
  cargarTablaInventario();
  actualizarEstadisticas();
  cerrarEditarProducto();
  
  mostrarNotificacion('✅ Producto creado correctamente');
}

// ===== VENTAS =====
function cargarTablaVentas() {
  const tabla = document.getElementById('tabla-ventas');
  tabla.innerHTML = '';
  
  if (ventas.length === 0) {
    tabla.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div style="padding: 2rem; text-align: center; color: var(--gris);">
            📭 No hay ventas registradas
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  // Ordenar por fecha (más recientes primero)
  ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  ventas.forEach(venta => {
    const fecha = new Date(venta.fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const productosLista = venta.productos.map(p => 
      `${p.nombre} (x${p.cantidad})`
    ).join(', ');
    
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td><strong>${venta.id}</strong></td>
      <td>${fechaFormateada}</td>
      <td>${venta.cliente.nombre}<br><small>${venta.cliente.email}</small></td>
      <td>${productosLista}</td>
      <td>$${venta.total}</td>
      <td>${venta.metodoPago}</td>
      <td><span class="status-badge status-${venta.estado.toLowerCase()}">${venta.estado}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-icon-small" onclick="verDetalleVenta('${venta.id}')">👁️</button>
          <button class="btn btn-secondary btn-icon-small" onclick="descargarComprobante('${venta.id}')">📄</button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });
}

function verDetalleVenta(idVenta) {
  const venta = ventas.find(v => v.id === idVenta);
  if (!venta) return;
  
  const productosHTML = venta.productos.map(p => 
    `<li>${p.nombre} - $${p.precio} x ${p.cantidad} = $${p.precio * p.cantidad}</li>`
  ).join('');
  
  const detalles = `
    <div style="padding: 1rem; background: var(--crema-oscuro); border-radius: var(--radius);">
      <h4>Detalles de la venta ${venta.id}</h4>
      <p><strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleString('es-EC')}</p>
      <p><strong>Cliente:</strong> ${venta.cliente.nombre}</p>
      <p><strong>Email:</strong> ${venta.cliente.email}</p>
      <p><strong>Teléfono:</strong> ${venta.cliente.telefono}</p>
      <p><strong>Dirección:</strong> ${venta.cliente.direccion}, ${venta.cliente.ciudad}</p>
      <hr>
      <h5>Productos:</h5>
      <ul>${productosHTML}</ul>
      <p><strong>Subtotal:</strong> $${venta.subtotal}</p>
      <p><strong>Envío:</strong> $${venta.envio}</p>
      <p><strong>Total:</strong> $${venta.total}</p>
      <p><strong>Método de pago:</strong> ${venta.metodoPago}</p>
      <p><strong>Estado:</strong> ${venta.estado}</p>
    </div>
  `;
  
  mostrarModalDetalles('Detalles de Venta', detalles);
}

function descargarComprobante(idVenta) {
  const venta = ventas.find(v => v.id === idVenta);
  if (!venta) return;
  
  const contenido = `
    COMPROBANTE DE VENTA - PACHA TEE
    =================================
    ID: ${venta.id}
    Fecha: ${new Date(venta.fecha).toLocaleString('es-EC')}
    
    CLIENTE:
    Nombre: ${venta.cliente.nombre}
    Email: ${venta.cliente.email}
    Teléfono: ${venta.cliente.telefono}
    Dirección: ${venta.cliente.direccion}
    Ciudad: ${venta.cliente.ciudad}
    Código Postal: ${venta.cliente.codigoPostal}
    
    PRODUCTOS:
    ${venta.productos.map(p => `- ${p.nombre} x${p.cantidad} @ $${p.precio} = $${p.precio * p.cantidad}`).join('\n')}
    
    RESUMEN:
    Subtotal: $${venta.subtotal}
    Envío: $${venta.envio}
    TOTAL: $${venta.total}
    
    Método de pago: ${venta.metodoPago}
    Estado: ${venta.estado}
    
    =================================
    ¡Gracias por tu compra!
    Pacha-Tee - Moda + Realidad Aumentada
    Instagram: @pacha.tee
  `;
  
  const blob = new Blob([contenido], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comprobante-${venta.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  mostrarNotificacion('📄 Comprobante descargado');
}

function mostrarModalDetalles(titulo, contenido) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content modal-small">
      <div class="modal-header">
        <h3>${titulo}</h3>
        <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="modal-body">
        ${contenido}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function resetearSistema() {
  if (!confirm('⚠️ ¿ESTÁS SEGURO? Esto reseteará TODO:\n\n• Inventario a valores iniciales\n• Todas las ventas\n• Estadísticas\n\nEsta acción NO se puede deshacer.')) {
    return;
  }
  
  inventario = { ...INVENTARIO_INICIAL };
  ventas = [];
  
  guardarInventario();
  
  if (usarFirebase) {
    db.ref('ventas').remove();
  } else {
    localStorage.setItem('pacha-ventas', JSON.stringify(ventas));
  }
  
  cargarTablaInventario();
  cargarTablaVentas();
  actualizarEstadisticas();
  actualizarCarrito();
  actualizarTop3Dinamico();
  
  mostrarNotificacion('✅ Sistema reseteado completamente');
}