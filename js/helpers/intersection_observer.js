// intersection_observer.js
// Uses Intersection Observer API to detect which section is currently in view
// and console.logs the active section ID

(function () {
    function initIntersectionObserver() {
        // Get all step sections
        var sections = document.querySelectorAll('.step');
        
        if (sections.length === 0) {
            console.warn('intersection_observer: No .step sections found');
            return;
        }

        // Options for Intersection Observer
        var options = {
            root: null, // Use viewport as root
            rootMargin: '-40% 0px -40% 0px', // Trigger when section is in center 20% of viewport
            threshold: [0, 0.25, 0.5, 0.75, 1.0] // Multiple thresholds for better detection
        };

        // Callback function when intersection changes
        var callback = function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    var sectionId = entry.target.id || entry.target.getAttribute('data-active-index');
                    var activeIndex = entry.target.getAttribute('data-active-index');
                    
                    console.log('Active Section ID:', sectionId);
                    console.log('Active Index:', activeIndex);
                    console.log('Section Element:', entry.target);
                    
                    // Dispatch custom event for other scripts to listen to
                    var event = new CustomEvent('sectionActive', {
                        detail: {
                            sectionId: sectionId,
                            activeIndex: activeIndex,
                            element: entry.target
                        }
                    });
                    document.dispatchEvent(event);
                }
            });
        };

        // Create Intersection Observer
        var observer = new IntersectionObserver(callback, options);

        // Observe all sections
        sections.forEach(function (section) {
            observer.observe(section);
        });

        console.log('intersection_observer: Initialized, observing', sections.length, 'sections');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIntersectionObserver);
    } else {
        initIntersectionObserver();
    }

    // Re-initialize if sections are added dynamically
    window.initIntersectionObserver = initIntersectionObserver;
})();
