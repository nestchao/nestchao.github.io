# Portfolio Website

A modern, responsive portfolio website showcasing projects, skills, and experience. Built with pure HTML, CSS, and JavaScript.

## 🌟 Features

- **Modern Design**: Dark theme with purple/blue gradients and glassmorphism effects
- **Fully Responsive**: Optimized for mobile, tablet, and desktop devices
- **Smooth Animations**: Scroll-triggered animations and micro-interactions
- **Interactive Elements**: Dynamic typing effect, gradient orbs, and hover effects
- **SEO Optimized**: Proper meta tags and semantic HTML structure
- **Performance**: Lightweight with no framework dependencies

## 📁 Project Structure

```
portfolio_site/
├── index.html          # Main HTML file
├── style.css           # Styles and design system
├── script.js           # JavaScript for interactivity
├── assets/             # Images and media files
│   ├── project1.jpg
│   ├── project2.jpg
│   ├── project3.jpg
│   ├── project4.jpg
│   └── resume.pdf
└── README.md
```

## 🚀 Getting Started

### Local Development

1. Clone or download this repository
2. Open `index.html` in your web browser
3. That's it! No build process required.

For a better development experience with live reload:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## 📝 Customization

### Update Personal Information

1. **Open `index.html`** and replace placeholder content:
   - Your name in the hero section
   - Bio and description
   - Skills and technologies
   - Project details and links
   - Contact information (email, LinkedIn, GitHub, etc.)

2. **Replace project images** in the `assets/` folder:
   - project1.jpg through project4.jpg with your actual project screenshots
   - Add your resume PDF as `resume.pdf`

3. **Update colors** in `style.css`:
   - Modify CSS variables in the `:root` section to match your brand
   - Change gradient colors and accent colors

### Add More Projects

To add more project cards, copy this HTML structure in the portfolio section:

```html
<article class="project-card">
    <div class="project-image">
        <img src="assets/your-project.jpg" alt="Project Name">
        <div class="project-overlay">
            <a href="#" class="project-link">View Project</a>
        </div>
    </div>
    <div class="project-info">
        <h3>Your Project Title</h3>
        <p>Project description goes here.</p>
        <div class="project-tags">
            <span class="tag">Tech1</span>
            <span class="tag">Tech2</span>
        </div>
    </div>
</article>
```

## 🌐 Deploying to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right and select **New repository**
3. Name it: `yourusername.github.io` (replace `yourusername` with your actual GitHub username)
4. Make it **Public**
5. Click **Create repository**

### Step 2: Upload Your Files

**Option A: Using Git (Recommended)**

```bash
# Navigate to your project folder
cd portfolio_site

# Initialize git repository
git init

# Add all files
git add .

# Commit your files
git commit -m "Initial portfolio website"

# Add remote repository (replace with your username)
git remote add origin https://github.com/yourusername/yourusername.github.io.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Option B: Using GitHub Web Interface**

1. On your repository page, click **Add file** > **Upload files**
2. Drag and drop all your files (index.html, style.css, script.js, assets folder)
3. Click **Commit changes**

### Step 3: Enable GitHub Pages

1. Go to your repository **Settings**
2. Scroll down to **Pages** (in the left sidebar)
3. Under **Source**, select **main** branch
4. Click **Save**

### Step 4: Access Your Website

Your website will be live at: `https://yourusername.github.io`

It may take a few minutes for the site to go live after deployment.

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox, animations
- **JavaScript**: Intersection Observer API, DOM manipulation
- **Google Fonts**: Inter font family

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 💡 Tips

1. **Optimize Images**: Compress your project screenshots before uploading to improve load times
2. **Update Regularly**: Keep your portfolio updated with new projects and skills
3. **Test Responsiveness**: Check your site on different devices and screen sizes
4. **Add Analytics**: Consider adding Google Analytics to track visitors
5. **Custom Domain**: You can add a custom domain in GitHub Pages settings

## 📄 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Feel free to fork this project and customize it for your own use!

---

**Built with 💜 by Your Name**


