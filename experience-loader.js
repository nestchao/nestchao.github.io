// ===========================
// Dynamic Experience Timeline
// ===========================
async function loadExperience() {
    try {
        const response = await fetch('data/experience.json');
        const data = await response.json();

        const container = document.getElementById('timeline-container');
        if (!container) {
            console.error('Timeline container not found');
            return;
        }

        container.innerHTML = ''; // Clear any existing content

        data.forEach((item, index) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item slide-in-left';
            timelineItem.style.transitionDelay = `${index * 0.2}s`;

            timelineItem.innerHTML = `
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <span class="timeline-date">${item.date}</span>
                    <h3>${item.title}</h3>
                    <h4>${item.company}</h4>
                    <p>${item.description}</p>
                </div>
            `;

            container.appendChild(timelineItem);
        });

        // Re-attach the intersection observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.timeline-item').forEach(item => {
            observer.observe(item);
        });

    } catch (error) {
        console.error('Error loading experience data:', error);
        // Fallback: show a message
        const container = document.getElementById('timeline-container');
        if (container) {
            container.innerHTML = '<p style="color: var(--color-text-secondary);">Experience data is loading...</p>';
        }
    }
}

// Load experience data when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadExperience);
} else {
    loadExperience();
}
