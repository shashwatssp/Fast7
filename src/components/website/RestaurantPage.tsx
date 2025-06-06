"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore"
import "./RestaurantPage.css"
import { db } from "../../firebase"


interface MenuItem {
  id: string | number
  name: string
  description?: string
  price: number
  image?: string
}

interface Category {
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

interface RestaurantData {
  domainName: string
  menuSelections: MenuSelections
  restaurantInfo: RestaurantInfo
  orderingEnabled: boolean;
}

interface CustomerInfo {
  name: string
  contact: string
  address: string
}

interface RestaurantPageProps {
  subdomain?: string;
}

const RestaurantPage: React.FC<RestaurantPageProps> = ({ subdomain }) => {
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | number | null>(null)
  const [cart, setCart] = useState<MenuItem[]>([])
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

  const getSubdomainFromUrl = () => {
    return subdomain;
  }

  useEffect(() => {

    let restaurantDomain = getSubdomainFromUrl();

    const fetchRestaurantData = async () => {
      try {
        setLoading(true)

        const restaurantDocRef = doc(db, "restaurants", restaurantDomain)

        const restaurantDoc = await getDoc(restaurantDocRef)

        if (!restaurantDoc.exists()) {
          console.error("Restaurant document not found")
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
  }, [subdomain])

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
    setCart([...cart, item])
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

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price, 0)
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
  
    try {
      // Create a unique order ID
      const newOrderId = `ORD-${Date.now()}`
      
      // Calculate order total
      const orderTotal = calculateTotal()
      
      // Create order object
      const orderData = {
        id: newOrderId,
        restaurantId: restaurant?.domainName,
        customer: customerInfo,
        items: cart,
        total: orderTotal,
        pending: true,
        createdAt: serverTimestamp(),
      }
      
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
      
      // Reset cart after delay
      setTimeout(() => {
        setCart([])
        setShowCart(false)
        setCheckoutStep("cart")
        setOrderPlaced(false)
      }, 5000)
    } catch (error) {
      console.error("Error processing order: ", error)
      // Handle error - perhaps show a message to the user
    }
  }
  

  const handleBackToCart = () => {
    setCheckoutStep("cart")
  }


  if (loading) {

    return (
      <div className="restaurant-loading">
        <div className="loading-spinner"></div>
        <p>Setting the table for you...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="restaurant-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.href = "/"}>Try Again</button>
      </div>
    )
  }



  if (!restaurant) {

    return (
      <div className="restaurant-error">
        <h2>Restaurant Not Found</h2>
        <p>We couldn't find the restaurant you're looking for.</p>
      </div>
    )
  }

  const allCategories = [
    ...(restaurant.menuSelections?.standardCategories || []),
    ...(restaurant.menuSelections?.customCategories || []),
  ]



  return (
    <div className="restaurant-page">
<header 
  className="restaurant-header" 
  style={{
    position: 'relative',
    backgroundImage: `url(${restaurant.coverPhoto || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80'})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.7)',
  }}
>
  <div className="header-content">
  <h1>{restaurant.restaurantInfo.name}</h1>
  <div className="header-divider"></div>
  <p className="restaurant-bio">{restaurant.restaurantInfo.bio}</p>
  <div className="restaurant-contact">
    <span>📍 {restaurant.restaurantInfo.address}</span>
    <span>📞 {restaurant.restaurantInfo.phone}</span>
  </div>
  </div>
</header>


      <main className="restaurant-main">
        <div className="search-filter-container">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <select value={priceFilter} onChange={handlePriceFilter} className="price-filter">
              <option value="all">All Prices</option>
              <option value="under50">Under ₹200</option>
              <option value="50to100">₹200 - ₹400</option>
              <option value="over100">Over ₹400</option>
            </select>
          </div>
        </div>

        <div className="menu-container">
          <div className="menu-categories">
            <h2>Menu Categories</h2>
            <div className="categories-list">
              {allCategories.map((category) => (
                <div
                  key={category.id}
                  className={`category-item ${activeCategory === category.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="menu-items-container">
            {filteredItems.length === 0 ? (
              <div className="no-items-message">
                <p>No items found in this category</p>
              </div>
            ) : (
              <div className="menu-items-grid">
                {filteredItems.map((item) => (
                  <div key={item.id} className="menu-item">
                    <div className="item-image">
                      <img
                        src={item.image || '/path/to/default-image.jpg'}
                        alt={item.name}
                        className="menu-item-image"
                        onError={(e) => {
                          e.currentTarget.src = '/path/to/default-image.jpg';
                        }}
                      />
                    </div>
                    <div className="item-details">
                      <div className="item-header">
                        <h3>{item.name}</h3>
                        <p className="item-price">₹{item.price}</p>
                      </div>
                      {item.description && <p className="item-description">{item.description}</p>}
                      {restaurant.orderingEnabled && (
                        <button className="add-to-cart-btn" onClick={() => addToCart(item)}>
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {restaurant.orderingEnabled && (
        <div className={`cart-button ${cart.length > 0 ? "has-items" : ""}`} onClick={toggleCart}>
          <span className="cart-icon">🛒</span>
          {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
        </div>
      )}

      {showCart && (
        <div className="cart-modal">
          <div className="cart-overlay" onClick={toggleCart}></div>
          <div className="cart-content">
            {orderPlaced ? (
              <div className="order-confirmation">
                <div className="check-icon">✓</div>
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
                  <button className="close-cart" onClick={toggleCart}>
                    ×
                  </button>
                </div>

                {checkoutStep === "cart" ? (
                  <>
                    {cart.length === 0 ? (
                      <div className="empty-cart">

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
                                <p className="cart-item-price">₹{item.price}</p>
                              </div>
                              <button className="remove-item" onClick={() => removeFromCart(index)}>
                                Remove
                              </button>
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
                        <label htmlFor="address">Delivery Address</label>
                        <textarea
                          id="address"
                          name="address"
                          required
                          rows={3}
                          value={customerInfo.address}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="order-summary">
                        <h3>Order Summary</h3>
                        <p>{cart.length} item(s)</p>
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

      {/* Footer */}
      <footer className="restaurant-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p>📍 {restaurant.restaurantInfo.address}</p>
            <p>📞 {restaurant.restaurantInfo.phone}</p>
            <p>✉️ {restaurant.restaurantInfo.email}</p>
          </div>

          <div className="footer-section">
            <h3>Opening Hours</h3>
            <p>Monday - Friday: 11:00 AM - 10:00 PM</p>
            <p>Saturday - Sunday: 10:00 AM - 11:00 PM</p>
          </div>

          <div className="footer-section">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="#">Instagram</a>
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} {restaurant.restaurantInfo.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default RestaurantPage;

