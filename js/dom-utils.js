/*
 * DOM Utilities Module
 * Centralized utility for common DOM operations with caching and performance optimizations
 */

export const DOMUtils = {
    // Cache for frequently accessed elements
    cache: new Map(),
    
    // Get element with caching
    get(selector, useCache = true) {
        if (useCache && this.cache.has(selector)) {
            return this.cache.get(selector);
        }
        const element = document.querySelector(selector);
        if (useCache && element) {
            this.cache.set(selector, element);
        }
        return element;
    },
    
    // Get multiple elements
    getAll(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Create element with attributes and content
    create(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Set content
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    },
    
    // Batch DOM updates for better performance
    batchUpdate(updates) {
        requestAnimationFrame(() => {
            updates.forEach(update => {
                if (typeof update === 'function') {
                    update();
                }
            });
        });
    },
    
    // Toggle multiple classes on element
    toggleClasses(element, classMap) {
        if (!element) return;
        Object.entries(classMap).forEach(([className, shouldAdd]) => {
            element.classList.toggle(className, shouldAdd);
        });
    },
    
    // Set multiple attributes at once
    setAttributes(element, attributes) {
        if (!element) return;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    },
    
    // Remove element safely
    remove(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },
    
    // Clear cache (useful for dynamic content)
    clearCache() {
        this.cache.clear();
    },
    
    // Add event listener with automatic cleanup tracking
    addListener(element, event, handler, options = {}) {
        if (!element) return null;
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }
};