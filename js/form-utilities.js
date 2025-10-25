/*
 * Form Utilities Module
 * Handles form data collection, validation, and summary generation
 */

import { DOMUtils } from './dom-utils.js';
import { LLM_PROMPT } from './prompt.js';

export const FormUtilities = {
    sliderMappings: {
        'introvert-extrovert': ['Strongly Introvert', 'Introvert', 'Leans Introvert', 'Balanced', 'Leans Extrovert', 'Extrovert', 'Strongly Extrovert'],
        'detail-bigpicture': ['Strongly Detail-Oriented', 'Detail-Oriented', 'Leans Detail-Oriented', 'Balanced', 'Leans Big-Picture', 'Big-Picture', 'Strongly Big-Picture'],
        'analytical-creative': ['Strongly Analytical', 'Analytical', 'Leans Analytical', 'Balanced', 'Leans Creative', 'Creative', 'Strongly Creative'],
        'structured-flexible': ['Strongly Structured', 'Structured', 'Leans Structured', 'Balanced', 'Leans Flexible', 'Flexible', 'Strongly Flexible'],
        'independent-collaborative': ['Strongly Independent', 'Independent', 'Leans Independent', 'Balanced', 'Leans Collaborative', 'Collaborative', 'Strongly Collaborative']
    },

    // Create a map for converting slider string labels to numeric values for backward compatibility.
    getStringToValueMap() {
        const map = {};
        for (const sliderName in this.sliderMappings) {
            map[sliderName] = {};
            this.sliderMappings[sliderName].forEach((label, index) => {
                map[sliderName][label] = index + 1;
            });
        }
        return map;
    },

    // Collect all form data from the form
    collectFormData(form) {
        const data = {};
        const formData = new FormData(form);

        // Initialize arrays for keys that can have multiple values
        const multiValueKeys = ['work-setting', 'company-size', 'values'];
        multiValueKeys.forEach(key => {
            data[key] = [];
        });

        for (const [key, value] of formData.entries()) {
            if (multiValueKeys.includes(key)) {
                data[key].push(value);
            } else if (data[key]) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        // If a multi-value key has only one item, it will be in an array, which is what we want.
        // If it has no items, it will be an an empty array.
        // This handles the case where `data.values` might not be an array.
        
        // Handle Sliders
        const workPaceMap = { '1': 'Steady', '2': 'Balanced', '3': 'Fast-paced' };
        data['work-pace'] = workPaceMap[data['work-pace-slider']] || 'Balanced';

        // Slider values are collected as numeric (1-7) and kept that way.
        // Conversion to string labels happens only when needed for display.

        // Get problem-solving question answer
        const problemSolvingElement = DOMUtils.get('#problem-solving');
        if (problemSolvingElement) {
            data['problem-solving'] = problemSolvingElement.value;
        }
        
        // Optimized dynamic list collection with cached selectors
        const dynamicLists = {
            strengths: 'input[name="strength"]',
            growthAreas: 'input[name="growth-area"]',
            passions: 'input[name="passion"]',
            flowActivities: 'input[name="flow-activity"]',
            shortTermGoals: 'input[name^="short-term-goal-desc"]',
            longTermGoals: 'input[name^="long-term-goal-desc"]',
            lifestylePriorities: 'input[name^="lifestyle-priority-desc"]',
            drainsAndDealBreakers: 'input[name="deal-breaker"]'
        };
        
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
    },

    // Generate career summary from form data
    generateSummary(data) {
        let summary = '<div class="space-y-4">';
        
        // 1. Passions & Values
        if (data.values?.length) {
            summary += `<div><h4 class="font-bold">Core Values</h4><p>${data.values.join(', ')}</p></div>`;
        }
        if (data.passions?.length) {
            summary += `<div><h4 class="font-bold">Passions</h4><ul class="list-disc list-inside">${data.passions.map(p => `<li>${p}</li>`).join('')}</ul></div>`;
        }
        
        // 2. Personality & Work Style
        const introvertExtrovertValue = data['introvert-extrovert'];
        let energySource = 'N/A';
        if (introvertExtrovertValue) {
            const valueIndex = parseInt(introvertExtrovertValue, 10) - 1;
            const stringValue = this.sliderMappings['introvert-extrovert'][valueIndex] || '';
            energySource = stringValue.includes('Extrovert') ? 'others (extrovert)' : 'solitude (introvert)';
        }
        summary += `<div><h4 class="font-bold">Personality & Work Style</h4><p>A ${data['work-pace']} individual who draws energy from ${energySource}.</p></div>`;
        
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
    },

    // Generate LLM prompt from form data
    generateLLMPrompt(data) {
        let prompt = `${LLM_PROMPT}\n\n--- CAREER PROFILE ---\n\n`;

        const getSliderString = (sliderName) => {
            const value = data[sliderName];
            if (value) {
                const valueIndex = parseInt(value, 10) - 1;
                if (valueIndex >= 0 && valueIndex < this.sliderMappings[sliderName].length) {
                    return this.sliderMappings[sliderName][valueIndex];
                }
            }
            return 'N/A';
        };

        // 1. Passions, Interests & Values
        prompt += `**❤️ Passions, Interests & Values**\n`;
        if(data.passions?.length) prompt += `- Topics of Fascination: ${data.passions.join(', ')}\n`;
        if(data.flowActivities?.length) prompt += `- Flow Activities: ${data.flowActivities.join(', ')}\n`;
        if(data.problemSolving) prompt += `- Problem-Solving Drive: ${data.problemSolving}\n`;
        if (data.values?.length) prompt += `- Core Values: ${data.values.join(', ')}\n\n`;

        // 2. Personality & Work Style
        prompt += `**🧠 Personality & Work Style**\n`;
        
        // Display all 5 personality sliders with their 7-option scale values
        prompt += `- Energy Source: ${getSliderString('introvert-extrovert')} (1=Strongly Introvert, 7=Strongly Extrovert)\n`;
        prompt += `- Focus Style: ${getSliderString('detail-bigpicture')} (1=Strongly Detail-Oriented, 7=Strongly Big-Picture)\n`;
        prompt += `- Thinking Style: ${getSliderString('analytical-creative')} (1=Strongly Analytical, 7=Strongly Creative)\n`;
        prompt += `- Work Structure: ${getSliderString('structured-flexible')} (1=Strongly Structured, 7=Strongly Flexible)\n`;
        prompt += `- Collaboration Style: ${getSliderString('independent-collaborative')} (1=Strongly Independent, 7=Strongly Collaborative)\n`;
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
    },

    // Validate form data
    validateFormData(data) {
        const errors = {};
        
        // Only validate required fields on final submission
        if (document.querySelector('#submit-btn').style.display !== 'none') {
            // By default, no fields are strictly required for form submission.
            // Validation for specific fields can be added here if needed in the future.
            
            // Make hardSkills optional
            if (data.hardSkills && data.hardSkills.length > 0) {
                // Validate hard skills if they exist
                const invalidSkills = data.hardSkills.filter(skill => !skill.name || !skill.name.trim());
                if (invalidSkills.length > 0) {
                    errors.hardSkills = 'All hard skills must have a name';
                }
            }
        }
        
        return errors;
    },

    // Format data for JSON export
    formatForExport(data) {
        const exportData = { ...data };

        // For backward compatibility, duplicate 'problem-solving' to 'problemSolving'
        if (exportData['problem-solving']) {
            exportData.problemSolving = exportData['problem-solving'];
        }

        // Ensure keys from the old format are present, even if empty
        const legacyKeys = ['purpose', 'work-style', 'work-life-balance'];
        legacyKeys.forEach(key => {
            if (!(key in exportData)) {
                exportData[key] = '';
            }
        });

        // As of v0.0.21, slider values are exported as numeric values (1-7).
        // The import process can handle both legacy string values and new numeric values.
        return exportData;
    }
};