// Load projects data from JSON
async function loadProjects() {
    try {
        const response = await fetch('data/projects.json');
        const projects = await response.json();

        const portfolioGrid = document.querySelector('.portfolio-grid');
        if (!portfolioGrid) {
            console.error('Portfolio grid not found');
            return;
        }

        portfolioGrid.innerHTML = ''; // Clear existing projects

        projects.forEach((project, index) => {
            const article = document.createElement('article');
            article.className = 'project-card';

            article.innerHTML = `
                <div class="project-image">
                    <img src="${project.image}" alt="${project.title}">
                    <div class="project-overlay">
                        <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="project-link">View on GitHub</a>
                    </div>
                </div>
                <div class="project-info">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <div class="project-tags">
                        ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            `;

            portfolioGrid.appendChild(article);
        });

    } catch (error) {
        console.error('Error loading projects data:', error);
    }
}

// Load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
} else {
    loadProjects();
}
