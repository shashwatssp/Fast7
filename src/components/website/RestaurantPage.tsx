"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore"
import "./RestaurantPage.css"
import { db } from "../../firebase"
import LocationPicker from "./LocationPicker"
import { RoutePoint } from "../../utils/olaMapsService"
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Search,
  ChevronDown,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Bike,
  ArrowDown,
  Check,
  Trash2,
  Instagram,
  Facebook,
  Twitter,
  UtensilsCrossed,
  ChefHat,
} from "lucide-react"

// Inline SVG placeholder shown when a dish has no image or its image fails to load
const FALLBACK_DISH_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='440'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23fdeedd'/%3E%3Cstop offset='1' stop-color='%23f7c9ad'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='640' height='440' fill='url(%23g)'/%3E%3Ctext x='320' y='240' font-size='110' text-anchor='middle'%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3C/svg%3E"


export interface MenuItem {
  id: string | number
  name: string
  description?: string
  price: number
  image?: string
}

interface CartItem extends MenuItem {
  quantity: number
}

export interface Category {
  id: string | number
  name: string
  icon: string
}

interface MenuSelections {
  standardCategories: Category[]
  customCategories: Category[]
  standardItems: Record<string | number, MenuItem[]>
  customItems: Record<string | number, MenuItem[]>
}

interface RestaurantInfo {
  name: string
  address: string
  phone: string
  email: string
  bio: string
}

export interface RestaurantData {
  domainName: string
  menuSelections: MenuSelections
  restaurantInfo: RestaurantInfo
  orderingEnabled: boolean;
  coverPhoto?: string;
  templateId?: string;
}

interface CustomerInfo {
  name: string
  contact: string
  address: string
  coordinates?: RoutePoint
}

export interface RestaurantPageProps {
  subdomain?: string;
  /** Force a specific template id (used by the template gallery preview) */
  templateOverride?: string;
  /** Render with provided data instead of fetching Firestore (used by the template gallery) */
  previewData?: RestaurantData | null;
}

