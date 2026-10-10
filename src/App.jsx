import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

const sampleProducts = [
  {
    id: 1,
    name: 'Eco Bottle',
    price: 24,
    category: 'Lifestyle',
    image:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80',
    description: 'BPA-free insulated bottle for commutes and travel.',
  },
  {
    id: 2,
    name: 'Smart Lamp',
    price: 49,
    category: 'Home',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    description: 'Warm light with app-based dimming and scheduling.',
  },
  {
    id: 3,
    name: 'Trail Backpack',
    price: 89,
    category: 'Outdoors',
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    description: 'Durable 28L backpack with multiple storage compartments.',
  },
  {
    id: 4,
    name: 'Focus Headphones',
    price: 129,
    category: 'Tech',
    image:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    description: 'Wireless headphones designed for deep focus sessions.',
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

function App() {
  const [products, setProducts] = useState(sampleProducts);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          if (
            !/
            (Invalid API key|does not exist|Could not find the table|not found)/i.test(
              supabaseError.message || ''
            )
          ) {
            throw supabaseError;
          }

          if (!ignore) {
            setError(
              'Using demo data because no Supabase products table is connected yet.'
            );
            setProducts(sampleProducts);
          }
          return;
        }

        if (!ignore) {
          if (data && data.length > 0) {
            setProducts(data);
          } else {
            setProducts(sampleProducts);
          }
        }
      } catch (e) {
        if (!ignore) {
          setError('Something went wrong while loading products. Demo data is shown instead.');
          setProducts(sampleProducts);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category))],
    [products]
  );

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCart((currentCart) => currentCart.filter((item) => item.id !== id));
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id ? { ...item, quantity: nextQuantity } : item
      )
    );
  };

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = cart.length ? 12 : 0;
  const total = subtotal + shipping;

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Supabase Demo</p>
          <h1>Qpaylock Marketplace</h1>
        </div>
        <button className="primary-button">Launch Store</button>
      </header>

      <main className="layout">
        <section className="catalog-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Browse</p>
              <h2>Featured products</h2>
            </div>
            <div className="chip-row">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={selectedCategory === category ? 'chip active' : 'chip'}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="notice">{error}</p>}

          {loading ? (
            <div className="status-box">Loading products…</div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <img src={product.image} alt={product.name} />
                  <div className="product-body">
                    <div className="product-meta">
                      <span>{product.category}</span>
                      <strong>{formatCurrency(product.price)}</strong>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <button type="button" className="primary-button" onClick={() => addToCart(product)}>
                      Add to cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="cart-panel">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">Checkout</p>
              <h2>Your cart</h2>
            </div>
            <span className="badge">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty.</p>
              <span>Add a few products to get started.</span>
            </div>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div>
                    <h4>{item.name}</h4>
                    <p>{formatCurrency(item.price)} each</p>
                  </div>

                  <div className="quantity-row">
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>{formatCurrency(shipping)}</strong>
            </div>
            <div className="grand-total">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>

          <button type="button" className="checkout-button" disabled={cart.length === 0}>
            Proceed to checkout
          </button>
        </aside>
      </main>
    </div>
  );
}

export default App;
