import React, { useState, useEffect, useRef } from 'react';
// import './EditMenuComponent.css';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate, useParams } from 'react-router-dom';

const EditMenuComponent = ({ restaurantId, existingMenuSelections, onClose }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [selectedItems, setSelectedItems] = useState({});
    const [customCategories, setCustomCategories] = useState([]);
    const [customItems, setCustomItems] = useState({});
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customItem, setCustomItem] = useState({
        categoryName: '',
        itemName: '',
        price: '',
        description: '',
        image: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    
    // Image upload states
    const [uploading, setUploading] = useState(false);
    const [uploadingItemId, setUploadingItemId] = useState(null);
    const fileInputRef = useRef(null);

    // Load existing menu data and database items
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all categories from Firebase
                const categoriesSnapshot = await getDocs(collection(db, 'categories'));
                const fetchedCategories = categoriesSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: parseInt(doc.id)
                }));

                // Fetch all menu items from Firebase
                const itemsSnapshot = await getDocs(collection(db, 'menuItems'));
                const fetchedItems = itemsSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: parseInt(doc.id)
                }));

                // Initialize the selected items structure with all available items
                const groupedItems = {};
                fetchedCategories.forEach(category => {
                    const categoryItems = fetchedItems.filter(item =>
                        item.categoryId === category.id
                    );

                    groupedItems[category.id] = categoryItems.reduce((acc, item) => {
                        // Default state: not selected, no price
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

                // Now populate with existing selections from the restaurant's menu
                if (existingMenuSelections) {
                    // Handle standard items
                    Object.entries(existingMenuSelections.standardItems || {}).forEach(([categoryId, items]) => {
                        items.forEach(item => {
                            if (groupedItems[categoryId] && groupedItems[categoryId][item.id]) {
                                groupedItems[categoryId][item.id] = {
                                    ...groupedItems[categoryId][item.id],
                                    selected: true,
                                    price: item.price.toString(),
                                    image: item.image || groupedItems[categoryId][item.id].image
                                };
                            }
                        });
                    });

                    // Set custom categories and items
                    setCustomCategories(existingMenuSelections.customCategories || []);
                    setCustomItems(existingMenuSelections.customItems || {});
                }

                setCategories(fetchedCategories);
                setSelectedItems(groupedItems);

                // Set first category as active
                if (fetchedCategories.length > 0) {
                    setActiveCategory(fetchedCategories[0].id);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [existingMenuSelections]);

    // Handle image upload
    const handleImageUpload = async (categoryId, itemId, file) => {
        if (!file) {
            console.warn('No file selected');
            return;
        }

        setUploading(true);
        setUploadingItemId(`${categoryId}-${itemId}`);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'menu_items');
            
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/dvm6d9t35/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
            }

            if (data.secure_url) {
                // If it's an existing custom item
                if (typeof categoryId === 'string' && categoryId.startsWith('custom_')) {
                    setCustomItems(prev => ({
                        ...prev,
                        [categoryId]: {
                            ...prev[categoryId],
                            [itemId]: {
                                ...prev[categoryId][itemId],
                                image: data.secure_url
                            }
                        }
                    }));
                }
                // If it's a new custom item being created
                else if (categoryId === 'custom-new' && itemId === 'new') {
                    setCustomItem(prev => ({
                        ...prev,
                        image: data.secure_url
                    }));
                }
                // Regular menu items
                else {
                    setSelectedItems(prev => ({
                        ...prev,
                        [categoryId]: {
                            ...prev[categoryId],
                            [itemId]: {
                                ...prev[categoryId][itemId],
                                image: data.secure_url
                            }
                        }
                    }));
                }
            }
        } catch (error) {
            console.error('Error in upload process:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
            setUploadingItemId(null);
        }
    };

    // Toggle selection of an item
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

    // Update price of an item
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

    // Handle custom item form changes
    const handleCustomItemChange = (e) => {
        const { name, value } = e.target;
        setCustomItem(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Add a new custom item
    const addCustomItem = () => {
        const { categoryName, itemName, price, description, image } = customItem;

        if (!categoryName.trim() || !itemName.trim() || !price.trim()) {
            alert("Please fill all fields");
            return;
        }

        // Check if category exists in custom categories
        let categoryId;
        const existingCategory = customCategories.find(cat =>
            cat.name.toLowerCase() === categoryName.toLowerCase());

        if (existingCategory) {
            categoryId = existingCategory.id;
        } else {
            // Create new category
            categoryId = `custom_${Date.now()}`;
            const newCategory = {
                id: categoryId,
                name: categoryName,
                icon: "✨",
                isCustom: true
            };
            setCustomCategories(prev => [...prev, newCategory]);
        }

        // Create new item
        const itemId = `item_${Date.now()}`;

        // Add to custom items
        setCustomItems(prev => ({
            ...prev,
            [categoryId]: {
                ...(prev[categoryId] || {}),
                [itemId]: {
                    name: itemName,
                    price,
                    description: description || '',
                    selected: true,
                    isCustom: true,
                    image: image || ''
                }
            }
        }));

        // Reset form
        setCustomItem({
            categoryName: '',
            itemName: '',
            price: '',
            description: '',
            image: ''
        });

        setShowCustomForm(false);

        // Set the newly added category as active
        setActiveCategory(categoryId);
    };
    
    // Filter items based on search term
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

    // Count total selected items
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

    // Save menu changes to the database
    const saveMenuChanges = async () => {
        try {
            setLoading(true);

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
                    price: parseFloat(item.price),
                    description: item.description || '',
                    image: item.image || ''
                }));
            });

            // Update the restaurant document in Firestore
            await updateDoc(doc(db, 'restaurants', restaurantId), {
                'menuSelections': menuSelections
            });

            alert("Menu updated successfully!");
            onClose(menuSelections); // Close the component and return the updated menu
        } catch (error) {
            console.error("Error saving menu changes:", error);
            alert("Failed to save menu changes. Please try again.");
        } finally {
            setLoading(false);
        }
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
            <h2 className="menu-step-title">Edit Your Menu Items</h2>
            <p className="menu-step-description">
                Manage your restaurant menu items and pricing.
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
                {/* Category sidebar */}
                <div className="categories-list">
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

                {/* Menu items container */}
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
                                    <div className="menu-item-image-container">
                                        <img
                                            src={item.image || 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Add+Image'}
                                            alt={item.name}
                                            className={`menu-item-image ${uploadingItemId === `${activeCategory}-${itemId}` ? 'uploading' : ''}`}
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Add+Image';
                                            }}
                                        />
                                        <div
                                            className="image-upload-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.dataset.categoryId = activeCategory?.toString() || '';
                                                    fileInputRef.current.dataset.itemId = itemId;
                                                    fileInputRef.current.click();
                                                }
                                            }}
                                        >
                                            <span>{item.image ? '🔄' : '📷'}</span>
                                            {uploadingItemId === `${activeCategory}-${itemId}` && (
                                                <span className="upload-spinner-small"></span>
                                            )}
                                        </div>
                                    </div>
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
                                    <div className="menu-item-image-container">
                                        <img
                                            src={item.image || 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Add+Image'}
                                            alt={item.name}
                                            className={`menu-item-image ${uploadingItemId === `${activeCategory}-${itemId}` ? 'uploading' : ''}`}
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Add+Image';
                                            }}
                                        />
                                        <div
                                            className="image-upload-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.dataset.categoryId = activeCategory;
                                                    fileInputRef.current.dataset.itemId = itemId;
                                                    fileInputRef.current.click();
                                                }
                                            }}
                                        >
                                            <span>{item.image ? '🔄' : '📷'}</span>
                                            {uploadingItemId === `${activeCategory}-${itemId}` && (
                                                <span className="upload-spinner-small"></span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="menu-item-content">
                                        <div className="menu-item-header">
                                            <h4 className="menu-item-name">{item.name}</h4>
                                            <div className="custom-price">₹{item.price}</div>
                                        </div>
                                        <div className="custom-item-badge">Custom Item</div>
                                        {item.description && (
                                            <p className="menu-item-description">{item.description}</p>
                                        )}
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
                                <label htmlFor="itemImage">Item Image</label>
                                <div className="custom-image-upload">
                                    <img
                                        src={customItem.image || 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Add+Image'}
                                        alt="Preview"
                                        className={`custom-image-preview ${uploading && uploadingItemId === 'custom-new-new' ? 'uploading' : ''}`}
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Add+Image';
                                        }}
                                    />
                                    <div
                                        className="custom-image-upload-icon"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (fileInputRef.current) {
                                                fileInputRef.current.dataset.categoryId = 'custom-new';
                                                fileInputRef.current.dataset.itemId = 'new';
                                                fileInputRef.current.click();
                                            }
                                        }}
                                    >
                                        <span>{customItem.image ? '🔄' : '📷'}</span>
                                        {uploading && uploadingItemId === 'custom-new-new' && (
                                            <span className="upload-spinner-small"></span>
                                        )}
                                    </div>
                                </div>
                            </div>

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

                            <div className="form-group">
                                <label htmlFor="description">Description (Optional)</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={customItem.description || ''}
                                    onChange={handleCustomItemChange}
                                    placeholder="e.g., Our signature dish made with secret spices"
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
                <button type="button" className="back-button" onClick={onClose}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="next-button"
                    onClick={saveMenuChanges}
                    disabled={getSelectedItemsCount() === 0}
                >
                    Done
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                    if (!e.target.files?.length) return;

                    const categoryId = e.target.dataset.categoryId || '';
                    const itemId = e.target.dataset.itemId || '';

                    if (categoryId && itemId && e.target.files[0]) {
                        handleImageUpload(categoryId, itemId, e.target.files[0]);
                    }

                    e.target.value = '';
                }}
            />
        </div>
    );
};

export default EditMenuComponent;
