/*
This script manages the multi-step career profile form, including navigation, 
dynamic fields for skills and goals, and form submission for generating a summary.
*/
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements for better performance
    const domCache = {
        themeSwitcher: document.getElementById('theme-switcher'),
        body: document.body,
        form: document.getElementById('career-profile-form'),
        steps: document.querySelectorAll('.form-step'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        submitBtn: document.getElementById('submit-btn'),
        stepIndicators: document.querySelectorAll('.step-nav-btn'),
        outputContainer: document.getElementById('output-container'),
        jsonOutput: document.getElementById('json-output'),
        summaryOutput: document.getElementById('summary-output'),
        promptOutput: document.getElementById('prompt-output'),
        copyPromptBtn: document.getElementById('copy-prompt-btn'),
        copyJsonBtn: document.getElementById('copy-json-btn')
    };
    
    const { themeSwitcher, body, form, steps, prevBtn, nextBtn, submitBtn, stepIndicators } = domCache;

    // Theme switcher logic
    if (themeSwitcher) {
        if (localStorage.getItem('theme') === 'dark') {
            body.classList.add('dark');
            themeSwitcher.checked = true;
        }

        themeSwitcher.addEventListener('change', () => {
            body.classList.toggle('dark', themeSwitcher.checked);
            localStorage.setItem('theme', themeSwitcher.checked ? 'dark' : 'light');
        });

        const importBtn = document.getElementById('import-btn');
        const exportBtn = document.getElementById('export-btn');

        importBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.readAsText(file, 'UTF-8');
                reader.onload = readerEvent => {
                    try {
                        const content = readerEvent.target.result;
                        const data = JSON.parse(content);
                        
                        // Import simple form fields
                        Object.keys(data).forEach(key => {
                            if (typeof data[key] === 'string' || typeof data[key] === 'number') {
                                const element = document.querySelector(`[name="${key}"]`);
                                if (element) {
                                    if (element.type === 'checkbox' || element.type === 'radio') {
                                        element.checked = data[key] === element.value;
                                    } else {
                                        element.value = data[key];
                                    }
                                }
                            }
                        });
                        
                        // Handle personality sliders - reverse the text mapping back to numeric values
                        const sliderMappings = {
                            'introvert-extrovert': ['Strongly Introvert', 'Introvert', 'Leans Introvert', 'Balanced', 'Leans Extrovert', 'Extrovert', 'Strongly Extrovert'],
                            'detail-bigpicture': ['Strongly Detail-Oriented', 'Detail-Oriented', 'Leans Detail-Oriented', 'Balanced', 'Leans Big-Picture', 'Big-Picture', 'Strongly Big-Picture'],
                            'analytical-creative': ['Strongly Analytical', 'Analytical', 'Leans Analytical', 'Balanced', 'Leans Creative', 'Creative', 'Strongly Creative'],
                            'structured-flexible': ['Strongly Structured', 'Structured', 'Leans Structured', 'Balanced', 'Leans Flexible', 'Flexible', 'Strongly Flexible'],
                            'independent-collaborative': ['Strongly Independent', 'Independent', 'Leans Independent', 'Balanced', 'Leans Collaborative', 'Collaborative', 'Strongly Collaborative']
                        };
                        
                        Object.keys(sliderMappings).forEach(sliderName => {
                            if (data[sliderName] && typeof data[sliderName] === 'string') {
                                const textValue = data[sliderName];
                                const numericValue = sliderMappings[sliderName].indexOf(textValue) + 1;
                                if (numericValue > 0) {
                                    const slider = document.getElementById(sliderName);
                                    if (slider) {
                                        slider.value = numericValue;
                                    }
                                }
                            }
                        });
                        
                        // Handle work pace slider
                        if (data['work-pace']) {
                            const workPaceMap = { 'Steady': '1', 'Balanced': '2', 'Fast-paced': '3' };
                            const workPaceSlider = document.getElementById('work-pace-slider');
                            if (workPaceSlider && workPaceMap[data['work-pace']]) {
                                workPaceSlider.value = workPaceMap[data['work-pace']];
                            }
                        }
                        
                        // Handle checkbox arrays (company-size, work-setting, values)
                        const checkboxArrays = ['company-size', 'work-setting', 'values'];
                        checkboxArrays.forEach(arrayName => {
                            if (data[arrayName]) {
                                // First uncheck all checkboxes for this group
                                document.querySelectorAll(`[name="${arrayName}"]`).forEach(checkbox => {
                                    checkbox.checked = false;
                                });
                                
                                // Handle both array and string values for backward compatibility
                                const values = Array.isArray(data[arrayName]) ? data[arrayName] : [data[arrayName]];
                                
                                // Then check the ones in the data
                                values.forEach(value => {
                                    const checkbox = document.querySelector(`[name="${arrayName}"][value="${value}"]`);
                                    if (checkbox) {
                                        checkbox.checked = true;
                                    }
                                });
                            }
                        });
                        
                        // Import dynamic lists
                        const dynamicListMappings = {
                            strengths: { container: 'strengths-container', button: 'add-strength-btn', namePrefix: 'strength-desc' },
                            growthAreas: { container: 'growth-container', button: 'add-growth-btn', namePrefix: 'growth-desc' },
                            passions: { container: 'passions-container', button: 'add-passion-btn', namePrefix: 'passion-desc' },
                            flowActivities: { container: 'flow-activities-container', button: 'add-flow-activity-btn', namePrefix: 'flow-activity-desc' },
                            shortTermGoals: { container: 'short-term-goals-container', button: 'add-short-term-goal-btn', namePrefix: 'short-term-goal-desc' },
                            longTermGoals: { container: 'long-term-goals-container', button: 'add-long-term-goal-btn', namePrefix: 'long-term-goal-desc' },
                            lifestylePriorities: { container: 'lifestyle-priorities-container', button: 'add-lifestyle-priority-btn', namePrefix: 'lifestyle-priority-desc' },
                            drainsAndDealBreakers: { container: 'deal-breakers-container', button: 'add-deal-breaker-btn', namePrefix: 'deal-breaker-desc' }
                        };
                        
                        Object.keys(dynamicListMappings).forEach(key => {
                            if (data[key] && Array.isArray(data[key])) {
                                const mapping = dynamicListMappings[key];
                                const container = document.getElementById(mapping.container);
                                if (container) {
                                    // Clear existing items
                                    container.innerHTML = '';
                                    // Add imported items
                                    data[key].forEach(item => {
                                        if (item.trim()) {
                                            addDynamicListItem(mapping.container, mapping.namePrefix, item);
                                        }
                                    });
                                }
                            }
                        });
                        
                        // Import hard skills
                        if (data.hardSkills && Array.isArray(data.hardSkills)) {
                            const list = document.getElementById('hard-skills-list');
                            if (list) {
                                list.innerHTML = '';
                                data.hardSkills.forEach(skill => {
                                    addHardSkillItem(skill.name, skill.proficiency, skill.interest);
                                });
                            }
                        }
                        
                        // Import scorecard criteria
                        if (data.scorecard && Array.isArray(data.scorecard)) {
                            const container = document.getElementById('scorecard-container');
                            if (container) {
                                container.innerHTML = '';
                                data.scorecard.forEach(criteria => {
                                    addScorecardRow(criteria.name, criteria.weight);
                                });
                                // Recalculate total weight after importing
                                updateTotalWeight();
                            }
                        }
                        
                        // Re-initialize hard skills functionality after import
                        setupHardSkillsList();
                        
                        alert('Profile imported successfully!');
                    } catch (error) {
                        alert('Error importing file: ' + error.message);
                    }
                }
            }
            input.click();
        });

        exportBtn.addEventListener('click', () => {
            const data = collectFormData();
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href",     dataStr);
            downloadAnchorNode.setAttribute("download", "career-profile.json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });

    // Copy functionality - optimized with cached elements
    const { copyPromptBtn, copyJsonBtn, promptOutput, jsonOutput } = domCache;

    // Utility function for copy operations
    function setupCopyButton(button, getTextFn) {
        if (!button) return;
        button.addEventListener('click', async () => {
            try {
                const text = getTextFn();
                await navigator.clipboard.writeText(text);
                
                // Show success feedback
                const originalSvg = button.innerHTML;
                button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>';
                button.classList.add('bg-green-100');
                button.classList.add('dark:bg-green-800');
                button.classList.add('dark:bg-opacity-30');
                
                // Reset after 2 seconds
                setTimeout(() => {
                    button.innerHTML = originalSvg;
                    button.classList.remove('bg-green-100');
                    button.classList.remove('dark:bg-green-800');
                    button.classList.remove('dark:bg-opacity-30');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text:', err);
                alert('Failed to copy text. Please try again.');
            }
        });
    }

    setupCopyButton(copyPromptBtn, () => promptOutput?.value || '');
    setupCopyButton(copyJsonBtn, () => jsonOutput?.textContent || '');

    // Form navigation logic - optimized and consolidated
    if (!form) return;
    
    let currentStep = 0;
    const totalSteps = steps.length;
    
    // Optimized step navigation with batched DOM updates
    function showStep(stepIndex) {
        requestAnimationFrame(() => {
            steps.forEach((step, index) => {
                // Toggle active class instead of hidden
                step.classList.toggle('active', index === stepIndex);
                step.classList.toggle('hidden', index !== stepIndex);
            });
            
            stepIndicators.forEach((indicator) => {
                const indicatorStep = parseInt(indicator.getAttribute('data-step')) - 1;
                indicator.classList.toggle('active', indicatorStep === stepIndex);
            });
            
            // Update navigation buttons
            if (prevBtn) prevBtn.disabled = stepIndex === 0;
            if (nextBtn) nextBtn.classList.toggle('hidden', stepIndex === totalSteps - 1); // Show next button except on last step
            if (submitBtn) submitBtn.classList.toggle('hidden', stepIndex !== totalSteps - 1); // Show submit button only on last step

            // Scroll to the top of the page for better UX
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    function nextStep() {
        if (currentStep < totalSteps - 1) {
            currentStep++;
            showStep(currentStep);
        }
    }
    
    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    }
    
    // Event listeners for navigation
    nextBtn?.addEventListener('click', nextStep);
    prevBtn?.addEventListener('click', prevStep);
    
    // Step navigation button listeners (using stepIndicators)
    stepIndicators.forEach((btn) => {
        btn.addEventListener('click', () => {
            // Get the step index from data-step attribute (convert from 1-based to 0-based)
            const stepIndex = parseInt(btn.getAttribute('data-step')) - 1;
            if (stepIndex >= 0 && stepIndex < totalSteps) {
                currentStep = stepIndex;
                showStep(currentStep);
            }
        });
    });
    
    // Initialize all steps with proper classes
    steps.forEach((step, index) => {
        if (index !== currentStep) {
            step.classList.add('hidden');
            step.classList.remove('active');
        } else {
            step.classList.remove('hidden');
            step.classList.add('active');
        }
    });
    
    // Initialize step indicators
    stepIndicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentStep);
    });
    
    // Initialize navigation buttons
    if (prevBtn) prevBtn.disabled = currentStep === 0;
    if (nextBtn) nextBtn.classList.toggle('hidden', currentStep === totalSteps - 1); // Show next button except on last step
    if (submitBtn) submitBtn.classList.toggle('hidden', currentStep !== totalSteps - 1); // Show submit button only on last step

    // Auto-resize textarea function
    function autoResizeTextarea(textarea) {
        if (textarea && textarea.value) {
            // Reset height to auto to get the correct scrollHeight
            textarea.style.height = 'auto';
            // Set height to scrollHeight plus some padding to avoid scrollbars
            const newHeight = Math.max(200, textarea.scrollHeight + 10);
            textarea.style.height = newHeight + 'px';
        }
    }
    
    // Set up auto-resize for prompt output textarea
    const promptTextarea = document.getElementById('prompt-output');
    if (promptTextarea) {
        // Auto-resize when content changes
        const observer = new MutationObserver(() => {
            setTimeout(() => autoResizeTextarea(promptTextarea), 0);
        });
        observer.observe(promptTextarea, { 
            attributes: true, 
            attributeFilter: ['value'],
            childList: true, 
            subtree: true, 
            characterData: true 
        });
        
        // Also listen for input events
        promptTextarea.addEventListener('input', () => {
            autoResizeTextarea(promptTextarea);
        });
        
        // Listen for when the value property changes
        let lastValue = promptTextarea.value;
        setInterval(() => {
            if (promptTextarea.value !== lastValue) {
                lastValue = promptTextarea.value;
                autoResizeTextarea(promptTextarea);
            }
        }, 100);
        
        // Initial resize
        setTimeout(() => autoResizeTextarea(promptTextarea), 100);
    }
    
    // --- Initializers for each section ---

    function addHardSkillItem(skillName = '', proficiency = '3', interest = '3') {
        const list = document.getElementById('hard-skills-list');
        if (!list) return;
        
        const item = document.createElement('div');
        item.className = 'grid grid-cols-1 md:grid-cols-3 gap-2 items-center';
        
        item.innerHTML = `
            <div>
                <label class="block text-sm font-medium mb-1">Skill</label>
                <input type="text" name="hard-skill-name" class="input-field" value="${skillName}" placeholder="e.g., JavaScript, SQL, Figma">
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Proficiency</label>
                <select name="hard-skill-proficiency" class="input-field">
                    <option value="1" ${proficiency === '1' ? 'selected' : ''}>1 - Novice</option>
                    <option value="2" ${proficiency === '2' ? 'selected' : ''}>2 - Beginner</option>
                    <option value="3" ${proficiency === '3' ? 'selected' : ''}>3 - Competent</option>
                    <option value="4" ${proficiency === '4' ? 'selected' : ''}>4 - Proficient</option>
                    <option value="5" ${proficiency === '5' ? 'selected' : ''}>5 - Expert</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Interest Level</label>
                <select name="hard-skill-interest" class="input-field">
                    <option value="1" ${interest === '1' ? 'selected' : ''}>1 - Low</option>
                    <option value="2" ${interest === '2' ? 'selected' : ''}>2 - Medium-Low</option>
                    <option value="3" ${interest === '3' ? 'selected' : ''}>3 - Medium</option>
                    <option value="4" ${interest === '4' ? 'selected' : ''}>4 - High</option>
                    <option value="5" ${interest === '5' ? 'selected' : ''}>5 - Very High</option>
                </select>
            </div>
            <button type="button" class="remove-btn text-red-500 hover:text-red-700 text-sm">Remove</button>
        `;
        
        // Add remove functionality
        const removeBtn = item.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            item.remove();
        });
        
        list.appendChild(item);
    }

    function setupHardSkillsList() {
        const container = document.getElementById('hard-skills-container');
        const list = document.getElementById('hard-skills-list');
        const addBtn = document.getElementById('add-hard-skill-btn');
        
        if (!container || !list || !addBtn) return;
        
        // Remove existing event listeners to prevent duplicates
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        
        newAddBtn.addEventListener('click', () => addHardSkillItem());
        
        // Add initial item if list is empty
        if (list.children.length === 0) {
            addHardSkillItem();
        }
    }

    function initPersonality() {
        setupDynamicList('strengths-container', 'add-strength-btn', 'strength-desc', 'e.g., Creative problem-solving', ['']);
        setupDynamicList('growth-container', 'add-growth-btn', 'growth-desc', 'e.g., Public speaking', ['']);
        setupHardSkillsList();
    }

    function initPassionsAndGoals() {
        setupDynamicList('passions-container', 'add-passion-btn', 'passion-desc', 'e.g., Building AI applications', ['']);
        setupDynamicList('flow-activities-container', 'add-flow-activity-btn', 'flow-activity-desc', 'e.g., Solving complex puzzles', ['']);
    }

    function initPreferences() {
        setupDynamicList('deal-breakers-container', 'add-deal-breaker-btn', 'deal-breaker-desc', 'e.g., Micromanagement, endless meetings, high turnover', ['']);
    }

    // Global function to update total weight - accessible by import functionality
    function updateTotalWeight() {
        const scorecardContainer = document.getElementById('scorecard-container');
        const totalWeightEl = document.getElementById('total-weight');
        
        if (!scorecardContainer) return;
        let totalWeight = 0;
        const weights = scorecardContainer.querySelectorAll('input[type="number"]');
        weights.forEach(w => {
            totalWeight += parseInt(w.value) || 0;
        });

        if (totalWeightEl) {
            totalWeightEl.textContent = `${totalWeight}%`;
            // Highlight red if total is over 100, or if it's not 100 and not 0.
            const isInvalid = totalWeight > 100 || (totalWeight !== 100 && totalWeight > 0);
            totalWeightEl.classList.toggle('text-red-500', isInvalid);
        }

        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            const isInvalid = totalWeight > 100 || (totalWeight > 0 && totalWeight !== 100);
            submitBtn.disabled = isInvalid;
        }
    }

    function initScorecard() {
        const scorecardContainer = document.getElementById('scorecard-container');
        const addCriteriaBtn = document.getElementById('add-criteria-btn');
        const totalWeightEl = document.getElementById('total-weight');
        let criteriaCount = 0;

        function addCriteriaRow(name = '', weight = 0) {
            if (!scorecardContainer) return;
            criteriaCount++;
            const criteriaRow = document.createElement('div');
            criteriaRow.className = 'grid grid-cols-[1fr,120px] gap-3 items-center';

            criteriaRow.innerHTML = `
                <input type="text" name="scorecard-criteria-name-${criteriaCount}" class="input-field" value="${name}" readonly tabindex="-1">
                <input type="number" name="scorecard-criteria-weight-${criteriaCount}" class="input-field text-center" value="${weight}" min="0" max="100" step="5">
            `;
            scorecardContainer.appendChild(criteriaRow);
            criteriaRow.querySelector('input[type="number"]').addEventListener('input', updateTotalWeight);
        }

        const defaultCriteria = [
            { name: 'Compensation & Benefits', weight: 0 },
            { name: 'Work-Life Balance', weight: 0 },
            { name: 'Career Growth & Learning', weight: 0 },
            { name: 'Impact & Meaning', weight: 0 },
            { name: 'Company Culture & Values', weight: 0 },
            { name: 'Autonomy & Ownership', weight: 0 },
            { name: 'Technology Stack', weight: 0 },
        ];

        if (scorecardContainer && scorecardContainer.children.length === 0) {
            defaultCriteria.forEach(criteria => {
                addCriteriaRow(criteria.name, criteria.weight);
            });
        }

        // Add criteria functionality removed

        updateTotalWeight();
    }

    // Combined and simplified initializers
    function initializeAllSections() {
        initPersonality();
        initPassionsAndGoals();
        initPreferences();
        initScorecard();
    }

    // Initial load of dynamic content
    initializeAllSections();

    function setupDynamicList(containerId, addButtonId, inputName, placeholder, initialItems = []) {
        const container = document.getElementById(containerId);
        const addButton = document.getElementById(addButtonId);
        if (!container || !addButton) return;

        let itemCount = 0;

        function addRow(description = '') {
            itemCount++;
            const row = document.createElement('div');
            row.className = 'grid grid-cols-[1fr,auto] gap-3 items-center mb-2';
            row.innerHTML = `
                <input type="text" name="${inputName}-${itemCount}" class="input-field" placeholder="${placeholder}" value="${description}">
                <button type="button" class="remove-row-btn text-red-500 hover:text-red-700 font-medium">Remove</button>
            `;
            container.appendChild(row);

            row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
        }

        addButton.addEventListener('click', () => addRow());

        // Add initial rows only if container is empty
        if (!container.hasChildNodes()) {
            initialItems.forEach(item => addRow(item));
        }
    }

    // Helper functions for import functionality
    function addDynamicListItem(containerId, namePrefix, value) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const itemCount = container.children.length + 1;
        const row = document.createElement('div');
        row.className = 'grid grid-cols-[1fr,auto] gap-3 items-center mb-2';
        row.innerHTML = `
            <input type="text" name="${namePrefix}-${itemCount}" class="input-field" value="${value}">
            <button type="button" class="remove-row-btn text-red-500 hover:text-red-700 font-medium">Remove</button>
        `;
        container.appendChild(row);
        
        row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
    }
    
    function addHardSkillRow(name = '', proficiency = '', interest = '') {
        const container = document.getElementById('hard-skills-container');
        if (!container) return;
        
        const itemCount = container.children.length + 1;
        const row = document.createElement('div');
        row.className = 'grid grid-cols-[2fr,1fr,1fr,auto] gap-3 items-center mb-2';
        row.innerHTML = `
            <input type="text" name="hard-skill-name-${itemCount}" class="input-field" placeholder="e.g., Python, Excel, Photoshop" value="${name}">
            <select name="hard-skill-proficiency-${itemCount}" class="input-field">
                <option value="">Proficiency</option>
                <option value="1" ${proficiency === '1' ? 'selected' : ''}>1 - Beginner</option>
                <option value="2" ${proficiency === '2' ? 'selected' : ''}>2 - Basic</option>
                <option value="3" ${proficiency === '3' ? 'selected' : ''}>3 - Intermediate</option>
                <option value="4" ${proficiency === '4' ? 'selected' : ''}>4 - Advanced</option>
                <option value="5" ${proficiency === '5' ? 'selected' : ''}>5 - Expert</option>
            </select>
            <select name="hard-skill-interest-${itemCount}" class="input-field">
                <option value="">Interest</option>
                <option value="1" ${interest === '1' ? 'selected' : ''}>1 - Low</option>
                <option value="2" ${interest === '2' ? 'selected' : ''}>2 - Moderate</option>
                <option value="3" ${interest === '3' ? 'selected' : ''}>3 - Good</option>
                <option value="4" ${interest === '4' ? 'selected' : ''}>4 - High</option>
                <option value="5" ${interest === '5' ? 'selected' : ''}>5 - Very High</option>
            </select>
            <button type="button" class="remove-row-btn text-red-500 hover:text-red-700 font-medium">Remove</button>
        `;
        container.appendChild(row);
        
        row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
    }
    
    function addScorecardRow(name = '', weight = '') {
        const container = document.getElementById('scorecard-container');
        if (!container) return;
        
        const itemCount = container.children.length + 1;
        const row = document.createElement('div');
        row.className = 'grid grid-cols-[2fr,1fr] gap-3 items-center mb-2';
        row.innerHTML = `
            <input type="text" name="scorecard-criteria-name-${itemCount}" class="input-field" placeholder="e.g., Work-Life Balance" value="${name}" tabindex="-1">
            <input type="number" name="scorecard-criteria-weight-${itemCount}" class="input-field" placeholder="Weight %" min="0" max="100" value="${weight}">
        `;
        container.appendChild(row);
        
        row.querySelector('input[type="number"]').addEventListener('input', updateTotalWeight);
    }

    // Optimized form submission logic with cached elements
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Add loading state for better UX
        const originalSubmitText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Generating Profile...';
        }
        
        try {
            // Validate form before processing
            const validationResult = validateForm();
            if (!validationResult.isValid) {
                showValidationErrors(validationResult.errors);
                return;
            }
            
            // Optimized data collection with single pass
            const data = collectFormData();
            const promptText = generateLLMPrompt(data);
            
            // Batch DOM updates for better performance
             requestAnimationFrame(() => {
                 const { outputContainer, jsonOutput, promptOutput } = domCache;
                 if (promptOutput) promptOutput.textContent = promptText;
                 if (jsonOutput) jsonOutput.textContent = JSON.stringify(data, null, 2);
                 
                 if (outputContainer) {
                     outputContainer.classList.remove('hidden');
                     outputContainer.scrollIntoView({ behavior: 'smooth' });
                 }
             });
        } catch (error) {
            console.error('Form submission error:', error);
            alert('An error occurred while generating your profile. Please try again.');
        } finally {
            // Reset submit button
            if (submitBtn && originalSubmitText) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalSubmitText;
            }
        }
    });
    
    // Form validation function
    function validateForm() {
        const errors = [];
        
        // Check required fields
        const requiredFields = [];
        
        requiredFields.forEach(field => {
            const element = form.querySelector(field.selector);
            if (!element || !element.value.trim()) {
                errors.push(`${field.name} is required`);
            }
        });
        

        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    // Show validation errors to user
    function showValidationErrors(errors) {
        const errorMessage = 'Please complete the following required fields:\n\n' + errors.join('\n');
        alert(errorMessage);
    }
    
    // Optimized form data collection function
    function collectFormData() {
        const formData = new FormData(form);
        const data = {};

        // Define checkbox arrays that should be collected as arrays
        const checkboxFields = ['company-size', 'work-setting', 'values'];
        
        // Process simple fields efficiently, excluding dynamic list items and hard skill individual fields
        for (const [key, value] of formData.entries()) {
            if (!key.includes('-desc-') && !key.includes('-name-') && !key.includes('-weight-') && 
                !key.includes('-proficiency-') && !key.includes('-interest-')) {
                
                // Handle checkbox arrays specially
                if (checkboxFields.includes(key)) {
                    if (!data[key]) {
                        data[key] = [];
                    }
                    data[key].push(value);
                } else {
                    // Handle other fields
                    if (data[key]) {
                        if (!Array.isArray(data[key])) {
                            data[key] = [data[key]];
                        }
                        data[key].push(value);
                    } else {
                        data[key] = value;
                    }
                }
            }
        }
        
        // Handle Sliders
        const workPaceMap = { '1': 'Steady', '2': 'Balanced', '3': 'Fast-paced' };
        data['work-pace'] = workPaceMap[data['work-pace-slider']] || 'Balanced';

        const sliderMappings = {
            'introvert-extrovert': ['Strongly Introvert', 'Introvert', 'Leans Introvert', 'Balanced', 'Leans Extrovert', 'Extrovert', 'Strongly Extrovert'],
            'detail-bigpicture': ['Strongly Detail-Oriented', 'Detail-Oriented', 'Leans Detail-Oriented', 'Balanced', 'Leans Big-Picture', 'Big-Picture', 'Strongly Big-Picture'],
            'analytical-creative': ['Strongly Analytical', 'Analytical', 'Leans Analytical', 'Balanced', 'Leans Creative', 'Creative', 'Strongly Creative'],
            'structured-flexible': ['Strongly Structured', 'Structured', 'Leans Structured', 'Balanced', 'Leans Flexible', 'Flexible', 'Strongly Flexible'],
            'independent-collaborative': ['Strongly Independent', 'Independent', 'Leans Independent', 'Balanced', 'Leans Collaborative', 'Collaborative', 'Strongly Collaborative']
        };

        for (const sliderName in sliderMappings) {
            if (data[sliderName]) {
                const valueIndex = parseInt(data[sliderName], 10) - 1;
                if (valueIndex >= 0 && valueIndex < sliderMappings[sliderName].length) {
                    data[sliderName] = sliderMappings[sliderName][valueIndex];
                } else {
                    data[sliderName] = 'Balanced'; // Default
                }
            }
        }

        // Get problem-solving question answer
        data.problemSolving = document.getElementById('problem-solving').value;
        
        // Optimized dynamic list collection with cached selectors
        const dynamicLists = {
            strengths: 'input[name^="strength-desc"]',
            growthAreas: 'input[name^="growth-desc"]',
            passions: 'input[name^="passion-desc"]',
            flowActivities: 'input[name^="flow-activity-desc"]',
            shortTermGoals: 'input[name^="short-term-goal-desc"]',
            longTermGoals: 'input[name^="long-term-goal-desc"]',
            lifestylePriorities: 'input[name^="lifestyle-priority-desc"]',
            drainsAndDealBreakers: 'input[name^="deal-breaker-desc"]'
        }
        
        // Collect all dynamic lists efficiently
        Object.entries(dynamicLists).forEach(([key, selector]) => {
            data[key] = Array.from(form.querySelectorAll(selector))
                .map(input => input.value.trim())
                .filter(Boolean);
        });

        // Dynamic Hard Skills - optimized collection
        data.hardSkills = Array.from(form.querySelectorAll('#hard-skills-container .grid'))
            .map(row => {
                const name = row.querySelector('input[name^="hard-skill-name"]')?.value?.trim();
                const proficiency = row.querySelector('select[name^="hard-skill-proficiency"]')?.value;
                const interest = row.querySelector('select[name^="hard-skill-interest"]')?.value;
                return name ? { name, proficiency, interest } : null;
            })
            .filter(Boolean);
        
        // Dynamic Scorecard Criteria - optimized collection
        data.scorecard = Array.from(form.querySelectorAll('#scorecard-container .grid'))
            .map(row => {
                const name = row.querySelector('input[name^="scorecard-criteria-name"]')?.value?.trim();
                const weight = row.querySelector('input[name^="scorecard-criteria-weight"]')?.value;
                return (name && weight) ? { name, weight } : null;
            })
            .filter(Boolean);

        // Clean up redundant hard skill fields that are now properly structured in hardSkills array
        delete data['hard-skill-name'];
        delete data['hard-skill-proficiency'];
        delete data['hard-skill-interest'];

        return data;
    }

    function generateSummary(data) {
        let summary = '<div class="space-y-4">';
        
        // 1. Passions & Values
        if (data.values?.length) {
            summary += `<div><h4 class="font-bold">Core Values</h4><p>${data.values.join(', ')}</p></div>`;
        }
        if (data.passions?.length) {
            summary += `<div><h4 class="font-bold">Passions</h4><ul class="list-disc list-inside">${data.passions.map(p => `<li>${p}</li>`).join('')}</ul></div>`;
        }
        
        // 2. Personality & Work Style
        summary += `<div><h4 class="font-bold">Personality & Work Style</h4><p>A ${data['work-pace']} individual who draws energy from ${data['introvert-extrovert'] ? (data['introvert-extrovert'].includes('Extrovert') ? 'others (extrovert)' : 'solitude (introvert)') : 'N/A'}.</p></div>`;
        
        // 3. Skills & Abilities
        if (data.strengths?.length) {
            summary += `<div><h4 class="font-bold">Key Strengths</h4><ul class="list-disc list-inside">${data.strengths.map(s => `<li>${s}</li>`).join('')}</ul></div>`;
        }
        if (data.hardSkills?.length) {
            summary += `<div><h4 class="font-bold">Hard Skills</h4><ul class="list-disc list-inside">${data.hardSkills.map(s => `<li>${s.name} (Proficiency: ${s.proficiency}/5, Interest: ${s.interest}/5)</li>`).join('')}</ul></div>`;
        }
        
        // 4. Work Environment & Compensation
        if (data['work-setting']?.length) {
            summary += `<div><h4 class="font-bold">Ideal Work Environment</h4><p>Prefers ${Array.isArray(data['work-setting']) ? data['work-setting'].join(', ') : data['work-setting']} work arrangement.</p></div>`;
        }
        if (data['salary-min']) {
            summary += `<div><h4 class="font-bold">Compensation</h4><p>Target annual salary: $${data['salary-min']}</p></div>`;
        }
        
        // 5. Accomplishments
        if (data.accomplishments) {
            summary += `<div><h4 class="font-bold">Key Accomplishments</h4><p>${data.accomplishments}</p></div>`;
        }
        
        summary += '</div>';
        return summary;
    }

    function generateLLMPrompt(data) {
        let prompt = `Based on the following comprehensive career profile, please act as a career matchmaking expert. Analyze the data and provide three distinct, actionable job recommendations. For each recommendation, include the job title, a brief explanation of why it's a good fit, and the key strengths from the profile that align with the role.\n\n--- CAREER PROFILE ---\n\n`;

        // 1. Passions, Interests & Values
        prompt += `**❤️ Passions, Interests & Values**\n`;
        if(data.passions?.length) prompt += `- Topics of Fascination: ${data.passions.join(', ')}\n`;
        if(data.flowActivities?.length) prompt += `- Flow Activities: ${data.flowActivities.join(', ')}\n`;
        if(data.problemSolving) prompt += `- Problem-Solving Drive: ${data.problemSolving}\n`;
        if (data.values?.length) prompt += `- Core Values: ${data.values.join(', ')}\n\n`;

        // 2. Personality & Work Style
        prompt += `**🧠 Personality & Work Style**\n`;
        // Convert introvert-extrovert text value to numeric for energy source display
        let energyValue = 'N/A';
        if (data['introvert-extrovert']) {
            const energyMap = {
                'Strongly Introvert': '1 (Strongly Introvert)',
                'Introvert': '20 (Introvert)', 
                'Leans Introvert': '35 (Leans Introvert)',
                'Balanced': '50 (Balanced)',
                'Leans Extrovert': '65 (Leans Extrovert)',
                'Extrovert': '80 (Extrovert)',
                'Strongly Extrovert': '100 (Strongly Extrovert)'
            };
            energyValue = energyMap[data['introvert-extrovert']] || data['introvert-extrovert'];
        }
        prompt += `- Energy Source (1=Introvert, 100=Extrovert): ${energyValue}\n`;
        prompt += `- Preferred Work Pace: ${data['work-pace']}\n\n`;

        // 3. Skills & Abilities
        prompt += `**🛠️ Skills & Abilities**\n`;
        if (data.strengths?.length) prompt += `- Core Strengths: ${data.strengths.join(', ')}\n`;
        if (data.growthAreas?.length) prompt += `- Areas for Growth: ${data.growthAreas.join(', ')}\n`;
        if (data.hardSkills?.length) {
            prompt += `- Hard Skills:\n${data.hardSkills.map(s => `  - ${s.name} (Proficiency: ${s.proficiency}/5, Interest: ${s.interest}/5)`).join('\n')}\n`;
        }
        prompt += `- Soft Skills (Rated 1-5):\n`;
        prompt += `  - Leadership: ${data['soft-leadership']}\n`;
        prompt += `  - Communication: ${data['soft-communication']}\n`;
        prompt += `  - Empathy: ${data['soft-empathy']}\n`;
        prompt += `  - Public Speaking: ${data['soft-public-speaking']}\n\n`;

        // 4. Work Environment & Preferences
        prompt += `**🏢 Work Environment & Preferences**\n`;
        if (data['work-setting']?.length) {
            prompt += `- Work Setting: ${Array.isArray(data['work-setting']) ? data['work-setting'].join(', ') : data['work-setting']}\n`;
        }
        if (data['company-size']?.length) {
            prompt += `- Company Size: ${Array.isArray(data['company-size']) ? data['company-size'].join(', ') : data['company-size']}\n`;
        }
        prompt += `- Target Annual Salary: $${data['salary-min'] || 'N/A'}\n`;
        if(data.location) prompt += `- Geographic Preferences: ${data.location}\n\n`;

        // 5. Accomplishments
        prompt += `**🏆 Proud Accomplishments**\n`;
        if(data.accomplishments) prompt += `${data.accomplishments}\n\n`;

        // 6. Drains & Deal-Breakers
        prompt += `**🚫 Drains & Deal-Breakers**\n`;
        if (data.drainsAndDealBreakers?.length) prompt += `- Workplace Drains & Deal-Breakers: ${data.drainsAndDealBreakers.join(', ')}\n\n`;

        // 7. Job Scorecard
        if (data.scorecard?.length) {
            prompt += `**📊 Job Scorecard (Weights %)**\n`;
            prompt += `${data.scorecard.map(c => `- ${c.name}: ${c.weight || 0}%`).join('\n')}\n\n`;
        }

        prompt += `\n--- END OF PROFILE ---`;
        return prompt;
    }

    }
}); // End of DOMContentLoaded event listener