/* ==========================================================================
   Jeyar Brightech Solar Systems JavaScript
   Contains: Theme switching, mobile menu drawer, stat counters,
   interactive solar savings calculator, accordion toggle,
   fade-in reveals, and toast message notification system.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* --- Theme Toggle System --- */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    if (themeToggleBtn) {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme') || 
                           (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        
        // Apply theme
        htmlElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });

        function updateThemeIcon(theme) {
            const icon = themeToggleBtn.querySelector('i');
            if (icon) {
                if (theme === 'light') {
                    icon.className = 'fa-solid fa-sun';
                } else {
                    icon.className = 'fa-solid fa-moon';
                }
            }
        }
    }


    /* --- Sticky Header Scrolling --- */
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }


    /* --- Mobile Navigation Drawer --- */
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking nav links or scroll
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
                
                // Update active link state manually on click
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }


    /* --- Stat Counters Animation --- */
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length > 0 && typeof IntersectionObserver !== 'undefined') {
        const statsObserverOptions = {
            threshold: 0.5,
            rootMargin: "0px 0px -50px 0px"
        };

        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const endValue = parseInt(target.getAttribute('data-target'), 10);
                    animateCounter(target, endValue);
                    observer.unobserve(target); // Only animate once
                }
            });
        }, statsObserverOptions);

        stats.forEach(stat => statsObserver.observe(stat));
    }

    function animateCounter(element, targetValue) {
        let startValue = 0;
        const duration = 2000; // 2 seconds
        const startTime = performance.now();

        function updateCount(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Ease-out quad formula
            const easeProgress = progress * (2 - progress);
            const currentValue = Math.floor(easeProgress * targetValue);
            
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = targetValue;
            }
        }

        requestAnimationFrame(updateCount);
    }


    /* --- Interactive Solar Calculator --- */
    const monthlyBillInput = document.getElementById('monthly-bill');
    if (monthlyBillInput) {
        const billDisplay = document.getElementById('bill-display');
        const exposureSelect = document.getElementById('solar-exposure');
        const systemSizeEl = document.getElementById('res-system-size');
        const generationEl = document.getElementById('res-consumption');
        const savingsEl = document.getElementById('res-monthly-savings');
        const bimonthlySavingsEl = document.getElementById('res-bimonthly-savings');
        const roofSpaceEl = document.getElementById('res-roof-space');
        const paybackEl = document.getElementById('res-payback');
        const treesEl = document.getElementById('res-trees');
        const co2El = document.getElementById('res-co2');
        const billLabelEl = document.getElementById('bill-label');
        const savingsLabelEl = document.getElementById('savings-label');

        const cycleBtns = document.querySelectorAll('.cycle-btn');
        let billingCycle = 'bimonthly'; // default is bimonthly in KSEB domestic

        // Scoped calculator results for lock-quote message
        let currentSystemSize = '';
        let currentGeneration = '';
        let currentSavings = '';
        let currentPayback = '';

        cycleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                cycleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                billingCycle = btn.getAttribute('data-cycle');
                calculateSolarPotential();
            });
        });

        // Add event listeners for slider input
        monthlyBillInput.addEventListener('input', (e) => {
            const billValue = parseInt(e.target.value, 10);
            if (billDisplay) billDisplay.textContent = `₹${billValue}`;
            calculateSolarPotential();
        });

        if (exposureSelect) {
            exposureSelect.addEventListener('change', calculateSolarPotential);
        }

        const lockQuoteBtn = document.getElementById('lock-quote-btn');
        if (lockQuoteBtn) {
            lockQuoteBtn.addEventListener('click', () => {
                const billValue = monthlyBillInput.value;
                const activeCycle = billingCycle === 'bimonthly' ? 'Bi-monthly' : 'Monthly';

                const textMessage = `Hi Jeyar Brightech, I would like to lock in a solar quote based on my calculator details:\n\n` +
                                    `- Current ${activeCycle} Bill: ₹${parseInt(billValue)}\n` +
                                    `- Recommended System: ${currentSystemSize}\n` +
                                    `- Est. Generation: ${currentGeneration}\n` +
                                    `- Est. Savings: ${currentSavings}\n` +
                                    `- Est. Payback Period: ${currentPayback}\n\n` +
                                    `Please contact me for further consultation.`;

                const encodedText = encodeURIComponent(textMessage);
                const whatsappUrl = `https://wa.me/917306670442?text=${encodedText}`;
                window.open(whatsappUrl, '_blank');
            });
        }

        // Initialize calculations
        calculateSolarPotential();

        function calculateSolarPotential() {
            const currentBill = parseInt(monthlyBillInput.value, 10);
            
            let calculatedMonthlyUnits = 0;
            const monthlyBillAmount = billingCycle === 'bimonthly' ? currentBill / 2 : currentBill;
            calculatedMonthlyUnits = calculateKsebUnitsFromBill(monthlyBillAmount);
            
            // 150 units/month per kWp (High efficiency Topcon metrics)
            const averageMonthlyProductionPerKw = 150;
            
            // Recommend system size to fully offset consumption
            let recommendedSystemSize = Math.ceil(calculatedMonthlyUnits / averageMonthlyProductionPerKw);
            // KSEB subsidy threshold minimum is usually 3kW, max domestic practical is ~50kW
            recommendedSystemSize = Math.max(3, Math.min(50, recommendedSystemSize));
            
            const monthlyGeneration = recommendedSystemSize * averageMonthlyProductionPerKw;
            const exposureFactor = exposureSelect ? parseFloat(exposureSelect.value) : 1.0;
            const netMonthlyGeneration = monthlyGeneration * exposureFactor;
            
            // Savings Calculation (Including Net Metering)
            // Calculate effective cost per unit they were paying before
            const effectiveUnitCost = calculatedMonthlyUnits > 0 ? (monthlyBillAmount / calculatedMonthlyUnits) : 5.0;
            
            let monthlySavings = 0;
            if (netMonthlyGeneration > calculatedMonthlyUnits) {
                // If generating more than consuming: 
                // Savings = avoiding the entire bill + selling excess to KSEB at ₹2.69
                const excessUnits = netMonthlyGeneration - calculatedMonthlyUnits;
                monthlySavings = monthlyBillAmount + (excessUnits * 2.69);
            } else {
                // If consuming more than generating:
                // Savings = value of generated units offset at their effective rate
                monthlySavings = netMonthlyGeneration * effectiveUnitCost;
            }
            
            // System Cost - Tiered KSEB standard pricing
            let costPerKw = 60000;
            if (recommendedSystemSize <= 3) {
                costPerKw = 65000;
            } else if (recommendedSystemSize <= 10) {
                costPerKw = 60000;
            } else {
                costPerKw = 55000;
            }
            const totalSystemCost = recommendedSystemSize * costPerKw;
            
            // Payback Period
            const annualSavings = monthlySavings * 12;
            const paybackPeriod = annualSavings > 0 ? (totalSystemCost / annualSavings) : 0;
            
            // Roof space (80 sq.ft per kWp for modern panels)
            const roofSpace = recommendedSystemSize * 80;
            
            // Environmental Impact metrics
            const annualCo2Saved = (netMonthlyGeneration * 12 * 0.82) / 1000; // in tons
            const treesPlantedEquivalent = Math.round(annualCo2Saved * 45); // ~45 trees absorb 1 ton CO2/yr
            
            // Update scoped calculator results
            currentSystemSize = `${recommendedSystemSize} kWp`;
            
            if (billingCycle === 'bimonthly') {
                currentGeneration = `${Math.round(netMonthlyGeneration * 2)} kWh (Bi-monthly)`;
                currentSavings = `₹${Math.round(monthlySavings * 2)} (Bi-monthly)`;
            } else {
                currentGeneration = `${Math.round(netMonthlyGeneration)} kWh (Monthly)`;
                currentSavings = `₹${Math.round(monthlySavings)} (Monthly)`;
            }
            currentPayback = `${paybackPeriod.toFixed(1)} Years`;

            // Update UI elements
            if (systemSizeEl) systemSizeEl.textContent = `${recommendedSystemSize} kWp`;
            if (roofSpaceEl) roofSpaceEl.textContent = `${roofSpace} sq. ft.`;
            
            if (billingCycle === 'bimonthly') {
                if (generationEl) generationEl.textContent = `(Est. ${Math.round(netMonthlyGeneration * 2)} Units / Bi-monthly)`;
                if (savingsEl) savingsEl.textContent = `₹${Math.round(monthlySavings * 2)}`;
                if (bimonthlySavingsEl) bimonthlySavingsEl.textContent = `(₹${Math.round(monthlySavings)} / Month)`;
            } else {
                if (generationEl) generationEl.textContent = `(Est. ${Math.round(netMonthlyGeneration)} Units / Month)`;
                if (savingsEl) savingsEl.textContent = `₹${Math.round(monthlySavings)}`;
                if (bimonthlySavingsEl) bimonthlySavingsEl.textContent = `(₹${Math.round(monthlySavings * 2)} Bi-monthly)`;
            }
            
            if (paybackEl) paybackEl.textContent = `${paybackPeriod.toFixed(1)} Years`;
            if (treesEl) treesEl.textContent = treesPlantedEquivalent;
            if (co2El) co2El.textContent = `${annualCo2Saved.toFixed(1)} Tons`;

            if (billLabelEl) {
                billLabelEl.textContent = billingCycle === 'bimonthly' ? 'Average Bi-monthly Electricity Bill (INR)' : 'Average Monthly Electricity Bill (INR)';
            }
            if (savingsLabelEl) {
                savingsLabelEl.textContent = billingCycle === 'bimonthly' ? 'Est. Bi-monthly Savings' : 'Est. Monthly Savings';
            }
        }
        
        function calculateKsebUnitsFromBill(monthlyBill) {
            // Refined reverse KSEB domestic billing function (Monthly)
            if (monthlyBill <= 150) return 50;
            if (monthlyBill <= 300) return 100;
            if (monthlyBill <= 550) return 150;
            if (monthlyBill <= 850) return 200;
            if (monthlyBill <= 1250) return 250;
            // Above 250 units, rates become non-telescopic and steeper
            if (monthlyBill <= 2200) return 300;
            if (monthlyBill <= 3000) return 400;
            if (monthlyBill <= 4500) return 500;
            // High consumption averages around ₹8.5 per unit
            return Math.round(monthlyBill / 8.5);
        }
    }


    /* --- FAQ Accordion --- */
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                const answer = faqItem.querySelector('.faq-answer');

                if (answer) {
                    // Collapse all others
                    document.querySelectorAll('.faq-item').forEach(item => {
                        if (item !== faqItem) {
                            item.classList.remove('active');
                            const otherAns = item.querySelector('.faq-answer');
                            if (otherAns) {
                                otherAns.style.maxHeight = null;
                            }
                        }
                    });

                    // Toggle current
                    faqItem.classList.toggle('active');
                    if (faqItem.classList.contains('active')) {
                        answer.style.maxHeight = answer.scrollHeight + "px";
                    } else {
                        answer.style.maxHeight = null;
                    }
                }
            });
        });
    }


    /* --- Reveal Scroll Animation --- */
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0 && typeof IntersectionObserver !== 'undefined') {
        const revealObserverOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -40px 0px"
        };

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, revealObserverOptions);

        revealElements.forEach(el => revealObserver.observe(el));
    }


    /* --- Form Submission Simulation (Simplified: Name and Phone only) --- */
    const contactForm = document.getElementById('solar-contact-form');
    const submitBtn = document.getElementById('form-submit-btn');
    const submitBtnText = document.getElementById('submit-btn-text');
    const submitLoader = document.getElementById('submit-loader');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Basic client validation checks
            const nameEl = document.getElementById('contact-name');
            const phoneEl = document.getElementById('contact-phone');
            
            const name = nameEl ? nameEl.value.trim() : '';
            const phone = phoneEl ? phoneEl.value.trim() : '';

            if (!name || !phone) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            // Disable button & show loading spinner
            if (submitBtn) submitBtn.disabled = true;
            if (submitBtnText) submitBtnText.classList.add('hidden');
            if (submitLoader) submitLoader.classList.remove('hidden');

            // Simulate API post (1.5 seconds)
            setTimeout(() => {
                // Reset button states
                if (submitBtn) submitBtn.disabled = false;
                if (submitBtnText) submitBtnText.classList.remove('hidden');
                if (submitLoader) submitLoader.classList.add('hidden');

                // Reset form
                contactForm.reset();

                // Re-calculate solar values to slider default if calculator exists
                if (monthlyBillInput) {
                    monthlyBillInput.value = 5000;
                    if (billDisplay) billDisplay.textContent = '₹5,000';
                    const defaultCycleBtn = document.querySelector('.cycle-btn[data-cycle="bimonthly"]');
                    if (defaultCycleBtn) {
                        const cycleBtns = document.querySelectorAll('.cycle-btn');
                        cycleBtns.forEach(b => b.classList.remove('active'));
                        defaultCycleBtn.classList.add('active');
                    }
                    // Trigger recalculate
                    monthlyBillInput.dispatchEvent(new Event('input'));
                }

                // Show congratulations toast
                showToast('Request submitted! JEYAR BRIGHTECH will contact you shortly.', 'success');
            }, 1500);
        });
    }


    /* --- Toast Notification Helper --- */
    const toastContainer = document.getElementById('toast-container');

    function showToast(message, type = 'success') {
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;

        const iconClass = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
        
        toast.innerHTML = `
            <span class="toast-icon"><i class="${iconClass}"></i></span>
            <span class="toast-message">${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Slide out and remove toast after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutToast 0.3s ease-in forwards';
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 4000);
    }

    /* --- Smooth Page Transitions --- */
    // Trigger body fade-in on load
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 50);

    // Intercept internal page links to fade out smoothly before navigating
    const internalLinks = document.querySelectorAll('a[href$=".html"], a[href^="index.html"]');
    internalLinks.forEach(link => {
        const href = link.getAttribute('href');
        const currentPath = window.location.pathname;
        const targetPage = href.split('#')[0];
        
        if (targetPage && !currentPath.endsWith(targetPage) && !href.startsWith('#')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.body.classList.add('fade-out');
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            });
        }
    });

    /* --- Clean Solid Cursor Handler (Disabled Trippy Particles & Lagging Rings) --- */
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    
    if (cursorDot) cursorDot.style.display = 'none';
    if (cursorRing) cursorRing.style.display = 'none';

    /* --- Sidebar Rail Toggle System --- */
    const topSidebarBtn = document.getElementById('top-sidebar-btn');
    const railToggleBtn = document.getElementById('rail-toggle-btn');
    const railSearchTrigger = document.getElementById('rail-search-trigger');

    function toggleSidebarRail() {
        const isClosed = document.body.classList.toggle('sidebar-closed');
        const isOpen = document.body.classList.toggle('sidebar-open');
        
        const topBtn = document.getElementById('top-sidebar-btn');
        if (topBtn) {
            const span = topBtn.querySelector('span');
            const caret = topBtn.querySelector('.caret');
            const isMobile = window.innerWidth <= 992;
            const isCurrentlyOpen = isMobile ? isOpen : !isClosed;
            
            if (span) span.textContent = isCurrentlyOpen ? 'Close sidebar' : 'Open sidebar';
            if (caret) caret.style.transform = isCurrentlyOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }

    if (topSidebarBtn) {
        topSidebarBtn.addEventListener('click', toggleSidebarRail);
    }
    if (railToggleBtn) {
        railToggleBtn.addEventListener('click', toggleSidebarRail);
    }

    if (railSearchTrigger) {
        railSearchTrigger.addEventListener('click', () => {
            const promptInput = document.getElementById('prompt-input');
            if (promptInput) {
                promptInput.focus();
                promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    /* --- Central AI Prompt Bar Handler --- */
    const promptInput = document.getElementById('prompt-input');
    const promptSubmitBtn = document.getElementById('prompt-submit-btn');

    function handlePromptSubmit() {
        if (!promptInput) return;
        const query = promptInput.value.trim().toLowerCase();
        if (!query) return;

        if (query.includes('calc') || query.includes('sav') || query.includes('bill') || query.includes('cost') || query.includes('price')) {
            const calcSection = document.getElementById('calculator');
            if (calcSection) calcSection.scrollIntoView({ behavior: 'smooth' });
        } else if (query.includes('spec') || query.includes('hardware') || query.includes('panel') || query.includes('inverter') || query.includes('battery')) {
            window.location.href = 'specifications.html';
        } else if (query.includes('gallery') || query.includes('project') || query.includes('install') || query.includes('work')) {
            window.location.href = 'gallery.html';
        } else if (query.includes('faq') || query.includes('question') || query.includes('help')) {
            window.location.href = 'faq.html';
        } else if (query.includes('about') || query.includes('team') || query.includes('who')) {
            const aboutSection = document.getElementById('about');
            if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            const encoded = encodeURIComponent(`Hi Jeyar Brightech, I have a question: ${promptInput.value}`);
            window.open(`https://wa.me/917306670442?text=${encoded}`, '_blank');
        }
    }

    if (promptSubmitBtn) {
        promptSubmitBtn.addEventListener('click', handlePromptSubmit);
    }

    if (promptInput) {
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handlePromptSubmit();
            }
        });
    }
});

