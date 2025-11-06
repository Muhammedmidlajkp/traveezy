/**
 * viewHelpers.js
 *
 * Utility functions to be passed to the EJS rendering engine.
 */

const PALETTE = [
    ['#667eea', '#764ba2'], ['#4B8FC7', '#2E5C8A'], ['#8B4513', '#654321'],
    ['#2a8a4a', '#1e6a3a'], ['#3a8a5a', '#2a6a4a'], ['#C17A4A', '#8E5A3A']
];

/**
 * Generates a placeholder SVG image with a gradient.
 * @param {string} title - The title to display on the SVG.
 * @param {number} index - The index to determine the color palette.
 * @returns {string} A data URI for the SVG image.
 */
const generateSVGPlaceholder = (title, index = 0) => {
    const colorIndex = index % PALETTE.length;
    const [startColor, endColor] = PALETTE[colorIndex];
    const svgContent = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'>
        <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${startColor}'/><stop offset='1' stop-color='${endColor}'/></linearGradient></defs>
        <rect fill='url(#g)' width='300' height='200'/>
        <text x='50%' y='50%' font-size='22' fill='white' font-family='Segoe UI, Arial' text-anchor='middle' dy='.3em'>${title}</text>
      </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
};

module.exports = { generateSVGPlaceholder };