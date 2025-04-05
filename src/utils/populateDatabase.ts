import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Category, MenuItem } from '../types/Menu';

const mockCategories: Category[] = [
  { id: 201, name: "South Indian", icon: "🍛" },
  { id: 202, name: "Mexican", icon: "🌮" },
  { id: 203, name: "Chinese", icon: "🥢" },
  { id: 204, name: "Italian", icon: "🍝" },
  { id: 205, name: "Sindhi", icon: "🍲" }
];

const mockItems: Record<number, Omit<MenuItem, 'categoryId'>[]> = {
  201: [
    { 
      id: 1001, 
      name: "Idli", 
      description: "Steamed rice cakes made from fermented batter, served with sambar and coconut chutney", 
      image: "https://www.gettyimages.com/detail/photo/idli-with-coconut-chutney-and-sambhar-royalty-free-image/1158623408" 
    },
    { 
      id: 1002, 
      name: "Masala Dosa", 
      description: "Crispy rice crepe stuffed with spiced potatoes, served with chutneys", 
      image: "https://www.istockphoto.com/photo/masala-dosa-is-a-popular-south-indian-breakfast-dish-royalty-free-image/1325179956" 
    }
  ],
  202: [
    { 
      id: 2001, 
      name: "Tacos Al Pastor", 
      description: "Marinated pork cooked on vertical spit, served with pineapple and cilantro", 
      image: "https://www.istockphoto.com/photo/authentic-mexican-tacos-al-pastor-with-pineapple-cilantro-and-onion-gm1296057240-389657081" 
    },
    { 
      id: 2002, 
      name: "Chiles en Nogada", 
      description: "Poblano peppers stuffed with meat mixture, topped with walnut sauce and pomegranate", 
      image: "https://www.istockphoto.com/photo/chiles-en-nogada-gm1139961862-304955106" 
    }
  ],
  203: [
    { 
      id: 3001, 
      name: "Peking Duck", 
      description: "Crispy-skinned roasted duck served with pancakes and hoisin sauce", 
      image: "https://www.istockphoto.com/photo/peking-duck-gm497227083-41588899" 
    },
    { 
      id: 3002, 
      name: "Xiao Long Bao", 
      description: "Soup dumplings filled with pork and hot broth", 
      image: "https://www.istockphoto.com/photo/shanghai-soup-dumplings-gm1213999015-352952112" 
    }
  ],
  204: [
    { 
      id: 4001, 
      name: "Pizza Margherita", 
      description: "Neapolitan pizza with tomato, fresh mozzarella, and basil", 
      image: "https://www.istockphoto.com/photo/pizza-margherita-gm1280329631-379406495" 
    },
    { 
      id: 4002, 
      name: "Osso Buco", 
      description: "Milanese veal shanks braised with vegetables and white wine", 
      image: "https://www.istockphoto.com/photo/osso-buco-gm518022095-48858847" 
    }
  ],
  205: [
    { 
      id: 5001, 
      name: "Daal Pakwaan", 
      description: "Crispy fried bread served with spiced chana dal", 
      image: "https://www.vegrecipesofindia.com/wp-content/uploads/2021/04/dal-pakwan-1.jpg" 
    },
    { 
      id: 5002, 
      name: "Sindhi Kadhi", 
      description: "Tangy gram flour curry with vegetables and pakoras", 
      image: "https://www.vegrecipesofindia.com/wp-content/uploads/2020/04/sindhi-kadhi-1.jpg" 
    },
    { 
      id: 5003, 
      name: "Sindhi Kachori Bhaji", 
      description: "Spiced potato curry served with crispy kachoris", 
      image: "https://www.vegrecipesofindia.com/wp-content/uploads/2019/09/kachori-sabzi-1.jpg" 
    }
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
