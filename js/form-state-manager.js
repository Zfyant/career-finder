/*
 * Form State Manager Module
 * Centralized state management for form data and validation
 */

import { DOMUtils } from './dom-utils.js';

export const FormStateManager = {
    // Current form state
    state: {
        currentStep: 0,
        formData: {},
        validationErrors: {},
        isSubmitting: false
    },
    
    // State change listeners
    listeners: {
        stepChange: [],
        dataChange: [],
        validationChange: [],
        submit: []
    },
    
    // Subscribe to state changes
    subscribe(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    },
    
    // Unsubscribe from state changes
    unsubscribe(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    },
    
    // Emit state change events
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    },
    
    // Update current step
    setCurrentStep(stepIndex) {
        const previousStep = this.state.currentStep;
        this.state.currentStep = stepIndex;
        this.emit('stepChange', { current: stepIndex, previous: previousStep });
    },
    
    // Get current step
    getCurrentStep() {
        return this.state.currentStep;
    },
    
    // Update form data
    updateFormData(stepData, stepIndex = null) {
        const targetStep = stepIndex !== null ? stepIndex : this.state.currentStep;
        
        if (!this.state.formData[targetStep]) {
            this.state.formData[targetStep] = {};
        }
        
        // Merge new data with existing step data
        Object.assign(this.state.formData[targetStep], stepData);
        
        this.emit('dataChange', { 
            step: targetStep, 
            data: stepData, 
            allData: this.state.formData 
        });
    },
    
    // Get form data for specific step or all steps
    getFormData(stepIndex = null) {
        if (stepIndex !== null) {
            return this.state.formData[stepIndex] || {};
        }
        return this.state.formData;
    },
    
    // Collect data from current step
    collectCurrentStepData() {
        const currentStepElement = DOMUtils.get(`.step[data-step="${this.state.currentStep}"]`);
        if (!currentStepElement) return {};
        
        const stepData = {};
        
        // Collect form inputs
        const inputs = currentStepElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const name = input.name;
            if (!name) return;
            
            if (input.type === 'checkbox' || input.type === 'radio') {
                if (input.checked) {
                    if (!stepData[name]) stepData[name] = [];
                    stepData[name].push(input.value);
                }
            } else {
                stepData[name] = input.value;
            }
        });
        
        // Collect dynamic list data
        if (window.dynamicLists) {
            Object.keys(window.dynamicLists).forEach(listKey => {
                const listInstance = window.dynamicLists[listKey];
                if (listInstance && typeof listInstance.getValues === 'function') {
                    const listContainer = listInstance.container;
                    if (currentStepElement.contains(listContainer)) {
                        stepData[listKey] = listInstance.getValues();
                    }
                }
            });
        }
        
        this.updateFormData(stepData);
        return stepData;
    },
    
    // Validate current step
    validateCurrentStep() {
        const stepData = this.collectCurrentStepData();
        const errors = this.validateStepData(stepData, this.state.currentStep);
        
        this.state.validationErrors[this.state.currentStep] = errors;
        this.emit('validationChange', { 
            step: this.state.currentStep, 
            errors, 
            isValid: Object.keys(errors).length === 0 
        });
        
        return Object.keys(errors).length === 0;
    },
    
    // Validate step data
    validateStepData(data, stepIndex) {
        const errors = {};
        
        switch (stepIndex) {
            case 0: // Passions, Interests & Values + Personality
                // Optional validation - allow progression without strict requirements
                // Users can fill these out as they go
                break;
                
            case 1: // Personality & Goals
                if (!data.strengths || data.strengths.length === 0) {
                    errors.strengths = 'At least one strength is required';
                }
                if (!data.passions || data.passions.length === 0) {
                    errors.passions = 'At least one passion is required';
                }
                break;
                
            case 2: // Work Environment
                if (!data['work-setting'] || data['work-setting'].length === 0) {
                    errors['work-setting'] = 'Please select at least one work setting preference';
                }
                break;
                
            case 3: // Skills
                if (!data.hardSkills || data.hardSkills.length === 0) {
                    errors.hardSkills = 'At least one hard skill is required';
                }
                break;
        }
        
        return errors;
    },
    
    // Check if form is ready for submission
    canSubmit() {
        // Validate all steps
        let allValid = true;
        const totalSteps = DOMUtils.getAll('.step').length;
        
        for (let i = 0; i < totalSteps; i++) {
            const stepData = this.getFormData(i);
            const errors = this.validateStepData(stepData, i);
            if (Object.keys(errors).length > 0) {
                allValid = false;
                break;
            }
        }
        
        return allValid && !this.state.isSubmitting;
    },
    
    // Set submission state
    setSubmitting(isSubmitting) {
        this.state.isSubmitting = isSubmitting;
        this.emit('submit', { isSubmitting });
    },
    
    // Get complete form data for submission
    getSubmissionData() {
        const allData = this.getFormData();
        const submissionData = {};
        
        // Flatten and format data for submission
        Object.keys(allData).forEach(stepIndex => {
            Object.assign(submissionData, allData[stepIndex]);
        });
        
        return submissionData;
    },
    
    // Reset form state
    reset() {
        this.state = {
            currentStep: 0,
            formData: {},
            validationErrors: {},
            isSubmitting: false
        };
        
        this.emit('stepChange', { current: 0, previous: null });
        this.emit('dataChange', { step: null, data: {}, allData: {} });
    },
    
    // Debug helper
    debug() {
        console.log('Form State:', {
            currentStep: this.state.currentStep,
            formData: this.state.formData,
            validationErrors: this.state.validationErrors,
            isSubmitting: this.state.isSubmitting,
            canSubmit: this.canSubmit()
        });
    }
};