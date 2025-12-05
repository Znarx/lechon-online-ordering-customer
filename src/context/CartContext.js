import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    calculateTotal();
  }, [cartItems]);

  const calculateTotal = () => {
    const newTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  };

  const addToCart = (product) => {
    return new Promise((resolve) => {
      setCartItems(prevItems => {
        // Check for existing item by BOTH priceid AND productType
        const existingItem = prevItems.find(
          item => item.priceid === product.priceid && item.productType === product.productType
        );
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + (product.quantity || 1);
          let maxAvailable;
          
          // Handle viands
          if (product.productType === 'viands') {
            maxAvailable = product.availableQuantity;
            if (newQuantity > maxAvailable) {
              alert(`Sorry, only ${maxAvailable} servings available for ${product.name}`);
              resolve(false);
              return prevItems;
            }
            resolve(true);
            return prevItems.map(item =>
              item.priceid === product.priceid && item.productType === 'viands'
                ? { 
                    ...item, 
                    quantity: newQuantity,
                    availableQuantity: maxAvailable
                  }
                : item
            );
          } 
          // Handle lechon
          else {
            maxAvailable = product.availableQuantity || product.quantity;
            if (newQuantity > maxAvailable) {
              alert(`Sorry, only ${maxAvailable} items available`);
              resolve(false);
              return prevItems;
            }
            resolve(true);
            return prevItems.map(item =>
              item.priceid === product.priceid && item.productType === 'lechon'
                ? { 
                    ...item, 
                    quantity: newQuantity,
                    maxQuantity: maxAvailable
                  }
                : item
            );
          }
        }

        // For new items
        if (product.productType === 'viands') {
          const availableQuantity = product.availableQuantity;
          if ((product.quantity || 1) > availableQuantity) {
            alert(`Sorry, only ${availableQuantity} servings available for ${product.name}`);
            resolve(false);
            return prevItems;
          }
          resolve(true);
          return [...prevItems, {
            ...product,
            quantity: product.quantity || 1,
            availableQuantity,
            productType: 'viands',
            imageUrl: product.imageSrc
          }];
        } else {
          // Lechon logic for new items
          const maxQuantity = product.availableQuantity || product.quantity;
          resolve(true);
          return [...prevItems, {
            ...product,
            quantity: product.quantity || 1,
            productType: 'lechon',
            maxQuantity: maxQuantity,
            imageUrl: product.imageUrl
          }];
        }
      });
    });
  };

  const updateQuantity = (priceid, newQuantity, productType) => {
    return new Promise((resolve) => {
      setCartItems(prevItems => {
        // Find item by BOTH priceid AND productType
        const item = prevItems.find(
          i => i.priceid === priceid && i.productType === productType
        );
        
        if (!item || newQuantity < 1) {
          resolve(false);
          return prevItems;
        }

        // Handle viands
        if (item.productType === 'viands') {
          if (newQuantity > item.availableQuantity) {
            alert(`Sorry, only ${item.availableQuantity} servings available for ${item.name}`);
            resolve(false);
            return prevItems;
          }
          resolve(true);
          return prevItems.map(i =>
            i.priceid === priceid && i.productType === 'viands'
              ? { ...i, quantity: newQuantity }
              : i
          );
        } 
        // Handle lechon
        else {
          const maxQuantity = item.maxQuantity;
          if (newQuantity > maxQuantity) {
            alert(`Sorry, only ${maxQuantity} items available`);
            resolve(false);
            return prevItems;
          }
          resolve(true);
          return prevItems.map(i =>
            i.priceid === priceid && i.productType === 'lechon'
              ? { ...i, quantity: newQuantity }
              : i
          );
        }
      });
    });
  };

  const removeFromCart = (priceid, productType) => {
    setCartItems(prevItems => 
      prevItems.filter(item => !(item.priceid === priceid && item.productType === productType))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      total,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}