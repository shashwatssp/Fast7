export interface Category {
    id: number;
    name: string;
    icon: string;
  }
  
  export interface MenuItem {
    id: number;
    name: string;
    description: string;
    categoryId: number;
    image:string;
  }
  