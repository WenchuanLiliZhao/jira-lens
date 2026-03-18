"use strict";
/**
 * @file lib/confluence.ts
 * @description Convert Markdown to Confluence storage format.
 *
 * Ported from jira-mcp's lib/confluence-markdown.js.
 * Fenced code blocks become <ac:structured-macro ac:name="code"> macros.
 * Everything else goes through `marked` (GFM -> HTML).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mdToConfluenceStorage = mdToConfluenceStorage;
const marked_1 = require("marked");
function escapeCdata(text) {
    return text.replace(/\]\]>/g, ']]]]><![CDATA[>');
}
function codeBlockMacro(lang, code) {
    const safeCode = escapeCdata(code.replace(/\r\n/g, '\n').trimEnd());
    const langParam = lang && lang !== 'plaintext'
        ? `<ac:parameter ac:name="language">${lang}</ac:parameter>\n  `
        : '';
    return (`<ac:structured-macro ac:name="code" ac:schema-version="1">\n` +
        `  ${langParam}<ac:plain-text-body><![CDATA[${safeCode}]]></ac:plain-text-body>\n` +
        `</ac:structured-macro>`);
}
function mdToConfluenceStorage(markdown) {
    const parts = [];
    const codeBlockRe = /^```(\w*)\n([\s\S]*?)```$/gm;
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRe.exec(markdown)) !== null) {
        const before = markdown.slice(lastIndex, match.index);
        if (before.trim())
            parts.push({ type: 'md', content: before });
        parts.push({ type: 'code', lang: match[1] || 'plaintext', content: match[2] });
        lastIndex = match.index + match[0].length;
    }
    const tail = markdown.slice(lastIndex);
    if (tail.trim())
        parts.push({ type: 'md', content: tail });
    let html = '';
    for (const part of parts) {
        if (part.type === 'md') {
            let chunk = marked_1.marked.parse(part.content, { gfm: true });
            chunk = chunk.replace(/<tbody><tbody>/g, '<tbody>').replace(/<\/tbody><\/tbody>/g, '</tbody>');
            html += chunk;
        }
        else {
            html += codeBlockMacro(part.lang, part.content);
        }
    }
    return html;
}
//# sourceMappingURL=confluence.js.map