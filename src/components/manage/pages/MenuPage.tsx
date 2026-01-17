import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../auth/AuthContext';
import PageHeader from '../shared/PageHeader';
import StatsCard from '../shared/StatsCard';
import './MenuPage.css';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number;
  ingredients?: string[];
  spicyLevel?: number;
  dietary?: string[];
  createdAt: any;
  updatedAt: any;
}

interface MenuStats {
  totalItems: number;
  availableItems: number;
  categories: number;
  avgPrice: number;
}

const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurantData } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [stats, setStats] = useState<MenuStats>({
    totalItems: 0,
    availableItems: 0,
    categories: 0,
    avgPrice: 0
  });
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    isAvailable: true,
    preparationTime: 15,
    ingredients: [],
    spicyLevel: 0,
    dietary: []
  });

  useEffect(() => {
    if (!restaurantData?.id) {
      navigate('/restaurant-onboarding');
      return;
    }

    const menuRef = collection(db, 'menuItems');
    const q = query(
      menuRef,
      where("restaurantId", "==", restaurantData.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const menuData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];

      setMenuItems(menuData);
      calculateStats(menuData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching menu items:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [restaurantData, navigate]);

  useEffect(() => {
    filterMenuItems();
  }, [menuItems, categoryFilter, availabilityFilter, searchTerm]);

  const calculateStats = (items: MenuItem[]) => {
    const newStats: MenuStats = {
      totalItems: items.length,
      availableItems: items.filter(item => item.isAvailable).length,
      categories: new Set(items.map(item => item.category)).size,
      avgPrice: items.length > 0 ? items.reduce((sum, item) => sum + (item.price || 0), 0) / items.length : 0
    };

    setStats(newStats);
  };

  const filterMenuItems = () => {
    let filtered = [...menuItems];

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Availability filter
    if (availabilityFilter !== 'all') {
      const isAvailable = availabilityFilter === 'available';
      filtered = filtered.filter(item => item.isAvailable === isAvailable);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const getCategories = () => {
    return Array.from(new Set(menuItems.map(item => item.category))).sort();
  };

  const handleAddItem = async () => {
    try {
      const newItem = {
        ...formData,
        restaurantId: restaurantData.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'menuItems'), newItem);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        isAvailable: true,
        preparationTime: 15,
        ingredients: [],
        spicyLevel: 0,
        dietary: []
      });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding menu item:", error);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem?.id) return;

    try {
      const itemRef = doc(db, 'menuItems', selectedItem.id);
      await updateDoc(itemRef, {
        ...formData,
        updatedAt: new Date()
      });
      
      setIsEditing(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error updating menu item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;

    try {
      await deleteDoc(doc(db, 'menuItems', itemId));
    } catch (error) {
      console.error("Error deleting menu item:", error);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const itemRef = doc(db, 'menuItems', item.id);
      await updateDoc(itemRef, {
        isAvailable: !item.isAvailable,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  const openEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditing(true);
  };

  const closeModals = () => {
    setIsEditing(false);
    setIsAdding(false);
    setSelectedItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      isAvailable: true,
      preparationTime: 15,
      ingredients: [],
      spicyLevel: 0,
      dietary: []
    });
  };

  const formatPrice = (price: number) => {
    if (isNaN(price)) return '₹0';
    return `₹${price.toFixed(2)}`;
  };

  const getSpicyLevelText = (level: number) => {
    const levels = ['Mild', 'Medium', 'Hot', 'Very Hot', 'Extra Hot'];
    return levels[level] || 'Mild';
  };

  if (loading) {
    return (
      <div className="menu-page">
        <div className="menu-loading">
          <div className="loading-spinner"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <div className="animated-bg">
        <div className="menu-container">
          <PageHeader 
            title="Menu Management" 
            subtitle="Manage your restaurant menu items"
          />

          {/* Stats Cards */}
          <div className="stats-grid">
            <StatsCard
              title="Total Items"
              value={stats.totalItems}
              subtitle="All menu items"
              color="primary"
            />
            <StatsCard
              title="Available"
              value={stats.availableItems}
              subtitle="Currently available"
              color="success"
            />
            <StatsCard
              title="Categories"
              value={stats.categories}
              subtitle="Menu categories"
              color="info"
            />
            <StatsCard
              title="Avg Price"
              value={formatPrice(stats.avgPrice)}
              subtitle="Average item price"
              color="warning"
            />
          </div>

          {/* Add Item Button */}
          <div className="menu-actions">
            <button 
              className="add-item-btn"
              onClick={() => setIsAdding(true)}
            >
              + Add New Item
            </button>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Category:</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {getCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Availability:</label>
              <select 
                value={availabilityFilter} 
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Items</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="filter-group search-group">
              <label>Search:</label>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Menu Items List */}
          <div className="menu-list-section">
            <h2 className="section-title">Menu Items ({filteredItems.length})</h2>
            
            {filteredItems.length === 0 ? (
              <div className="no-items">
                <p>No menu items found matching your criteria.</p>
              </div>
            ) : (
              <div className="menu-grid">
                {filteredItems.map((item) => (
                  <div key={item.id} className={`menu-item-card ${!item.isAvailable ? 'unavailable' : ''}`}>
                    <div className="item-header">
                      <div className="item-image">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} />
                        ) : (
                          <div className="placeholder-image">🍽️</div>
                        )}
                      </div>
                      <div className="availability-toggle">
                        <button 
                          className={`toggle-btn ${item.isAvailable ? 'available' : 'unavailable'}`}
                          onClick={() => toggleAvailability(item)}
                        >
                          {item.isAvailable ? '✓' : '✗'}
                        </button>
                      </div>
                    </div>

                    <div className="item-content">
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-category">{item.category}</p>
                      <p className="item-description">{item.description}</p>
                      
                      <div className="item-details">
                        <div className="item-price">{formatPrice(item.price)}</div>
                        {item.preparationTime && (
                          <div className="prep-time">⏱️ {item.preparationTime} min</div>
                        )}
                        {item.spicyLevel !== undefined && (
                          <div className="spicy-level">🌶️ {getSpicyLevelText(item.spicyLevel)}</div>
                        )}
                      </div>

                      {item.ingredients && item.ingredients.length > 0 && (
                        <div className="ingredients">
                          <span className="ingredients-label">Ingredients:</span>
                          <div className="ingredient-tags">
                            {item.ingredients.slice(0, 3).map((ingredient, index) => (
                              <span key={index} className="ingredient-tag">{ingredient}</span>
                            ))}
                            {item.ingredients.length > 3 && (
                              <span className="ingredient-tag">+{item.ingredients.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="item-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {(isAdding || isEditing) && (
        <div className="item-modal-overlay" onClick={closeModals}>
          <div className="item-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isAdding ? 'Add New Item' : 'Edit Item'}</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter item name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., Appetizers, Main Course, Desserts"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the item..."
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Preparation Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.preparationTime || ''}
                    onChange={(e) => setFormData({...formData, preparationTime: parseInt(e.target.value) || 15})}
                    placeholder="15"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Spicy Level</label>
                  <select
                    value={formData.spicyLevel || 0}
                    onChange={(e) => setFormData({...formData, spicyLevel: parseInt(e.target.value)})}
                  >
                    <option value={0}>Mild</option>
                    <option value={1}>Medium</option>
                    <option value={2}>Hot</option>
                    <option value={3}>Very Hot</option>
                    <option value={4}>Extra Hot</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Availability</label>
                  <select
                    value={formData.isAvailable ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.value === 'true'})}
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Ingredients (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.ingredients?.join(', ') || ''}
                    onChange={(e) => setFormData({...formData, ingredients: e.target.value.split(',').map(i => i.trim()).filter(i => i)})}
                    placeholder="e.g., Tomato, Onion, Garlic, Spices"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Dietary Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.dietary?.join(', ') || ''}
                    onChange={(e) => setFormData({...formData, dietary: e.target.value.split(',').map(i => i.trim()).filter(i => i)})}
                    placeholder="e.g., Vegetarian, Gluten-Free, Vegan"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={closeModals}>
                  Cancel
                </button>
                <button 
                  className="save-btn"
                  onClick={isAdding ? handleAddItem : handleUpdateItem}
                >
                  {isAdding ? 'Add Item' : 'Update Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;