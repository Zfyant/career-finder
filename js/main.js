/*
 * Main Application Entry Point
 * Coordinates all modules and initializes the career finder application
 */

import { DOMUtils } from './dom-utils.js';
import { ProgressiveLoader } from './progressive-loader.js';
import { DynamicListManager } from './dynamic-list-manager.js';
import { FormStateManager } from './form-state-manager.js';
import { FormUtilities } from './form-utilities.js';
import { Toast } from './toast.js';

// Application state
const App = {
    currentStep: 0,
    totalSteps: 0,
    dynamicLists: {},
    domCache: {},
    
    // Initialize the application
    init() {
        this.cacheDOMElements();
        this.setupEventListeners();
        this.initializeFormComponents();
        this.setupThemeSwitcher();
        this.setupFormNavigation();
        this.setupFormSubmission();
        
        // Initialize first step
        this.showStep(0);
        
        console.log('Career Finder App initialized');
    },
    
    // Cache frequently used DOM elements
    cacheDOMElements() {
        this.domCache = {
            themeSwitcher: DOMUtils.get('#theme-switcher'),
            body: document.body,
            form: DOMUtils.get('#career-profile-form'),
            steps: DOMUtils.getAll('.form-step'),
            prevBtn: DOMUtils.get('#prev-btn'),
            nextBtn: DOMUtils.get('#next-btn'),
            submitBtn: DOMUtils.get('#submit-btn'),
            stepIndicators: DOMUtils.getAll('.step-nav-btn'),
            outputContainer: DOMUtils.get('#output-container'),
            summaryOutput: DOMUtils.get('#summary-output'),
            promptOutput: DOMUtils.get('#prompt-output'),
            copyPromptBtn: DOMUtils.get('#copy-prompt-btn')
        };
        
        this.totalSteps = this.domCache.steps.length;
    },
    
    // Set up global event listeners
    setupEventListeners() {
        // Form state manager listeners
        FormStateManager.subscribe('stepChange', (data) => {
            this.updateStepIndicators(data.current);
            this.updateNavigationButtons(data.current);
        });
        
        FormStateManager.subscribe('validationChange', (data) => {
            this.handleValidationChange(data);
        });
        
        FormStateManager.subscribe('submit', (data) => {
            this.handleSubmissionStateChange(data);
        });


    },
    
    // Initialize form components
    initializeFormComponents() {
        // Initialize dynamic lists
        this.initializePersonality();
        this.initializePassionsAndGoals();
        this.initializePreferences();
        this.initializeHardSkills();
        this.initializeScorecard();
        
        // Make dynamic lists globally accessible for form state manager
        window.dynamicLists = this.dynamicLists;
    },
    
    // Initialize job scorecard section
    initializeScorecard() {
        // Update total weight when scorecard items change
        const updateTotalWeight = () => {
            if (this.dynamicLists.scorecard) {
                const items = this.dynamicLists.scorecard.getValues();
                const totalWeight = items.reduce((sum, item) => sum + (parseInt(item.weight) || 0), 0);
                const totalWeightDisplay = document.getElementById('total-weight');
                if (totalWeightDisplay) {
                    totalWeightDisplay.textContent = totalWeight + '%';
                    totalWeightDisplay.classList.toggle('text-red-500', totalWeight !== 100);
                }
            }
        };
        
        // Create scorecard without add button since items are fixed
        this.dynamicLists.scorecard = {
            container: document.getElementById('scorecard-container'),
            getValues() {
                const items = Array.from(this.container.children);
                return items.map(item => {
                    const nameInput = item.querySelector('input[name="scorecard-criteria-name"]');
                    const weightInput = item.querySelector('input[name="scorecard-criteria-weight"]');
                    return {
                        name: nameInput?.value?.trim(),
                        weight: weightInput?.value
                    };
                }).filter(item => item.name);
            },
            updateTotalWeight: updateTotalWeight // Expose the function
        };
        
        // Add default scorecard categories if none exist
        const container = document.getElementById('scorecard-container');
        if (container && container.children.length === 0) {
            // Add the 7 default categories with correct labels and 0% default values
            const defaultCategories = [
                { name: '💵 Compensation & Benefits', weight: '0' },
                { name: '⚖️ Work-Life Balance', weight: '0' },
                { name: '📈 Career Growth & Learning', weight: '0' },
                { name: '🌟 Impact & Meaning', weight: '0' },
                { name: '🏢 Company Culture & Values', weight: '0' },
                { name: '🔑 Autonomy & Ownership', weight: '0' },
                { name: '💻 Technology Stack', weight: '0' }
            ];
            
            defaultCategories.forEach(category => {
                const item = document.createElement('div');
                item.className = 'grid grid-cols-[2fr,1fr] gap-3 items-center mb-2';
                item.innerHTML = `
                    <input type="text" name="scorecard-criteria-name" class="input-field" value="${category.name}" readonly style="background-color: #374151; color: #9ca3af; cursor: not-allowed; border: 1px solid #4b5563;">
                    <input type="number" name="scorecard-criteria-weight" class="input-field" placeholder="Weight %" min="0" max="100" value="${category.weight}">
                `;
                
                // Add event listener to weight input for real-time calculation
                const weightInput = item.querySelector('input[name="scorecard-criteria-weight"]');
                if (weightInput) {
                    weightInput.addEventListener('input', updateTotalWeight);
                }
                
                container.appendChild(item);
            });
            
            // Update total weight
            updateTotalWeight();
        }
    },
    
    // Initialize personality section
    initializePersonality() {
        const sliders = document.querySelectorAll('.slider');
        sliders.forEach(slider => {
            this.updateSliderBackground(slider);
            slider.addEventListener('input', () => this.updateSliderBackground(slider));
        });
    },

    updateSliderBackground(slider) {
        const min = slider.min || 1;
        const max = slider.max || 7;
        const percent = ((slider.value - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--slider-thumb-bg) ${percent}%, var(--slider-track-bg) ${percent}%)`;
    },
    
    // Initialize passions and goals section
    initializePassionsAndGoals() {
        this.dynamicLists.passions = DynamicListManager.createSimpleList(
            'passions-container',
            'add-passion-btn',
            'passion',
            'e.g., Technology, Healthcare, Education'
        );
        
        this.dynamicLists.flowActivities = DynamicListManager.createSimpleList(
            'flow-activities-container',
            'add-flow-activity-btn',
            'flow-activity',
            'e.g., Solving complex puzzles'
        );

        this.dynamicLists.strengths = DynamicListManager.createSimpleList(
            'strengths-container',
            'add-strength-btn',
            'strength',
            'e.g., Project Management'
        );

        this.dynamicLists.growthAreas = DynamicListManager.createSimpleList(
            'growth-container',
            'add-growth-btn',
            'growth-area',
            'e.g., Public Speaking'
        );
    },
    
    // Initialize preferences section
    initializePreferences() {
        this.dynamicLists.dealBreakers = DynamicListManager.createSimpleList(
            'deal-breakers-container',
            'add-deal-breaker-btn',
            'deal-breaker',
            'e.g., Micromanagement, endless meetings, high turnover'
        );
    },
    
    // Initialize hard skills section
    initializeHardSkills() {
        this.dynamicLists.hardSkills = DynamicListManager.createHardSkillsList(
            'hard-skills-container',
            'add-hard-skill-btn'
        );
        
        // Add default placeholder for Hard Skills
        if (this.dynamicLists.hardSkills.getValues().length === 0) {
            this.dynamicLists.hardSkills.addItem();
        }
    },
    
    // Set up theme switcher
    setupThemeSwitcher() {
        const { themeSwitcher, body } = this.domCache;
        
        if (themeSwitcher) {
            // Default to dark mode if no preference is saved
            const savedTheme = localStorage.getItem('theme') || 'dark';
            
            if (savedTheme === 'dark') {
                body.classList.add('dark');
                themeSwitcher.checked = true;
            } else {
                body.classList.remove('dark');
                themeSwitcher.checked = false;
            }
            
            DOMUtils.addListener(themeSwitcher, 'change', () => {
                const isDark = themeSwitcher.checked;
                body.classList.toggle('dark', isDark);
                
                // Save theme preference
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        }
    },
    
    // Set up form navigation
    setupFormNavigation() {
        const { prevBtn, nextBtn, stepIndicators } = this.domCache;
        
        // Previous button
        if (prevBtn) {
            DOMUtils.addListener(prevBtn, 'click', () => {
                if (this.currentStep > 0) {
                    this.showStep(this.currentStep - 1);
                }
            });
        }
        
        // Next button
        if (nextBtn) {
            DOMUtils.addListener(nextBtn, 'click', () => {
                if (this.validateCurrentStep() && this.currentStep < this.totalSteps - 1) {
                    this.showStep(this.currentStep + 1);
                }
            });
        }
        
        // Step indicators
        stepIndicators.forEach((indicator, index) => {
            DOMUtils.addListener(indicator, 'click', () => {
                if (this.canNavigateToStep(index)) {
                    this.showStep(index);
                }
            });
        });
    },
    
    // Set up form submission and import/export
    setupFormSubmission() {
        const { form, submitBtn, copyPromptBtn } = this.domCache;
        const importBtn = DOMUtils.get('#import-btn');
        const exportBtn = DOMUtils.get('#export-btn');
        
        if (form) {
            DOMUtils.addListener(form, 'submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }
        
        if (copyPromptBtn) {
            DOMUtils.addListener(copyPromptBtn, 'click', () => {
                this.copyPromptToClipboard();
            });
        }
        
        // Set up export button
        if (exportBtn) {
            DOMUtils.addListener(exportBtn, 'click', () => {
                this.exportFormData();
            });
        }
        
        // Set up import button
        if (importBtn) {
            DOMUtils.addListener(importBtn, 'click', () => {
                this.importFormData();
            });
        }
    },
    
    // Export form data to JSON file
    exportFormData() {
        try {
            const formData = FormUtilities.collectFormData(this.domCache.form);
            const exportData = FormUtilities.formatForExport(formData);
            
            // Create a Blob with the JSON data
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `career-profile-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log('Form data exported successfully');
        } catch (error) {
            console.error('Error exporting form data:', error);
            alert('There was an error exporting your data. Please try again.');
        }
    },
    
    // Import form data from JSON file
    importFormData() {
        try {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'application/json';
            
            // Handle file selection
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        
                        // Reset form state
                        FormStateManager.reset();
                        
                        // Populate form with imported data
                        this.populateFormWithData(importedData);
                        
                        console.log('Form data imported successfully');
                        Toast.show('Your data has been imported successfully!', 'success');
                    } catch (parseError) {
                        console.error('Error parsing imported data:', parseError);
                        Toast.show('The selected file contains invalid data. Please try another file.', 'error');
                    }
                };
                
                reader.readAsText(file);
            });
            
            // Trigger file selection dialog
            fileInput.click();
        } catch (error) {
            console.error('Error importing form data:', error);
            Toast.show('There was an error importing your data. Please try again.', 'error');
        }
    },
    
    // Populate form with imported data
    populateFormWithData(data) {
        // Remove metadata if present
        if (data._metadata) {
            delete data._metadata;
        }
        
        // Get the mapping for string-to-value conversion for sliders
        const sliderValueMap = FormUtilities.getStringToValueMap();

        // Set form data in FormStateManager
        Object.entries(data).forEach(([key, value]) => {
            const inputs = document.querySelectorAll(`[name="${key}"]`);
            if (inputs.length > 0) {
                inputs.forEach(input => {
                    if (input.type === 'checkbox' || input.type === 'radio') {
                        if (Array.isArray(value)) {
                            input.checked = value.includes(input.value);
                        } else {
                            input.checked = (value === true || value === 'true' || value === input.value);
                        }
                    } else if (input.type === 'range') {
                        let numericValue = value;
                        // If the value is a string, try to map it to a number.
                        if (typeof value === 'string' && sliderValueMap[key] && sliderValueMap[key][value]) {
                            numericValue = sliderValueMap[key][value];
                        }
                        input.value = numericValue;
                        this.updateSliderBackground(input); // Use the centralized function
                    } else {
                        input.value = value;
                    }
                });
            }
        });
        
        // Handle dynamic lists
        this.populateDynamicLists(data);
        
        // Update form state
        FormStateManager.collectCurrentStepData();
        
        // Show first step
        this.showStep(0);
    },
    
    // Populate dynamic lists with imported data
    populateDynamicLists(data) {
        // Clear all simple dynamic lists
        ['passions', 'strengths', 'growthAreas', 'flowActivities', 'dealBreakers', 'hardSkills'].forEach(listName => {
            const listInstance = window.dynamicLists[listName];
            if (listInstance && listInstance.container) {
                // Clear the container and reset item count if applicable
                listInstance.container.innerHTML = '';
                if (typeof listInstance.itemCount !== 'undefined') {
                    listInstance.itemCount = 0;
                }
            }
        });

        // Helper to populate a list using its instance method
        const populateList = (listName, dataArray) => {
            if (dataArray && Array.isArray(dataArray) && window.dynamicLists[listName]) {
                dataArray.forEach(item => {
                    // The addItem method handles both simple strings and complex objects
                    window.dynamicLists[listName].addItem(item);
                });
            }
        };

        populateList('passions', data.passions);
        populateList('strengths', data.strengths);
        populateList('growthAreas', data.growthAreas);
        populateList('flowActivities', data.flowActivities);
        populateList('dealBreakers', data.drainsAndDealBreakers || data.dealBreakers); // Support legacy and new key
        populateList('hardSkills', data.hardSkills);

        // Handle scorecard data separately as it's not a standard dynamic list
        if (data.scorecard && Array.isArray(data.scorecard)) {
            const scorecardContainer = document.getElementById('scorecard-container');
            if (scorecardContainer) {
                scorecardContainer.innerHTML = ''; // Clear existing scorecard items
                data.scorecard.forEach(category => {
                    const item = document.createElement('div');
                    item.className = 'grid grid-cols-[2fr,1fr] gap-3 items-center mb-2';
                    item.innerHTML = `
                        <input type="text" name="scorecard-criteria-name" class="input-field" value="${category.name}" readonly style="background-color: #374151; color: #9ca3af; cursor: not-allowed; border: 1px solid #4b5563;">
                        <input type="number" name="scorecard-criteria-weight" class="input-field" placeholder="Weight %" min="0" max="100" value="${category.weight}">
                    `;
                    
                    // Add event listener to weight input for real-time calculation
                    const weightInput = item.querySelector('input[name="scorecard-criteria-weight"]');
                    if (weightInput) {
                        // The updateTotalWeight function is defined within initializeScorecard
                        // and is accessible via the App object's scorecard dynamic list.
                        // We need to find the function to call it.
                        const updateTotalWeight = App.dynamicLists.scorecard.updateTotalWeight;
                        if (updateTotalWeight) {
                            weightInput.addEventListener('input', updateTotalWeight);
                        }
                    }
                    scorecardContainer.appendChild(item);
                });

                // Update total weight after populating
                if (this.dynamicLists.scorecard && this.dynamicLists.scorecard.updateTotalWeight) {
                    this.dynamicLists.scorecard.updateTotalWeight();
                }
            }
        }
    },
    
    // Show specific step
    async showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.totalSteps) return;
        
        window.scrollTo(0, 0); // Scroll to top on step change

        // Load step if needed
        await ProgressiveLoader.loadStep(stepIndex);
        
        // Update current step
        const previousStep = this.currentStep;
        this.currentStep = stepIndex;
        
        // Update form state manager
        FormStateManager.setCurrentStep(stepIndex);
        
        // Update UI
        this.updateStepVisibility(stepIndex);
        this.updateStepIndicators(stepIndex);
        this.updateNavigationButtons(stepIndex);
        
        // Preload next step
        ProgressiveLoader.preloadNextStep(stepIndex);
    },
    
    // Update step visibility
    updateStepVisibility(activeStepIndex) {
        this.domCache.steps.forEach((step, index) => {
            step.classList.toggle('active', index === activeStepIndex);
        });
    },
    
    // Update step indicators
    updateStepIndicators(activeStepIndex) {
        this.domCache.stepIndicators.forEach((indicator, index) => {
            const isActive = index === activeStepIndex;
            const isCompleted = index < activeStepIndex;
            
            indicator.classList.toggle('active', isActive);
            indicator.classList.toggle('completed', isCompleted);
        });
        
        // Update progress bar
        const progressBar = document.getElementById('progress-bar-fill');
        const progressPercentage = document.getElementById('progress-percentage');
        
        if (progressBar && progressPercentage) {
            // Calculate progress percentage based on current step
            // For first step (index 0), show 0%
            // For second step (index 1), show 50%
            // For last step, show 100%
            let percentage;
            if (activeStepIndex === 0) {
                percentage = 0;
            } else if (activeStepIndex === 1) {
                percentage = 50;
            } else {
                percentage = (activeStepIndex / (this.totalSteps - 1)) * 100;
            }
            
            progressBar.style.width = `${percentage}%`;
            progressPercentage.textContent = `${Math.round(percentage)}%`;
        }
    },
    
    // Update navigation buttons
    updateNavigationButtons(stepIndex) {
        const { prevBtn, nextBtn, submitBtn } = this.domCache;
        
        if (prevBtn) {
            // Show but disable the back button on first page instead of hiding it
            if (stepIndex === 0) {
                prevBtn.style.display = 'block';
                prevBtn.disabled = true;
                prevBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                prevBtn.style.display = 'block';
                prevBtn.disabled = false;
                prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
        
        if (nextBtn && submitBtn) {
            const isLastStep = stepIndex === this.totalSteps - 1;
            nextBtn.style.display = isLastStep ? 'none' : 'block';
            submitBtn.style.display = isLastStep ? 'block' : 'none';
        }
    },
    
    // Validate current step
    validateCurrentStep() {
        return FormStateManager.validateCurrentStep();
    },
    
    // Check if user can navigate to specific step
    canNavigateToStep(stepIndex) {
        // Allow navigation to current step or previous steps
        if (stepIndex <= this.currentStep) return true;
        
        // For forward navigation, validate all steps up to target
        for (let i = 0; i < stepIndex; i++) {
            const stepData = FormStateManager.getFormData(i);
            const errors = FormStateManager.validateStepData(stepData, i);
            if (Object.keys(errors).length > 0) {
                return false;
            }
        }
        
        return true;
    },
    
    // Handle validation changes
    handleValidationChange(data) {
        // Update UI based on validation results
        const { step, errors, isValid } = data;
        
        // Update step indicator
        const indicator = this.domCache.stepIndicators[step];
        if (indicator) {
            indicator.classList.toggle('error', !isValid);
        }
        
        // Show/hide error messages
        this.displayValidationErrors(errors, step);
    },
    
    // Display validation errors
    displayValidationErrors(errors, stepIndex) {
        const stepElement = this.domCache.steps[stepIndex];
        if (!stepElement) return;
        
        // Clear existing error messages
        const existingErrors = stepElement.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
        
        // Display new errors
        Object.entries(errors).forEach(([field, message]) => {
            const fieldElement = stepElement.querySelector(`[name="${field}"]`);
            if (fieldElement) {
                const errorElement = DOMUtils.create('div', {
                    className: 'error-message text-red-500 text-sm mt-1'
                }, message);
                
                fieldElement.parentNode.appendChild(errorElement);
            }
        });
    },
    
    // Handle form submission
    async handleFormSubmission() {
        if (!FormStateManager.canSubmit()) {
            console.warn('Form is not ready for submission');
            return;
        }
        
        FormStateManager.setSubmitting(true);
        
        try {
            const formData = FormStateManager.getSubmissionData();
            await this.submitForm(formData);
        } catch (error) {
            console.error('Form submission failed:', error);
            alert('There was an error submitting your form. Please try again.');
        } finally {
            FormStateManager.setSubmitting(false);
        }
    },
    
    // Submit form data
    async submitForm(formData) {
        // Collect complete form data using FormUtilities
        const completeData = FormUtilities.collectFormData(this.domCache.form);
        
        // Validate the data
        const validationErrors = FormUtilities.validateFormData(completeData);
        if (Object.keys(validationErrors).length > 0) {
            console.error('Form validation failed:', validationErrors);
            alert('Please fix the form errors before submitting.');
            return;
        }
        
        // Generate career summary and prompt
        const summary = FormUtilities.generateSummary(completeData);
        const prompt = FormUtilities.generateLLMPrompt(completeData);
        
        // Display results
        this.displayResults(summary, prompt);
        
        // Export data for debugging/backup
        const exportData = FormUtilities.formatForExport(completeData);
        console.log('Form data exported:', exportData);
    },
    
    // Display results
    displayResults(summary, prompt) {
        const { outputContainer, summaryOutput, promptOutput } = this.domCache;
        
        if (summaryOutput) {
            summaryOutput.textContent = summary;
        }
        
        if (promptOutput) {
            promptOutput.textContent = prompt;

        }
        
        if (outputContainer) {
            outputContainer.style.display = 'block';
            outputContainer.scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    // Copy prompt to clipboard
    async copyPromptToClipboard() {
        const { promptOutput } = this.domCache;
        
        if (promptOutput) {
            try {
                await navigator.clipboard.writeText(promptOutput.textContent);
                Toast.show('Prompt copied to clipboard!', 'success');
            } catch (error) {
                console.error('Failed to copy prompt:', error);
                Toast.show('Failed to copy prompt. Please copy manually.', 'error');
            }
        }
    },
    
    // Handle submission state changes
    handleSubmissionStateChange(data) {
        const { submitBtn } = this.domCache;
        
        if (submitBtn) {
            submitBtn.disabled = data.isSubmitting;
            submitBtn.textContent = data.isSubmitting ? 'Submitting...' : 'Generate Career Profile';
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for debugging
window.App = App;
window.FormStateManager = FormStateManager;
window.DynamicListManager = DynamicListManager;