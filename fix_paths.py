import glob
import os

files = glob.glob('Mathling/*.aspx') + ['Mathling/Site.Master']

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements
    content = content.replace('href="css/', 'href="/css/')
    content = content.replace('src="js/', 'src="/js/')
    content = content.replace('src="favicon.svg"', 'src="/favicon.svg"')
    
    # Cache busting for aspx files
    content = content.replace('src="/js/app.js"', 'src="/js/app.js?v=3"')
    content = content.replace('src="/js/auth.js"', 'src="/js/auth.js?v=3"')
    content = content.replace('src="/js/profile.js"', 'src="/js/profile.js?v=3"')
    
    # Site.Master fixes
    if 'Site.Master' in file:
        content = content.replace('href="css/', 'href="<%=ResolveUrl("~/css/')
        content = content.replace('.css"', '.css")%>"')
        content = content.replace('href="favicon.svg"', 'href="<%=ResolveUrl("~/favicon.svg")%>"')
        
        # Add cache busting to CSS inside Site.Master
        content = content.replace('variables.css")%>"', 'variables.css?v=3")%>"')
        content = content.replace('base.css")%>"', 'base.css?v=3")%>"')
        content = content.replace('components.css")%>"', 'components.css?v=3")%>"')
        content = content.replace('layout.css")%>"', 'layout.css?v=3")%>"')
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done replacing.")
