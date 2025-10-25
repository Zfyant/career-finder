/*
 * Dynamic List Manager Module
 * Reusable component for managing dynamic lists (strengths, skills, etc.)
 */

import { DOMUtils } from './dom-utils.js';

export const DynamicListManager = {
    // Template configurations for different list types
    templates: {
        simple: {
            containerClass: 'grid grid-cols-[1fr,auto] gap-3 items-center mb-2',
            createContent: (namePrefix, placeholder, value = '') => {
                // Ensure value is a string to prevent [object Object] display
                const safeValue = typeof value === 'object' && value !== null ? '' : value;
                return `
                <input type="text" name="${namePrefix}" class="input-field" placeholder="${placeholder}" value="${safeValue}">
                <button type="button" class="remove-row-btn text-red-500 hover:text-red-700 font-medium">Remove</button>
                `;
            }
        },
        hardSkills: {
            containerClass: 'grid grid-cols-1 md:grid-cols-[3fr,2fr,2fr,auto] gap-4 items-end mb-3',
            createContent: (namePrefix, placeholder, values = {}) => `
                <div>
                    <label class="block text-sm font-medium mb-1">Skill</label>
                    <input type="text" name="hard-skill-name" class="input-field" value="${values.name || ''}" placeholder="e.g., JavaScript, SQL, Figma">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Proficiency</label>
                    <select name="hard-skill-proficiency" class="input-field">
                        <option value="1" ${values.proficiency == '1' ? 'selected' : ''}>1 - Novice</option>
                        <option value="2" ${values.proficiency == '2' ? 'selected' : ''}>2 - Beginner</option>
                        <option value="3" ${values.proficiency == '3' ? 'selected' : ''}>3 - Competent</option>
                        <option value="4" ${values.proficiency == '4' ? 'selected' : ''}>4 - Proficient</option>
                        <option value="5" ${values.proficiency == '5' ? 'selected' : ''}>5 - Expert</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Interest Level</label>
                    <select name="hard-skill-interest" class="input-field">
                        <option value="1" ${values.interest == '1' ? 'selected' : ''}>1 - Low</option>
                        <option value="2" ${values.interest == '2' ? 'selected' : ''}>2 - Medium-Low</option>
                        <option value="3" ${values.interest == '3' ? 'selected' : ''}>3 - Medium</option>
                        <option value="4" ${values.interest == '4' ? 'selected' : ''}>4 - High</option>
                        <option value="5" ${values.interest == '5' ? 'selected' : ''}>5 - Very High</option>
                    </select>
                </div>
                <div class="flex items-center lift-emoji">
                    <button type="button" class="remove-btn text-red-500 hover:text-red-700">⛔</button>
                </div>
            `
        },
        scorecard: {
            containerClass: 'grid grid-cols-[2fr,1fr] gap-3 items-center mb-2',
            createContent: (namePrefix, placeholder, values = {}) => `
                <input type="text" name="scorecard-criteria-name" class="input-field" placeholder="${placeholder}" value="${values.name || ''}" tabindex="-1">
                <input type="number" name="scorecard-criteria-weight" class="input-field" placeholder="Weight %" min="0" max="100" value="${values.weight || ''}">
            `,
            validation: {
                maxWeight: 100,
                requiresCallback: true
            }
        }
    },
    
    // Create a new list instance
    createList(containerId, addButtonId, template, config = {}) {
        const container = DOMUtils.get(`#${containerId}`);
        const addButton = DOMUtils.get(`#${addButtonId}`);
        
        if (!container || !addButton) {
            console.warn(`Could not find container (${containerId}) or button (${addButtonId})`);
            return null;
        }
        
        const listInstance = {
            container,
            addButton,
            template,
            config,
            itemCount: 0,
            templates: this.templates, // Make templates accessible to the instance
            
            // Add new item to list
            addItem(values = {}) {
                this.itemCount++;
                const namePrefix = this.config.namePrefix || `${containerId}-item-${this.itemCount}`;
                
                const item = DOMUtils.create('div', {
                    className: this.template.containerClass
                });
                
                item.innerHTML = this.template.createContent(namePrefix, this.config.placeholder || '', values);
                
                // Add remove functionality
                const removeBtn = item.querySelector('.remove-row-btn, .remove-btn');
                if (removeBtn) {
                    DOMUtils.addListener(removeBtn, 'click', () => {
                        this.removeItem(item);
                    });
                }
                
                // Add template-specific event listeners
                if (this.template.validation?.requiresCallback && this.config.onItemChange) {
                    const inputs = item.querySelectorAll('input, select');
                    inputs.forEach(input => {
                        DOMUtils.addListener(input, 'input', this.config.onItemChange);
                    });
                }
                
                this.container.appendChild(item);
                return item;
            },
            
            // Remove item from list
            removeItem(item) {
                if (item && item.parentNode === this.container) {
                    DOMUtils.remove(item);
                    if (this.config.onItemChange) {
                        this.config.onItemChange();
                    }
                }
            },
            
            // Get all values from list
            getValues() {
                const items = Array.from(this.container.children);
                return items.map(item => {
                    // Check for hard skills inputs
                    const hardSkillName = item.querySelector('input[name="hard-skill-name"]');
                    if (hardSkillName) {
                        return {
                            name: hardSkillName.value?.trim(),
                            proficiency: item.querySelector('select[name="hard-skill-proficiency"]')?.value,
                            interest: item.querySelector('select[name="hard-skill-interest"]')?.value
                        };
                    }
                    
                    // Check for scorecard inputs
                    const scorecardName = item.querySelector('input[name="scorecard-criteria-name"]');
                    if (scorecardName) {
                        return {
                            name: scorecardName.value?.trim(),
                            weight: item.querySelector('input[name="scorecard-criteria-weight"]')?.value
                        };
                    }
                    
                    // Simple template
                    const input = item.querySelector('input[type="text"]');
                    return input?.value?.trim();
                }).filter(value => {
                    if (typeof value === 'string') return value;
                    if (typeof value === 'object' && value !== null) return value.name;
                    return false;
                });
            },
            
            // Validate list contents
            validate() {
                if (this.template.validation) {
                    const values = this.getValues();
                    // Add validation logic here
                    return true;
                }
                return true;
            }
        };
        
        // Set up add button event listener
        DOMUtils.addListener(addButton, 'click', () => {
            listInstance.addItem();
        });
        
        // Add initial item if container is empty
        if (container.children.length === 0 && config.addInitialItem !== false) {
            listInstance.addItem();
        }
        
        return listInstance;
    },
    
    // Convenience methods for common list types
    createSimpleList(containerId, addButtonId, namePrefix, placeholder) {
        return this.createList(containerId, addButtonId, this.templates.simple, {
            namePrefix,
            placeholder: typeof placeholder === 'object' ? 'Add item...' : (placeholder || 'Add item...')
        });
    },
    
    createHardSkillsList(containerId, addButtonId, options = {}) {
        return this.createList(containerId, addButtonId, this.templates.hardSkills, {
            ...options,
            addInitialItem: options.addInitialItem ?? true
        });
    },
    
    createScorecardList(containerId, addButtonId, onItemChange) {
        return this.createList(containerId, addButtonId, this.templates.scorecard, {
            placeholder: 'e.g., Work-Life Balance',
            onItemChange,
            addInitialItem: false
        });
    }
};