const RestaurantPage: React.FC<RestaurantPageProps> = ({ subdomain, templateOverride, previewData }) => {
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState<boolean>(false)
  const [menuItems, setMenuItems] = useState<Record<string | number, MenuItem[]>>({})
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout">("cart")
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    contact: "",
    address: "",
  })
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false)
  const [orderId, setOrderId] = useState<string>("")
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false)

  const getSubdomainFromUrl = () => {
    return subdomain;
  }

  // SEO: give each restaurant website its own title, description, OG tags,
  // and schema.org structured data in the <head>.
  useEffect(() => {
    if (previewData || !restaurant) return

    const name = restaurant.restaurantInfo?.name
    if (!name) return

    const description =
      restaurant.restaurantInfo?.bio ||
      `Order delicious food online from ${name} — fresh ingredients, fast delivery.`
    const canonicalPath = `/${subdomain || restaurant.domainName || ''}`
    const canonicalUrl = `${window.location.origin}${canonicalPath}`

    const prevTitle = document.title
    document.title = `${name} — Order Food Online`

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', `${name} — Order Food Online`)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', 'restaurant.restaurant')
    setMeta('property', 'og:url', canonicalUrl)
    if (restaurant.coverPhoto) {
      setMeta('property', 'og:image', restaurant.coverPhoto)
    }

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    const ldJsonId = 'restaurant-structured-data'
    let ldScript = document.getElementById(ldJsonId)
    if (!ldScript) {
      ldScript = document.createElement('script')
      ldScript.id = ldJsonId
      ldScript.type = 'application/ld+json'
      document.head.appendChild(ldScript)
    }
    ldScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name,
      description,
      url: canonicalUrl,
      image: restaurant.coverPhoto || undefined,
      telephone: restaurant.restaurantInfo?.phone || undefined,
      email: restaurant.restaurantInfo?.email || undefined,
      address: restaurant.restaurantInfo?.address
        ? { '@type': 'PostalAddress', streetAddress: restaurant.restaurantInfo.address }
        : undefined,
      priceRange: '₹₹',
    })

    return () => {
      document.title = prevTitle
      document.getElementById(ldJsonId)?.remove()
    }
  }, [restaurant, previewData, subdomain])

  useEffect(() => {
    if (previewData) return

    let restaurantDomain = getSubdomainFromUrl();

    const fetchRestaurantData = async () => {
      try {
        setLoading(true)

        if (!restaurantDomain) {
          setError("No restaurant domain provided")
          setLoading(false)
          return
        }

        const restaurantDocRef = doc(db, "restaurants", restaurantDomain)

        const restaurantDoc = await getDoc(restaurantDocRef)

        if (!restaurantDoc.exists()) {
          console.log("Restaurant document not found for domain:", restaurantDomain)
          setError("Restaurant not found")
          setLoading(false)
          return
        }

        const restaurantData = restaurantDoc.data() as RestaurantData

        setRestaurant(restaurantData)

        const allMenuItems: Record<string | number, MenuItem[]> = {}

        if (restaurantData.menuSelections?.standardCategories) {


          for (const category of restaurantData.menuSelections.standardCategories) {

            const categoryItems = restaurantData.menuSelections.standardItems?.[category.id] || []
            allMenuItems[category.id] = categoryItems
          }
        }

        if (restaurantData.menuSelections?.customCategories) {

          for (const category of restaurantData.menuSelections.customCategories) {
            const categoryItems = restaurantData.menuSelections.customItems?.[category.id] || []
            allMenuItems[category.id] = categoryItems
          }
        }

        setMenuItems(allMenuItems)

        if (restaurantData.menuSelections?.standardCategories?.length > 0) {
          const firstCategoryId = restaurantData.menuSelections.standardCategories[0].id
          setActiveCategory(firstCategoryId)
        } else if (restaurantData.menuSelections?.customCategories?.length > 0) {
          const firstCustomCategoryId = restaurantData.menuSelections.customCategories[0].id
          setActiveCategory(firstCustomCategoryId)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching restaurant data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        setLoading(false)
      }
    }

    fetchRestaurantData()
  }, [subdomain, previewData])

  // When rendering with preview data (template gallery), build menu state directly
  useEffect(() => {
    if (!previewData) return

    const allMenuItems: Record<string | number, MenuItem[]> = {}

    for (const category of previewData.menuSelections?.standardCategories || []) {
      allMenuItems[category.id] = previewData.menuSelections?.standardItems?.[category.id] || []
    }
    for (const category of previewData.menuSelections?.customCategories || []) {
      allMenuItems[category.id] = previewData.menuSelections?.customItems?.[category.id] || []
    }

    setMenuItems(allMenuItems)

    const firstId =
      previewData.menuSelections?.standardCategories?.[0]?.id ??
      previewData.menuSelections?.customCategories?.[0]?.id ??
      null
    setActiveCategory(firstId)
  }, [previewData])

  useEffect(() => {
    if (activeCategory && menuItems[activeCategory]) {
      const items = menuItems[activeCategory] || []

      const filtered = items.filter((item) => {
        const matchesSearch =
          searchTerm === "" ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesPrice =
          priceFilter === "all" ||
          (priceFilter === "under50" && item.price < 200) ||
          (priceFilter === "50to100" && item.price >= 200 && item.price <= 400) ||
          (priceFilter === "over100" && item.price > 400)

        return matchesSearch && matchesPrice
      })

      setFilteredItems(filtered)
    }
  }, [activeCategory, menuItems, searchTerm, priceFilter])

  const addToCart = (item: MenuItem) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id)
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const newCart = [...cart]
      newCart[existingItemIndex].quantity += 1
      setCart(newCart)
    } else {
      // Add new item with quantity 1
      const cartItem: CartItem = {
        ...item,
        quantity: 1
      }
      setCart([...cart, cartItem])
    }
    
    const cartButton = document.querySelector(".cart-button")
    if (cartButton) {
      cartButton.classList.add("pulse")
      setTimeout(() => {
        cartButton.classList.remove("pulse")
      }, 500)
    }
  }

  const removeFromCart = (index: number) => {
    const newCart = [...cart]
    newCart.splice(index, 1)
    setCart(newCart)
  }

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index)
      return
    }
    
    const newCart = [...cart]
    newCart[index].quantity = quantity
    setCart(newCart)
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const toggleCart = () => {
    setShowCart(!showCart)
    if (!showCart) {
      setCheckoutStep("cart")
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handlePriceFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPriceFilter(e.target.value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCustomerInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckout = () => {
    setCheckoutStep("checkout")
  }

  const handleLocationSelect = (address: string, coordinates: RoutePoint) => {
    console.log('📍 RestaurantPage.handleLocationSelect called:', { address, coordinates });
    setCustomerInfo(prev => {
      console.log('📍 Updating customerInfo from:', prev, 'to:', { ...prev, address, coordinates });
      return {
        ...prev,
        address,
        coordinates,
      };
    });
    setShowLocationPicker(false);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (previewData) {
      alert('This is a design preview — orders are disabled here.')
      return
    }

    console.log('🛒 handlePlaceOrder called with customerInfo:', customerInfo);
  
    // Validate that location is selected
    if (!customerInfo.coordinates) {
      console.log('❌ No coordinates in customerInfo:', customerInfo);
      alert('Please select a location using the "Select Location" button to ensure accurate delivery address.');
      setShowLocationPicker(true);
      return;
    }

    if (!customerInfo.address || customerInfo.address.trim().length < 10) {
      console.log('❌ Address too short:', customerInfo.address);
      alert('Please enter a complete delivery address (at least 10 characters).');
      return;
    }
  
    try {
      // Create a unique order ID
      const newOrderId = `ORD-${Date.now()}`
      
      // Calculate order total
      const orderTotal = calculateTotal()
      
      // Create order object with coordinates
      const orderData = {
        id: newOrderId,
        restaurantId: restaurant?.domainName,
        customer: {
          ...customerInfo,
          coordinates: {
            lat: customerInfo.coordinates.lat,
            lng: customerInfo.coordinates.lng,
          },
        },
        items: cart,
        total: orderTotal,
        pending: true,
        status: 'pending',
        orderTime: new Date().toISOString(),
        createdAt: serverTimestamp(),
      }

      console.log('Placing order with data:', orderData);
      
      // Add to Firestore
      const ordersRef = collection(db, "orders")
      const docRef = await addDoc(ordersRef, orderData)
      
      console.log("Order added with ID: ", docRef.id)
      
      // Update restaurant's totalSalesDone
      if (restaurant?.domainName) {
        const domainPrefix = restaurant.domainName.split('.')[0]
        const restaurantRef = doc(db, 'restaurants', domainPrefix)
        
        // Use a transaction to safely update the total sales
        await runTransaction(db, async (transaction) => {
          const restaurantDoc = await transaction.get(restaurantRef)
          if (!restaurantDoc.exists()) {
            throw new Error("Restaurant document does not exist!")
          }
          
          // Get current totalSalesDone value (or default to 0 if it doesn't exist)
          const currentTotal = restaurantDoc.data()?.restaurantInfo?.totalSalesDone || 0
          
          // Update with the new total
          transaction.update(restaurantRef, {
            "restaurantInfo.totalSalesDone": currentTotal + orderTotal
          })
        })
        
        console.log(`Updated restaurant's totalSalesDone by adding ${orderTotal}`)
      }
      
      // Set order state for confirmation
      setOrderId(newOrderId)
      setOrderPlaced(true)
      
      // Redirect to order tracking after 2 seconds
      setTimeout(() => {
        // Navigate to order tracking page
        window.location.href = `/track/${newOrderId}`;
      }, 2000)
    } catch (error) {
      console.error("Error processing order: ", error)
      alert('There was an error placing your order. Please try again.');
    }
  }
  

  const handleBackToCart = () => {
    setCheckoutStep("cart")
  }


  if (!previewData && loading) {

    return (
      <div className="restaurant-loading">
        <div className="loading-spinner"></div>
        <p>Setting the table for you...</p>
      </div>
    )
  }

  if (!previewData && error) {
    return (
      <div className="restaurant-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.href = "/"}>Try Again</button>
      </div>
    )
  }



  const data = previewData ?? restaurant

  if (!data) {

    return (
      <div className="restaurant-error">
        <h2>Restaurant Not Found</h2>
        <p>We couldn't find the restaurant you're looking for.</p>
      </div>
    )
  }

  const templateId = templateOverride || data.templateId || 'ember'

  const allCategories = [
    ...(data.menuSelections?.standardCategories || []),
    ...(data.menuSelections?.customCategories || []),
  ]



  return (
    <div className={`restaurant-page tpl-${templateId}`}>
      <header className="restaurant-header">
        <div
          className="header-backdrop"
          style={{
            backgroundImage: `url(${data.coverPhoto || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80'})`,
          }}
        />
        <div className="header-content">
          <div className="header-badges">
            <span className="header-badge"><ChefHat size={15} /> Made Fresh to Order</span>
            <span className="header-badge"><Bike size={15} /> Fast Delivery</span>
          </div>
          <h1>{data.restaurantInfo.name}</h1>
          <p className="restaurant-bio">{data.restaurantInfo.bio}</p>
          <div className="restaurant-contact">
            <span className="contact-chip"><MapPin size={15} /> {data.restaurantInfo.address}</span>
            <a className="contact-chip" href={`tel:${data.restaurantInfo.phone}`}>
              <Phone size={15} /> {data.restaurantInfo.phone}
            </a>
          </div>
          {data.orderingEnabled && (
            <button
              className="header-cta"
              onClick={() => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore the Menu <ArrowDown size={16} />
            </button>
          )}
        </div>
      </header>


      <main className="restaurant-main">
        <div className="search-filter-container">
          <div className="search-container">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <div className="select-wrap">
              <select value={priceFilter} onChange={handlePriceFilter} className="price-filter">
                <option value="all">All Prices</option>
                <option value="under50">Under ₹200</option>
                <option value="50to100">₹200 - ₹400</option>
                <option value="over100">Over ₹400</option>
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
          </div>
        </div>

        <div className="menu-container">
          <div className="menu-heading" id="menu-section">
            <p className="menu-eyebrow">Our Menu</p>
            <h2>Explore What We&#39;ve Cooked Up</h2>
          </div>

          <div className="menu-categories">
            <div className="categories-list">
              {allCategories.map((category) => (
                <button
                  key={category.id}
                  className={`category-item ${activeCategory === category.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="menu-items-container">
            {filteredItems.length === 0 ? (
              <div className="no-items-message">
                <UtensilsCrossed size={36} strokeWidth={1.5} />
                <p>No items found in this category</p>
                <p className="no-items-hint">Try a different category or clear your search.</p>
              </div>
            ) : (
              <div className="menu-items-grid">
                {filteredItems.map((item) => (
                  <article key={item.id} className="menu-item">
                    <div className="item-image">
                      <img
                        src={item.image || FALLBACK_DISH_IMAGE}
                        alt={item.name}
                        className="menu-item-image"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_DISH_IMAGE;
                        }}
                      />
                    </div>
                    <div className="item-details">
                      <div className="item-header">
                        <h3>{item.name}</h3>
                        <p className="item-price">₹{item.price}</p>
                      </div>
                      {item.description && <p className="item-description">{item.description}</p>}
                      {data.orderingEnabled && (
                        <button className="add-to-cart-btn" onClick={() => addToCart(item)}>
                          <Plus size={16} /> Add to Cart
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {data.orderingEnabled && (
        <div className={`cart-button ${cart.length > 0 ? "has-items" : ""}`} onClick={toggleCart}>
          <ShoppingBag size={21} className="cart-icon" />
          {cart.length > 0 && (
            <span className="cart-total-hint">₹{calculateTotal()}</span>
          )}
          {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
        </div>
      )}

      {showCart && (
        <div className="cart-modal">
          <div className="cart-overlay" onClick={toggleCart}></div>
          <div className="cart-content">
            {orderPlaced ? (
              <div className="order-confirmation">
                <div className="check-icon"><Check size={34} strokeWidth={3} /></div>
                <h2>Order Confirmed!</h2>
                <p>Thank you for your order. We're preparing your delicious meal!</p>
                <div className="order-id">
                  <p>Order Reference</p>
                  <p className="order-number">{orderId}</p>
                </div>
                <p>You'll receive a confirmation shortly with your order details.</p>
              </div>
            ) : (
              <>
                <div className="cart-header">
                  <h2>{checkoutStep === "cart" ? "Your Order" : "Checkout"}</h2>
                  <button className="close-cart" onClick={toggleCart} aria-label="Close cart">
                    <X size={20} />
                  </button>
                </div>

                {checkoutStep === "cart" ? (
                  <>
                    {cart.length === 0 ? (
                      <div className="empty-cart">
                        <ShoppingBag size={44} strokeWidth={1.4} />
                        <p>Your cart is empty</p>
                        <p className="empty-cart-message">Add some delicious items to get started!</p>
                      </div>
                    ) : (
                      <>
                        <div className="cart-items">
                          {cart.map((item, index) => (
                            <div key={index} className="cart-item">
                              <div className="cart-item-details">
                                <h3>{item.name}</h3>
                                <p className="cart-item-price">₹{item.price} x {item.quantity}</p>
                              </div>
                              <div className="cart-item-actions">
                                <div className="quantity-controls">
                                  <button
                                    className="quantity-btn"
                                    onClick={() => updateQuantity(index, item.quantity - 1)}
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <span className="quantity">{item.quantity}</span>
                                  <button
                                    className="quantity-btn"
                                    onClick={() => updateQuantity(index, item.quantity + 1)}
                                    aria-label="Increase quantity"
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>
                                <button className="remove-item" onClick={() => removeFromCart(index)} aria-label="Remove item">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="cart-total">
                          <h3>Total: ₹{calculateTotal()}</h3>
                          <button className="checkout-button" onClick={handleCheckout}>
                            Proceed to Checkout
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="checkout-form-container">
                    <form onSubmit={handlePlaceOrder} className="checkout-form">
                      <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={customerInfo.name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="contact">Phone Number</label>
                        <input
                          type="tel"
                          id="contact"
                          name="contact"
                          required
                          value={customerInfo.contact}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="address">Delivery Address *</label>
                        <div className="address-input-container">
                          <textarea
                            id="address"
                            name="address"
                            required
                            rows={3}
                            value={customerInfo.address}
                            onChange={handleInputChange}
                            placeholder="Enter complete address or click 'Select Location' to use map"
                            readOnly={!!customerInfo.coordinates}
                            className={customerInfo.coordinates ? "address-validated" : ""}
                          />
                          <button
                            type="button"
                            className="btn-select-location"
                            onClick={() => {
                              console.log('📍 Location picker button clicked, current customerInfo:', customerInfo);
                              setShowLocationPicker(true);
                            }}
                          >
                            <MapPin size={15} /> {customerInfo.coordinates ? "Change Location" : "Select Location"}
                          </button>
                        </div>
                        {customerInfo.coordinates && (
                          <div className="location-confirmed">
                            ✓ Location confirmed: {customerInfo.coordinates.lat.toFixed(6)}, {customerInfo.coordinates.lng.toFixed(6)}
                          </div>
                        )}
                        {!customerInfo.coordinates && customerInfo.address && (
                          <div className="location-warning">
                            ⚠️ Please click "Select Location" to validate your address and ensure accurate delivery
                          </div>
                        )}
                      </div>

                      <div className="order-summary">
                        <h3>Order Summary</h3>
                        <p>{cart.reduce((total, item) => total + item.quantity, 0)} item(s)</p>
                        <p className="summary-total">Total: ₹{calculateTotal()}</p>
                      </div>

                      <div className="checkout-actions">
                        <button type="button" className="back-to-cart" onClick={handleBackToCart}>
                          Back to Cart
                        </button>
                        <button type="submit" className="place-order">
                          Place Order
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          initialAddress={customerInfo.address}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {/* Footer */}
      <footer className="restaurant-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p><MapPin size={15} /> {data.restaurantInfo.address}</p>
            <p><Phone size={15} /> {data.restaurantInfo.phone}</p>
            <p><Mail size={15} /> {data.restaurantInfo.email}</p>
          </div>

          <div className="footer-section">
            <h3>Opening Hours</h3>
            <p><Clock size={15} /> Monday - Friday: 11:00 AM - 10:00 PM</p>
            <p><Clock size={15} /> Saturday - Sunday: 10:00 AM - 11:00 PM</p>
          </div>

          <div className="footer-section">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="#" aria-label="Instagram"><Instagram size={17} /></a>
              <a href="#" aria-label="Facebook"><Facebook size={17} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={17} /></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} {data.restaurantInfo.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default RestaurantPage;

