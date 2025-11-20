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
