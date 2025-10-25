/*
 * Progressive Loader Module
 * Handles on-demand loading of form steps for improved performance
 */

import { DOMUtils } from './dom-utils.js';

export const ProgressiveLoader = {
    loadedSteps: new Set(),
    loadingSteps: new Set(),
    
    // Check if step needs loading
    needsLoading(stepIndex) {
        return !this.loadedSteps.has(stepIndex) && !this.loadingSteps.has(stepIndex);
    },
    
    // Load step components asynchronously
    async loadStep(stepIndex) {
        if (!this.needsLoading(stepIndex)) {
            return Promise.resolve();
        }
        
        this.loadingSteps.add(stepIndex);
        
        try {
            // Simulate async loading with requestAnimationFrame for smooth UX
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // Initialize step-specific components
            await this.initializeStepComponents(stepIndex);
            
            this.loadedSteps.add(stepIndex);
            this.loadingSteps.delete(stepIndex);
        } catch (error) {
            console.error(`Failed to load step ${stepIndex}:`, error);
            this.loadingSteps.delete(stepIndex);
            throw error;
        }
    },
    
    // Initialize components for specific step
    async initializeStepComponents(stepIndex) {
        switch (stepIndex) {
            case 2: // Work Environment step
                this.initializeWorkEnvironmentComponents();
                break;
            case 3: // Skills step
                // Components already initialized in main script
                break;
            default:
                // No special initialization needed
                break;
        }
    },
    
    // Initialize work environment specific components
    initializeWorkEnvironmentComponents() {
        // Initialize any work environment specific functionality
        const workSettingCheckboxes = DOMUtils.getAll('input[name="work-setting"]');
        const companySizeCheckboxes = DOMUtils.getAll('input[name="company-size"]');
        
        // Add any specific event listeners or validation for work environment
        workSettingCheckboxes.forEach(checkbox => {
            if (!checkbox.hasAttribute('data-initialized')) {
                checkbox.setAttribute('data-initialized', 'true');
                // Add any specific work setting logic here
            }
        });
        
        companySizeCheckboxes.forEach(checkbox => {
            if (!checkbox.hasAttribute('data-initialized')) {
                checkbox.setAttribute('data-initialized', 'true');
                // Add any specific company size logic here
            }
        });
    },
    
    // Preload next step for better UX
    preloadNextStep(currentStepIndex) {
        const nextStepIndex = currentStepIndex + 1;
        const totalSteps = DOMUtils.getAll('.step').length;
        
        if (nextStepIndex < totalSteps && this.needsLoading(nextStepIndex)) {
            // Preload with a small delay to not interfere with current step
            setTimeout(() => {
                this.loadStep(nextStepIndex).catch(error => {
                    console.warn(`Failed to preload step ${nextStepIndex}:`, error);
                });
            }, 100);
        }
    }
};