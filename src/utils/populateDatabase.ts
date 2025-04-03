import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Category, MenuItem } from '../types/Menu';

const mockCategories: Category[] = [
  { id: 101, name: "Main Course", icon: "🍲" },
  { id: 102, name: "Appetizers", icon: "🥟" },
  { id: 103, name: "Desserts", icon: "🍰" },
  { id: 104, name: "Beverages", icon: "🥤" },
  { id: 105, name: "Bread & Rice", icon: "🍚" }
];

const mockItems: Record<number, Omit<MenuItem, 'categoryId'>[]> = {
  101: [
    { id: 501, name: "Kadhai Paneer", description: "Cottage cheese cooked with bell peppers in a spicy masala", image: "https://www.secondrecipe.com/wp-content/uploads/2020/05/dhaba-style-kadai-paneer-001.jpg" },
    { id: 502, name: "Shahi Paneer", description: "Cottage cheese in a rich and creamy tomato sauce", image: "https://recipes.timesofindia.com/photo/53110729.cms?imgsize=160019" },
    { id: 503, name: "Butter Chicken", description: "Tender chicken in a rich buttery tomato sauce", image: "https://www.licious.in/blog/wp-content/uploads/2020/10/butter-chicken-.jpg" },
    { id: 504, name: "Chicken Tikka Masala", description: "Grilled chicken chunks in a spiced curry sauce", image: "https://www.licious.in/blog/wp-content/uploads/2020/12/Chicken-Tikka-Masala-min.jpg" },
    { id: 505, name: "Dal Makhani", description: "Black lentils simmered overnight with butter and cream", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" }
  ],
  102: [
    { id: 601, name: "Paneer Tikka", description: "Marinated cottage cheese chunks grilled in a tandoor", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" },
    { id: 602, name: "Spring Rolls", description: "Crispy rolls filled with vegetables", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" },
    { id: 603, name: "Samosas", description: "Triangular pastry filled with spiced potatoes and peas", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" },
    { id: 604, name: "Chicken 65", description: "Spicy deep-fried chicken bites", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" }
  ],
  103: [
    { id: 701, name: "Gulab Jamun", description: "Deep-fried milk solids soaked in sugar syrup", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" },
    { id: 702, name: "Rasmalai", description: "Soft cottage cheese dumplings in sweetened milk", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" },
    { id: 703, name: "Kheer", description: "Rice pudding with nuts and cardamom", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" }
  ],
  104: [
    { id: 801, name: "Mango Lassi", description: "Yogurt drink blended with mango and sugar", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" },
    { id: 802, name: "Masala Chai", description: "Spiced milk tea", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" },
    { id: 803, name: "Fresh Lime Soda", description: "Refreshing lime juice with soda water", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" }
  ],
  105: [
    { id: 901, name: "Butter Naan", description: "Soft leavened bread brushed with butter", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" },
    { id: 902, name: "Garlic Naan", description: "Naan topped with garlic and herbs", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" },
    { id: 903, name: "Jeera Rice", description: "Basmati rice cooked with cumin seeds", image: "http://3.bp.blogspot.com/-uck7Fi_bRfw/UA7ogu0DrzI/AAAAAAAARSI/rmu9iluFJG0/s1600/cb+ten.jpg" }
  ]
};

export const populateDatabase = async (): Promise<void> => {
  try {
    // Add categories
    for (const category of mockCategories) {
      await setDoc(doc(db, 'categories', category.id.toString()), category);
    }

    // Add menu items
    for (const [categoryId, items] of Object.entries(mockItems)) {
      for (const item of items) {
        const itemWithCategory: MenuItem = {
          ...item,
          categoryId: parseInt(categoryId)
        };
        await setDoc(doc(db, 'menuItems', item.id.toString()), itemWithCategory);
      }
    }

    console.log('Database populated successfully');
  } catch (error) {
    console.error('Error populating database:', error);
    throw error;
  }
};
