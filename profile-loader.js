// Helper function to get skill icon SVG
function getSkillIcon(category) {
    const icons = {
        'Frontend': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2"></rect>
            <path d="M8 21h8M12 17v4"></path>
        </svg>`,
        'Backend': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6"></path>
            <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24M1 12h6m6 0h6"></path>
            <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"></path>
        </svg>`,
        'Database': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
        </svg>`,
        'Tools': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>`
    };

    return icons[category] || icons['Tools'];
}

// Load profile data from JSON
async function loadProfile() {
    try {
        const response = await fetch('data/profile.json');
        const profile = await response.json();

        // Update name in hero section
        const heroName = document.querySelector('.hero-name');
        if (heroName) heroName.textContent = profile.name;

        // Update title/role
        const typingText = document.querySelector('.typing-text');
        if (typingText) typingText.textContent = profile.title;

        // Update description
        const heroDescription = document.querySelector('.hero-description');
        if (heroDescription) heroDescription.textContent = profile.description;

        // Update page title
        document.title = `${profile.name} - Portfolio`;

        // Update meta author
        const metaAuthor = document.querySelector('meta[name="author"]');
        if (metaAuthor) metaAuthor.content = profile.name;

        // Update footer
        const footer = document.querySelector('.footer p');
        if (footer) footer.innerHTML = `&copy; 2024 ${profile.name}. Built with passion and creativity.`;

        // Update contact info
        if (profile.contact) {
            const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
            emailLinks.forEach(link => {
                link.href = `mailto:${profile.contact.email}`;
                const emailText = link.querySelector('p');
                if (emailText) emailText.textContent = profile.contact.email;
            });

            const githubLinks = document.querySelectorAll('a[href*="github.com"]');
            githubLinks.forEach(link => {
                if (!link.href.includes('github.com/yourusername')) return;
                link.href = `https://github.com/${profile.contact.github}`;
                const githubText = link.querySelector('p');
                if (githubText) githubText.textContent = `github.com/${profile.contact.github}`;
            });

            const linkedinLinks = document.querySelectorAll('a[href*="linkedin.com"]');
            linkedinLinks.forEach(link => {
                if (!link.href.includes('linkedin.com/in/yourprofile')) return;
                link.href = `https://linkedin.com/in/${profile.contact.linkedin}`;
                const linkedinText = link.querySelector('p');
                if (linkedinText) linkedinText.textContent = `linkedin.com/in/${profile.contact.linkedin}`;
            });
        }

        // Update About section
        if (profile.about) {
            const aboutText = document.querySelector('.about-text');
            if (aboutText) {
                // Clear existing paragraphs (keep the h3)
                const heading = aboutText.querySelector('h3');
                aboutText.innerHTML = '';
                if (heading) aboutText.appendChild(heading);

                // Add intro paragraph
                const introPara = document.createElement('p');
                introPara.textContent = profile.about.intro;
                aboutText.appendChild(introPara);

                // Add interests paragraph
                const interestsPara = document.createElement('p');
                interestsPara.textContent = profile.about.interests;
                aboutText.appendChild(interestsPara);

                // Add goal paragraph
                const goalPara = document.createElement('p');
                goalPara.textContent = profile.about.goal;
                aboutText.appendChild(goalPara);
            }
        }

        // Update Skills section
        if (profile.skills && Array.isArray(profile.skills)) {
            const skillsGrid = document.querySelector('.skills-grid');
            if (skillsGrid) {
                skillsGrid.innerHTML = '';

                profile.skills.forEach(skill => {
                    const skillCard = document.createElement('div');
                    skillCard.className = 'skill-card';

                    // Create skill card HTML
                    skillCard.innerHTML = `
                        <div class="skill-icon">
                            ${getSkillIcon(skill.category)}
                        </div>
                        <h4>${skill.category}</h4>
                        <p>${skill.technologies}</p>
                    `;

                    skillsGrid.appendChild(skillCard);
                });
            }
        }

    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// Load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProfile);
} else {
    loadProfile();
}
