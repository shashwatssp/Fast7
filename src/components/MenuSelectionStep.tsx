import React, { useState, useEffect } from 'react';
import './MenuSelectionStep.css';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const MenuSelectionStep = ({ onNext, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [selectedItems, setSelectedItems] = useState({});
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customItem, setCustomItem] = useState({
        categoryName: '',
        itemName: '',
        price: ''
    });
    const [customCategories, setCustomCategories] = useState([]);
    const [customItems, setCustomItems] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);

    // Fetch categories and menu items from Firebase
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch categories from Firebase
                const categoriesSnapshot = await getDocs(collection(db, 'categories'));
                const fetchedCategories = categoriesSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: parseInt(doc.id)
                }));

                // Fetch menu items from Firebase
                const itemsSnapshot = await getDocs(collection(db, 'menuItems'));
                const fetchedItems = itemsSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: parseInt(doc.id)
                }));

                // Group items by categoryId
                const groupedItems = {};
                fetchedCategories.forEach(category => {
                    const categoryItems = fetchedItems.filter(item =>
                        item.categoryId === category.id
                    );

                    groupedItems[category.id] = categoryItems.reduce((acc, item) => {
                        acc[item.id] = {
                            selected: false,
                            price: '',
                            name: item.name,
                            description: item.description,
                            image: item.image

                        };
                        return acc;
                    }, {});
                });

                setCategories(fetchedCategories);
                setSelectedItems(groupedItems);

                // Set the first category as active if categories exist
                if (fetchedCategories.length > 0) {
                    setActiveCategory(fetchedCategories[0].id);
                }
            } catch (error) {
                console.error('Error fetching data from Firebase:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleItemSelection = (categoryId, itemId) => {
        setSelectedItems(prev => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                [itemId]: {
                    ...prev[categoryId][itemId],
                    selected: !prev[categoryId][itemId].selected
                }
            }
        }));
    };

    const handlePriceChange = (categoryId, itemId, price) => {
        setSelectedItems(prev => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                [itemId]: {
                    ...prev[categoryId][itemId],
                    price
                }
            }
        }));
    };

    const handleCustomItemChange = (e) => {
        const { name, value } = e.target;
        setCustomItem(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addCustomItem = () => {
        const { categoryName, itemName, price } = customItem;

        if (!categoryName.trim() || !itemName.trim() || !price.trim()) {
            alert("Please fill all fields");
            return;
        }

        // Check if category exists in custom categories
        let categoryId;
        const existingCategory = customCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());

        if (existingCategory) {
            categoryId = existingCategory.id;
        } else {
            // Create new category with unique ID
            categoryId = `custom_${Date.now()}`;
            const newCategory = {
                id: categoryId,
                name: categoryName,
                icon: "✨",
                isCustom: true
            };
            setCustomCategories(prev => [...prev, newCategory]);
        }

        // Create new item with unique ID
        const itemId = `item_${Date.now()}`;

        // Add to custom items
        setCustomItems(prev => ({
            ...prev,
            [categoryId]: {
                ...(prev[categoryId] || {}),
                [itemId]: {
                    name: itemName,
                    price,
                    selected: true,
                    isCustom: true
                }
            }
        }));

        // Reset form
        setCustomItem({
            categoryName: '',
            itemName: '',
            price: ''
        });

        setShowCustomForm(false);

        // Set the newly added category as active
        setActiveCategory(categoryId);
    };

    const handleSubmit = () => {
        const menuSelections = {
            standardCategories: [],
            standardItems: {},
            customCategories: customCategories.map(cat => ({
                id: cat.id,
                name: cat.name,
                icon: cat.icon
            })),
            customItems: {}
        };

        // Process standard items
        categories.forEach(category => {
            const categoryItems = selectedItems[category.id];
            const selectedCategoryItems = Object.entries(categoryItems)
                .filter(([_, item]) => item.selected && item.price)
                .map(([itemId, item]) => ({
                    id: parseInt(itemId),
                    name: item.name,
                    description: item.description,
                    price: parseFloat(item.price),
                    image: item.image
                }));

            if (selectedCategoryItems.length > 0) {
                menuSelections.standardCategories.push({
                    id: category.id,
                    name: category.name,
                    icon: category.icon
                });
                menuSelections.standardItems[category.id] = selectedCategoryItems;
            }
        });

        // Process custom items
        Object.entries(customItems).forEach(([categoryId, items]) => {
            menuSelections.customItems[categoryId] = Object.entries(items).map(([itemId, item]) => ({
                id: itemId,
                name: item.name,
                price: parseFloat(item.price)
            }));
        });

        console.log("Final menu selections:", menuSelections);
        onNext(menuSelections);
    };


    const filteredItems = (categoryId) => {
        const items = selectedItems[categoryId] || {};

        if (!searchTerm) return items;

        return Object.entries(items).reduce((filtered, [id, item]) => {
            if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                filtered[id] = item;
            }
            return filtered;
        }, {});
    };

    const getSelectedItemsCount = () => {
        let count = 0;

        // Count standard items
        Object.values(selectedItems).forEach(categoryItems => {
            Object.values(categoryItems).forEach(item => {
                if (item.selected && item.price) count++;
            });
        });

        // Count custom items
        Object.values(customItems).forEach(categoryItems => {
            count += Object.keys(categoryItems).length;
        });

        return count;
    };

    if (loading) {
        return (
            <div className="menu-step-container">
                <div className="menu-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading menu options...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="menu-step-container">
            <h2 className="menu-step-title">Select Your Menu Items</h2>
            <p className="menu-step-description">
                Choose items from our database or add your own custom dishes.
            </p>

            <div className="menu-selection-counter">
                <span className="counter-icon">🍽️</span>
                <span className="counter-text">
                    {getSelectedItemsCount()} items selected
                </span>
            </div>

            <div className="menu-search-container">
                <input
                    type="text"
                    className="menu-search-input"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="search-icon">🔍</span>
            </div>

            <div className="menu-content">
                <div className="category-sidebar">
                    {categories.map(category => (
                        <div
                            key={category.id}
                            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category.id)}
                        >
                            <span className="category-icon">{category.icon}</span>
                            <span className="category-name">{category.name}</span>
                        </div>
                    ))}

                    {customCategories.map(category => (
                        <div
                            key={category.id}
                            className={`category-tab custom ${activeCategory === category.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category.id)}
                        >
                            <span className="category-icon">{category.icon}</span>
                            <span className="category-name">{category.name}</span>
                            <span className="custom-badge">Custom</span>
                        </div>
                    ))}

                    <div
                        className="add-category-tab"
                        onClick={() => setShowCustomForm(true)}
                    >
                        <span className="add-icon">+</span>
                        <span className="add-text">Add Custom</span>
                    </div>
                </div>

                <div className="menu-items-container">
                    {activeCategory && categories.find(c => c.id === activeCategory) && (
                        <div className="menu-category-header">
                            <h3>
                                <span className="category-header-icon">
                                    {categories.find(c => c.id === activeCategory).icon}
                                </span>
                                {categories.find(c => c.id === activeCategory).name}
                            </h3>
                        </div>
                    )}

                    {activeCategory && customCategories.find(c => c.id === activeCategory) && (
                        <div className="menu-category-header custom">
                            <h3>
                                <span className="category-header-icon">
                                    {customCategories.find(c => c.id === activeCategory).icon}
                                </span>
                                {customCategories.find(c => c.id === activeCategory).name}
                                <span className="custom-header-badge">Custom</span>
                            </h3>
                        </div>
                    )}

                    {activeCategory && selectedItems[activeCategory] && (
                        <div className="menu-items-grid">
                            {Object.entries(filteredItems(activeCategory)).map(([itemId, item]) => (
                                <div
                                    key={itemId}
                                    className={`menu-item-card ${item.selected ? 'selected' : ''}`}
                                    onClick={() => handleItemSelection(activeCategory, itemId)}
                                >
                                    <img
                                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300&h=200'}
                                        alt={item.name}
                                        className="menu-item-image"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300&h=200';
                                        }}
                                    />
                                    <div className="menu-item-content">
                                        <div className="menu-item-header">
                                            <h4 className="menu-item-name">{item.name}</h4>
                                            <div className="menu-item-checkbox">
                                                <div className={`checkbox ${item.selected ? 'checked' : ''}`}>
                                                    {item.selected && <span className="check-mark">✓</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {item.description && (
                                            <p className="menu-item-description">{item.description}</p>
                                        )}

                                        {item.selected && (
                                            <div className="price-input-wrapper" onClick={(e) => e.stopPropagation()}>
                                                <span className="price-currency">₹</span>
                                                <input
                                                    type="number"
                                                    className="price-input"
                                                    placeholder="Enter price"
                                                    value={item.price}
                                                    onChange={(e) => handlePriceChange(activeCategory, itemId, e.target.value)}
                                                    min="0"
                                                    step="1"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeCategory && customItems[activeCategory] && (
                        <div className="menu-items-grid">
                            {Object.entries(customItems[activeCategory]).map(([itemId, item]) => (
                                <div key={itemId} className="menu-item-card custom selected">
                                    <div className="menu-item-content">
                                        <div className="menu-item-header">
                                            <h4 className="menu-item-name">{item.name}</h4>
                                            <div className="custom-price">₹{item.price}</div>
                                        </div>
                                        <div className="custom-item-badge">Custom Item</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeCategory &&
                        !selectedItems[activeCategory] &&
                        !customItems[activeCategory] && (
                            <div className="empty-category">
                                <p>No items in this category yet.</p>
                            </div>
                        )}
                </div>
            </div>

            {/* Custom Item Form */}
            {showCustomForm && (
                <div className="custom-form-overlay">
                    <div className="custom-item-form">
                        <div className="form-header">
                            <h3>Add Your Own Menu Item</h3>
                            <button
                                className="close-form-btn"
                                onClick={() => setShowCustomForm(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="form-body">
                            <div className="form-group">
                                <label htmlFor="categoryName">Category Name</label>
                                <input
                                    type="text"
                                    id="categoryName"
                                    name="categoryName"
                                    value={customItem.categoryName}
                                    onChange={handleCustomItemChange}
                                    placeholder="e.g., Chef's Specials"
                                    list="existing-categories"
                                    required
                                />
                                <datalist id="existing-categories">
                                    {customCategories.map(cat => (
                                        <option key={cat.id} value={cat.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label htmlFor="itemName">Item Name</label>
                                <input
                                    type="text"
                                    id="itemName"
                                    name="itemName"
                                    value={customItem.itemName}
                                    onChange={handleCustomItemChange}
                                    placeholder="e.g., Secret Family Recipe Curry"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="price">Price (₹)</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={customItem.price}
                                    onChange={handleCustomItemChange}
                                    placeholder="e.g., 299"
                                    min="0"
                                    step="1"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => setShowCustomForm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="add-item-btn"
                                onClick={addCustomItem}
                            >
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="menu-step-actions">
                <button type="button" className="back-button" onClick={onBack}>
                    Back
                </button>
                <button
                    type="button"
                    className="next-button"
                    onClick={handleSubmit}
                    disabled={getSelectedItemsCount() === 0}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default MenuSelectionStep;
