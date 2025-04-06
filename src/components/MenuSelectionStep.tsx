import React, { useState, useEffect, useRef } from 'react';
import './MenuSelectionStep.css';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface MenuItem {
    selected?: boolean;
    price: string;
    name: string;
    description?: string;
    image?: string;
    isCustom?: boolean;
}

interface Category {
    id: string | number;
    name: string;
    icon: string;
    isCustom?: boolean;
}

interface MenuSelectionStepProps {
    onNext: (data: any) => void;
    onBack: () => void;
}

const MenuSelectionStep: React.FC<MenuSelectionStepProps> = ({ onNext, onBack }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedItems, setSelectedItems] = useState<Record<string | number, Record<string | number, MenuItem>>>({});
    const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
    const [customItem, setCustomItem] = useState({
        categoryName: '',
        itemName: '',
        price: '',
        description: '',
        image: ''
    });
    const [customCategories, setCustomCategories] = useState<Category[]>([]);
    const [customItems, setCustomItems] = useState<Record<string, Record<string, MenuItem>>>({});
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeCategory, setActiveCategory] = useState<string | number | null>(null);

    // New state for image upload
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

    // Reference for file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Function to handle image upload
    const handleImageUpload = async (categoryId: string | number, itemId: string, file: File) => {
        console.log('[1] Upload initiated for:', { categoryId, itemId, file });
        if (!file) {
            console.warn('[2] No file selected');
            return;
        }

        setUploading(true);
        setUploadingItemId(`${categoryId}-${itemId}`);
        console.log('[3] Upload state updated - uploading started');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'menu_items');
            console.log('[4] FormData created:', Array.from(formData.entries()));

            console.log('[5] Starting Cloudinary upload...');
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/dvm6d9t35/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            console.log('[6] Received response:', response.status, response.statusText);

            const data = await response.json();
            console.log('[7] Cloudinary response data:', data);

            if (!response.ok) {
                console.error('[8] Cloudinary upload failed:', data);
                throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
            }

            if (data.secure_url) {
                console.log('[9] Updating state with new image URL:', data.secure_url);

                // If it's a custom item being created
                if (categoryId === 'custom-new' && itemId === 'new') {
                    setCustomItem(prev => ({
                        ...prev,
                        image: data.secure_url
                    }));
                }
                // If it's an existing custom item
                else if (typeof categoryId === 'string' && categoryId.startsWith('custom_')) {
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
                console.log('[10] State update complete');
            }
        } catch (error) {
            console.error('[11] Error in upload process:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            console.log('[12] Cleaning up upload state');
            setUploading(false);
            setUploadingItemId(null);
        }
    };

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
                })) as Category[];

                // Fetch menu items from Firebase
                const itemsSnapshot = await getDocs(collection(db, 'menuItems'));
                const fetchedItems = itemsSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: parseInt(doc.id)
                }));

                // Group items by categoryId
                const groupedItems: Record<string | number, Record<string | number, MenuItem>> = {};
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
                    }, {} as Record<string | number, MenuItem>);
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

    const handleItemSelection = (categoryId: string | number, itemId: string | number) => {
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

    const handlePriceChange = (categoryId: string | number, itemId: string | number, price: string) => {
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

    const handleCustomItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCustomItem(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addCustomItem = () => {
        const { categoryName, itemName, price, description, image } = customItem;
        console.log("categoriesName ", categoryName);
        console.log("itemName ", itemName);
        console.log("price ", price);

        if (!categoryName.trim() || !itemName.trim() || !price.trim()) {
            alert("Please fill all fields");
            return;
        }

        // Check if category exists in custom categories
        let categoryId: string;
        const existingCategory = customCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());

        if (existingCategory) {
            categoryId = existingCategory.id.toString();
        } else {
            // Create new category with unique ID
            categoryId = `custom_${Date.now()}`;
            const newCategory: Category = {
                id: categoryId,
                name: categoryName,
                icon: "✨",
                isCustom: true
            };
            setCustomCategories(prev => [...prev, newCategory]);
        }

        // Create new item with unique ID
        const itemId = `item_${Date.now()}`;

        // Add to custom items - now including the image

        setCustomItems(prev => ({
            ...prev,
            [categoryId]: {
                ...(prev[categoryId] || {}),
                [itemId]: {
                    name: itemName,
                    description,
                    price,
                    selected: true,
                    isCustom: true,
                    image: image
                }
            }
        }));

        // Reset form
        setCustomItem({
            categoryName: '',
            itemName: '',
            price: '',
            description: '',
            image: '',
        });

        setShowCustomForm(false);

        // Set the newly added category as active
        setActiveCategory(categoryId);
    };



    const handleSubmit = () => {
        const menuSelections: {
            standardCategories: any[];
            standardItems: Record<string | number, any[]>;
            customCategories: any[];
            customItems: Record<string, any[]>;
        } = {
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
            if (!categoryItems) return;

            const selectedCategoryItems = Object.entries(categoryItems)
                .filter(([_, item]) => item.selected && item.price)
                .map(([itemId, item]) => ({
                    id: parseInt(itemId as string),
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

        // Process custom items - ensure images are included
        Object.entries(customItems).forEach(([categoryId, items]) => {
            menuSelections.customItems[categoryId] = Object.entries(items).map(([itemId, item]) => ({
                id: itemId,
                name: item.name,
                price: parseFloat(item.price),
                description: item.description,
                image: item.image // Include image in output
            }));
        });

        console.log("Final menu selections:", menuSelections);
        onNext(menuSelections);
    };

    const handleCustomItemSelection = (categoryId: string, itemId: string) => {
        setCustomItems(prev => ({
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

    const handleCustomItemPriceChange = (categoryId: string, itemId: string, price: string) => {
        setCustomItems(prev => ({
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


    const filteredItems = (categoryId: string | number) => {
        const items = selectedItems[categoryId] || {};

        if (!searchTerm) return items;

        return Object.entries(items).reduce((filtered, [id, item]) => {
            if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                filtered[id] = item;
            }
            return filtered;
        }, {} as Record<string | number, MenuItem>);
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
                    <div style={{ height: '20rem' }}></div>
                    <div className="loading-spinner"></div>
                    <p>Loading menu options...</p>
                    <div style={{ height: '200rem' }}></div>
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
                <div className="categories-list">
                    {categories.map(category => (
                        <div
                            key={category.id.toString()}
                            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category.id)}
                        >
                            <span className="category-icon">{category.icon}</span>
                            <span className="category-name">{category.name}</span>
                        </div>
                    ))}

                    {customCategories.map(category => (
                        <div
                            key={category.id.toString()}
                            className={`category-tab custom ${activeCategory === category.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category.id)}
                        >
                            <span className="category-icon">{category.icon}</span>
                            <span className="category-name">{category.name}</span>
                            <span className="custom-badge">Custom Category</span>
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
                                    {categories.find(c => c.id === activeCategory)?.icon}
                                </span>
                                {categories.find(c => c.id === activeCategory)?.name}
                            </h3>
                        </div>
                    )}

                    {activeCategory && customCategories.find(c => c.id === activeCategory) && (
                        <div className="menu-category-header custom">
                            <h3>
                                <span className="category-header-icon">
                                    {customCategories.find(c => c.id === activeCategory)?.icon}
                                </span>
                                {customCategories.find(c => c.id === activeCategory)?.name}
                                <span className="custom-header-badge">Custom Item</span>
                            </h3>
                        </div>
                    )}

                    {activeCategory && selectedItems[activeCategory] && (
                        <div className="menu-items-grid">
                            {Object.entries(filteredItems(activeCategory)).map(([itemId, item]) => (
                                <div
                                    key={itemId.toString()}
                                    className={`menu-item-card ${item.selected ? 'selected' : ''}`}
                                    onClick={() => handleItemSelection(activeCategory, itemId)}
                                >
                                    <div className="menu-item-image-container">
                                        <img
                                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300&h=200'}
                                            alt={item.name}
                                            className={`menu-item-image ${uploadingItemId === `${activeCategory}-${itemId}` ? 'uploading' : ''}`}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300&h=200';
                                            }}
                                        />
                                        <div
                                            className="image-upload-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log("HIT");
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.dataset.categoryId = activeCategory?.toString() || '';
                                                    fileInputRef.current.dataset.itemId = itemId.toString();
                                                    fileInputRef.current.click();
                                                }
                                            }}
                                        >
                                            <span>📷</span>
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
                                <div
                                    key={itemId}
                                    className={`menu-item-card custom ${item.selected ? 'selected' : ''}`}
                                    onClick={() => handleCustomItemSelection(activeCategory, itemId)}
                                >
                                    {/* ... existing image code ... */}
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
                                                    onChange={(e) => handleCustomItemPriceChange(activeCategory, itemId, e.target.value)}
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


                    {activeCategory &&
                        !selectedItems[activeCategory] &&
                        !customItems[activeCategory] && (
                            <div className="empty-category">
                                <p>No items in this category yet.</p>
                            </div>
                        )}
                </div>
            </div>

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
                                        src={customItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300&h=200'}
                                        alt="Preview"
                                        className={`custom-image-preview ${uploading && uploadingItemId === 'custom-new' ? 'uploading' : ''}`}
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300&h=200';
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
                                        <span>📷</span>
                                        {uploading && uploadingItemId === 'custom-new' && (
                                            <span className="upload-spinner-small"></span>
                                        )}
                                    </div>
                                </div>
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
                                <label htmlFor="categoryName">Category Name</label>
                                <input
                                    type="text"
                                    id="categoryName"
                                    name="categoryName"
                                    value={customItem.categoryName}
                                    onChange={handleCustomItemChange}
                                    placeholder="e.g., Specials, Signature Dishes"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description (Optional)</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={customItem.description}
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

export default MenuSelectionStep;

