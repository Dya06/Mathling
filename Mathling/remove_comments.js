const fs = require('fs');
const path = require('path');
const exts = ['.cs', '.js', '.css', '.aspx', '.html'];
function stripCommentsJS_CS_CSS(code) {
    const pattern = /("([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'|`([^`\\]*(\\.[^`\\]*)*)`)|(\/\*[\s\S]*?\*\/)|(\/\/[^\n]*)/g;
    return code.replace(pattern, function(match, stringMatch) {
        if (stringMatch) return stringMatch;
        return '';
    });
}
function stripCommentsHTML_ASPX(code) {
    code = code.replace(/<!--[\s\S]*?-->/g, '');
    code = code.replace(/<%--[\s\S]*?--%>/g, '');
    return code;
}
function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    let content = fs.readFileSync(filePath, 'utf8');
    if (ext === '.cs' || ext === '.js' || ext === '.css') {
        content = stripCommentsJS_CS_CSS(content);
    } else if (ext === '.aspx' || ext === '.html') {
        content = stripCommentsHTML_ASPX(content);
    }
    content = content.replace(/^\s*[\r\n]/gm, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned: ${filePath}`);
}
function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === 'bin' || file === 'obj' || file === '.git' || file === 'packages') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (exts.includes(path.extname(fullPath).toLowerCase())) {
            processFile(fullPath);
        }
    }
}
walkDir(__dirname);
console.log("Done removing comments!");
