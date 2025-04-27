const MIN_CONTAINER_WIDTH = 20;   
const MIN_CONTAINER_HEIGHT = 20;  
const INITIAL_LETTER_WIDTH = 100; 
const INITIAL_LETTER_HEIGHT = 100; 
const LETTER_SPACING = 150;       
const SPACE_WIDTH = 60;           
const MARGIN_LEFT = 20;           // for start point
const MARGIN_TOP = 20;            // for start point
const LINE_SPACING = 150;         

let verticalScale = 10;
let horizontalScale = 10;
let lineThickness = 2; 

let activeDragElement;
let activeResizeHandle;
let activeContainer;
let initialMouseX = 0;
let initialMouseY = 0;
let initialLeft = 0;
let initialTop = 0;
let initialWidth = 0;
let initialHeight = 0;



document.addEventListener('DOMContentLoaded', function() {
    setupControls();
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    createLetterContainer(' ', MARGIN_LEFT, MARGIN_TOP);
});

function setupControls() {
    const verticalScaleSlider = document.getElementById('vertical-scale');
    const horizontalScaleSlider = document.getElementById('horizontal-scale');
    const thicknessSlider = document.getElementById('line-thickness');
    
    const verticalValueDisplay = document.getElementById('vertical-value');
    const horizontalValueDisplay = document.getElementById('horizontal-value');
    const thicknessValueDisplay = document.getElementById('thickness-value');
    
    const textInput = document.getElementById('text-input');
    const generateButton = document.getElementById('generate-btn');
    
    verticalScaleSlider.addEventListener('input', function() {
        verticalScale = parseInt(this.value);
        verticalValueDisplay.textContent = verticalScale;
        updateAllLetters();
    });
    
    horizontalScaleSlider.addEventListener('input', function() {
        horizontalScale = parseInt(this.value);
        horizontalValueDisplay.textContent = horizontalScale;
        updateAllLetters();
    });
    
    thicknessSlider.addEventListener('input', function() {
        lineThickness = parseInt(this.value);
        thicknessValueDisplay.textContent = lineThickness;
        updateAllLetters();
        
        document.documentElement.style.setProperty('--line-thickness', `${lineThickness}px`);
    });
    
    document.documentElement.style.setProperty('--line-thickness', `${lineThickness}px`);
    
    generateButton.addEventListener('click', function() {
        generateLettersFromText(textInput.value);
    });
    
    textInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateLettersFromText(textInput.value);
        }
    });
}

function generateLettersFromText(text) {
    const container = document.getElementById('layout-container');
    container.innerHTML = '';
    
    const availableWidth = window.innerWidth - 40;
    
    const validChars = text.toUpperCase().split('');
    let xPosition = MARGIN_LEFT;
    let yPosition = MARGIN_TOP;
    let lineWidth = 0;
    
    validChars.forEach((char, index) => {
        if (char >= 'A' && char <= 'Z') {
            if (xPosition + INITIAL_LETTER_WIDTH > availableWidth) {
                xPosition = MARGIN_LEFT;
                yPosition += LINE_SPACING;
            }
            
            createLetterContainer(char, xPosition, yPosition);
            xPosition += LETTER_SPACING;
            lineWidth = xPosition; 
        } else if (char === ' ') {
            xPosition += SPACE_WIDTH;
            
            // Check if the next word would make the line too long for the screen
            let nextWordEnd = xPosition;
            let i = index + 1;
            while (i < validChars.length && validChars[i] !== ' ') {
                nextWordEnd += LETTER_SPACING;
                i++;
            }
            
            // If so, wrap to a new line
            if (nextWordEnd > availableWidth) {
                xPosition = MARGIN_LEFT;
                yPosition += LINE_SPACING;
            }
        } else if (char === '\n') {
            // Handle explicit line breaks
            xPosition = MARGIN_LEFT;
            yPosition += LINE_SPACING;
        }
    });
}

function createLetterContainer(letter, left, top) {
    const container = document.getElementById('layout-container');
    
    const letterContainer = document.createElement('div');
    letterContainer.className = 'letter-container';
    letterContainer.style.width = `${INITIAL_LETTER_WIDTH}px`;
    letterContainer.style.height = `${INITIAL_LETTER_HEIGHT}px`;
    letterContainer.style.left = `${left}px`;
    letterContainer.style.top = `${top}px`;
    letterContainer.dataset.letter = letter;
    
    const handles = ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left'];
    handles.forEach(position => {
        const handle = document.createElement('div');
        handle.className = `handle ${position}`;
        handle.dataset.handle = position;
        letterContainer.appendChild(handle);
        
        handle.addEventListener('mousedown', handleResizeStart);
    });
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'letter-content';
    letterContainer.appendChild(contentContainer);
    
    letterContainer.addEventListener('mousedown', handleDragStart);
    letterContainer.addEventListener('mouseenter', showHandles);
    letterContainer.addEventListener('mouseleave', hideHandles);
    
    container.appendChild(letterContainer);
    
    generateLetterElements(letterContainer);
    
    return letterContainer;
}

function showHandles(e) {
    const handles = this.querySelectorAll('.handle');
    handles.forEach(handle => {
        handle.classList.add('visible');
    });
}

function hideHandles(e) {
    if (activeResizeHandle) return;
    
    const handles = this.querySelectorAll('.handle');
    handles.forEach(handle => {
        handle.classList.remove('visible');
    });
}

function generateLetterElements(container) {
    const letter = container.dataset.letter;
    const contentContainer = container.querySelector('.letter-content');
    
    contentContainer.innerHTML = '';
    
    const elements = generateLetterParts(letter);
    
    elements.forEach(element => {
        contentContainer.appendChild(element);
    });
}

function generateLetterParts(letter) {
    const elements = [];
    
    const createVerticalLine = (center, middle, height) => {
        const line = document.createElement('div');
        line.className = 'vertical-line';
        line.style.left = `${center}%`;
        
        const top = middle - (height * verticalScale / 2);
        line.style.top = `${top}%`;
        line.style.height = `${height * verticalScale}%`;
        line.style.width = `${lineThickness}px`;
        return line;
    };
    
    const createHorizontalLine = (center, middle, width) => {
        const line = document.createElement('div');
        line.className = 'horizontal-line';
        
        const left = center - (width * horizontalScale / 2);
        line.style.left = `${left}%`;
        line.style.top = `${middle}%`;
        line.style.width = `${width * horizontalScale}%`;
        line.style.height = `${lineThickness}px`;
        return line;
    };
    
    const createDiagonalLine = (x1, y1, x2, y2) => {
        const svgNS = "http://www.w3.org/2000/svg";
        
        // I'm drawing diagonal lines with SVGs because it's easier to control the stroke width and keep it consistent with the other lines
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "diagonal-line-svg");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("viewBox", "0 0 100 100");
        
        // Create the line with vector-effect to keep stroke width consistent
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "var(--white)");
        line.setAttribute("stroke-width", lineThickness);
        line.setAttribute("vector-effect", "non-scaling-stroke"); // This is the key for consistent thickness
        
        svg.appendChild(line);
        return svg;
    };
    
    switch(letter) {
        case 'A':
            // Vertical lines - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Left vertical
            elements.push(createVerticalLine(90, 50, 9)); // Right vertical
            
            // Horizontal lines - centered horizontally
            elements.push(createHorizontalLine(50, 5, 8)); // Top 
            elements.push(createHorizontalLine(50, 50, 8)); // Middle
            break;
            
        case 'B':
            // Vertical line - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Main stem
            
            // Horizontal lines - centered horizontally
            elements.push(createHorizontalLine(45, 5, 7));  // Top
            elements.push(createHorizontalLine(45, 50, 7)); // Middle
            elements.push(createHorizontalLine(45, 95, 7)); // Bottom
            
            // Vertical lines for right side - centered vertically in their respective sections
            elements.push(createVerticalLine(80, 27.5, 4.5)); // Top right (centered between top and middle)
            elements.push(createVerticalLine(80, 72.5, 4.5)); // Bottom right (centered between middle and bottom)
            break;
            
        case 'C':
            // Vertical line - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Left vertical
            
            // Horizontal lines - centered horizontally
            elements.push(createHorizontalLine(50, 5, 8)); // Top
            elements.push(createHorizontalLine(50, 95, 8)); // Bottom
            break;
            
        case 'D':
            // Vertical lines - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Left vertical
            elements.push(createVerticalLine(90, 50, 9)); // Right vertical
            
            // Horizontal lines - centered horizontally
            elements.push(createHorizontalLine(50, 5, 8)); // Top
            elements.push(createHorizontalLine(50, 95, 8)); // Bottom
            break;
            
        case 'E':
            // Vertical line - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Main vertical
            
            // Horizontal lines - centered horizontally
            elements.push(createHorizontalLine(50, 5, 8)); // Top
            elements.push(createHorizontalLine(50, 50, 8)); // Middle
            elements.push(createHorizontalLine(50, 95, 8)); // Bottom
            break;
            
        case 'F':
            // Vertical line - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Main vertical
            
            // Horizontal lines - centered horizontally
            elements.push(createHorizontalLine(50, 5, 8)); // Top
            elements.push(createHorizontalLine(50, 50, 8)); // Middle
            break;
            
        case 'G':
            // Vertical lines - centered vertically in their positions
            elements.push(createVerticalLine(10, 50, 9)); // Left vertical
            elements.push(createVerticalLine(90, 73, 5)); // Right vertical (centered in bottom half)
            
            // Horizontal lines - centered horizontally
            elements.push(createHorizontalLine(50, 5, 8)); // Top
            elements.push(createHorizontalLine(50, 95, 8)); // Bottom
            elements.push(createHorizontalLine(70, 50, 4)); // Middle right
            break;
            
        case 'H':
            // Vertical lines - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Left vertical
            elements.push(createVerticalLine(90, 50, 9)); // Right vertical
            
            // Horizontal line - centered horizontally
            elements.push(createHorizontalLine(50, 50, 8)); // Middle
            break;
            
        case 'I':
            // Vertical line - centered vertically and horizontally
            elements.push(createVerticalLine(50, 50, 9)); // Center vertical
            
            // Horizontal lines - centered horizontally
            elements.push(createHorizontalLine(50, 5, 6)); // Top 
            elements.push(createHorizontalLine(50, 95, 6)); // Bottom
            break;
            
        case 'J':
            // Vertical line - centered vertically
            elements.push(createVerticalLine(70, 50, 9)); // Right vertical
            
            // Horizontal line at bottom - centered horizontally
            elements.push(createHorizontalLine(40, 95, 6)); // Bottom
            break;
            
        case 'K':
            // Vertical line
            elements.push(createVerticalLine(10, 50, 9)); // Main vertical
            
            // Diagonal lines for the right part
            elements.push(createDiagonalLine(25, 50, 90, 5));   // Upper diagonal - from center to top right
            elements.push(createDiagonalLine(25, 50, 90, 95));  // Lower diagonal - from center to bottom right
            break;
            
        case 'L':
            // Vertical line - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Main vertical
            
            // Horizontal line at bottom
            elements.push(createHorizontalLine(50, 95, 8)); // Bottom
            break;
            
        case 'M':
            // Vertical lines
            elements.push(createVerticalLine(5, 50, 9));  // Left vertical
            elements.push(createVerticalLine(95, 50, 9)); // Right vertical
            
            // Diagonal lines for the middle part
            elements.push(createDiagonalLine(5, 5, 50, 95));   // Left diagonal
            elements.push(createDiagonalLine(95, 5, 50, 95));  // Right diagonal
            break;
            
        case 'N':
            // Vertical lines
            elements.push(createVerticalLine(5, 50, 9));  // Left vertical
            elements.push(createVerticalLine(95, 50, 9)); // Right vertical
            
            // Diagonal line
            elements.push(createDiagonalLine(5, 5, 95, 95)); // Diagonal from top-left to bottom-right
            break;
            
        case 'O':
            // Vertical lines - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Left vertical
            elements.push(createVerticalLine(90, 50, 9)); // Right vertical
            
            // Horizontal lines - centered horizontally
            elements.push(createHorizontalLine(50, 5, 8)); // Top
            elements.push(createHorizontalLine(50, 95, 8)); // Bottom
            break;
            
        case 'P':
            // Vertical line - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Main stem
            
            // Horizontal lines
            elements.push(createHorizontalLine(45, 5, 7)); // Top
            elements.push(createHorizontalLine(45, 50, 7)); // Middle
            
            // Vertical line for right side
            elements.push(createVerticalLine(80, 27.5, 4.5)); // Right (centered between top and middle)
            break;
            
        case 'Q':
            // Vertical lines - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Left vertical
            elements.push(createVerticalLine(90, 50, 9)); // Right vertical
            
            // Horizontal lines
            elements.push(createHorizontalLine(50, 5, 8)); // Top
            elements.push(createHorizontalLine(50, 95, 8)); // Bottom
            
            // Diagonal tail
            elements.push(createDiagonalLine(50, 50, 90, 95)); // Diagonal tail
            break;
            
        case 'R':
            // Vertical line - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Main stem
            
            // Horizontal lines
            elements.push(createHorizontalLine(45, 5, 7)); // Top
            elements.push(createHorizontalLine(45, 50, 7)); // Middle
            
            // Vertical line for top right and diagonal leg
            elements.push(createVerticalLine(80, 27.5, 4.5)); // Top right
            elements.push(createDiagonalLine(45, 50, 90, 95)); // Diagonal leg
            break;
            
        case 'S':
            // Horizontal lines
            elements.push(createHorizontalLine(50, 5, 8)); // Top
            elements.push(createHorizontalLine(50, 50, 8)); // Middle
            elements.push(createHorizontalLine(50, 95, 8)); // Bottom
            
            // Vertical segments to connect
            elements.push(createVerticalLine(10, 27.5, 4.5)); // Top left vertical
            elements.push(createVerticalLine(90, 72.5, 4.5)); // Bottom right vertical
            break;
            
        case 'T':
            // Vertical line - centered vertically and horizontally
            elements.push(createVerticalLine(50, 50, 9)); // Center vertical
            
            // Horizontal line at top
            elements.push(createHorizontalLine(50, 5, 8)); // Top
            break;
            
        case 'U':
            // Vertical lines - centered vertically
            elements.push(createVerticalLine(10, 50, 9)); // Left vertical
            elements.push(createVerticalLine(90, 50, 9)); // Right vertical
            
            // Horizontal line at bottom
            elements.push(createHorizontalLine(50, 95, 8)); // Bottom
            break;
            
        case 'V':
            // Diagonal lines
            elements.push(createDiagonalLine(5, 5, 50, 95));   // Left diagonal
            elements.push(createDiagonalLine(95, 5, 50, 95));  // Right diagonal
            break;
            
        case 'W':
            // Diagonal lines
            elements.push(createDiagonalLine(5, 5, 25, 95));   // First diagonal
            elements.push(createDiagonalLine(25, 95, 50, 20)); // Second diagonal
            elements.push(createDiagonalLine(50, 20, 75, 95)); // Third diagonal
            elements.push(createDiagonalLine(75, 95, 95, 5));  // Fourth diagonal
            break;
            
        case 'X':
            // Diagonal lines
            elements.push(createDiagonalLine(5, 5, 95, 95));   // Top-left to bottom-right
            elements.push(createDiagonalLine(95, 5, 5, 95));   // Top-right to bottom-left
            break;
            
        case 'Y':
            // Diagonal lines for the top part
            elements.push(createDiagonalLine(5, 5, 50, 50));   // Top-left to center
            elements.push(createDiagonalLine(95, 5, 50, 50));  // Top-right to center
            
            // Vertical line for the bottom
            elements.push(createVerticalLine(50, 75, 5)); // Bottom center
            break;
            
        case 'Z':
            // Horizontal lines
            elements.push(createHorizontalLine(50, 5, 9));  // Top (wider)
            elements.push(createHorizontalLine(50, 95, 9)); // Bottom (wider)
            
            // Diagonal line for the middle
            elements.push(createDiagonalLine(95, 5, 5, 95)); // Diagonal from top-right to bottom-left
            break;
            
        default:
            const placeholder = document.createElement('div');
            placeholder.textContent = letter;
            placeholder.style.fontSize = `${INITIAL_LETTER_HEIGHT}px`;
            placeholder.style.display = 'flex';
            placeholder.style.justifyContent = 'center';
            placeholder.style.alignItems = 'center';
            placeholder.style.width = `${INITIAL_LETTER_WIDTH}px`;
            placeholder.style.height = `${INITIAL_LETTER_HEIGHT}px`;
            elements.push(placeholder);
    }
    
    return elements;
}

function handleDragStart(e) {
    if (e.target.classList.contains('handle')) return;
    
    e.preventDefault();
    activeDragElement = this;
    activeContainer = this;
    
    activeDragElement.classList.add('dragging');
    
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;
    initialLeft = parseInt(activeDragElement.style.left) || 0;
    initialTop = parseInt(activeDragElement.style.top) || 0;
}

function handleResizeStart(e) {
    e.preventDefault();
    e.stopPropagation();
    
    activeResizeHandle = this;
    activeContainer = this.parentElement;
    
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;
    initialLeft = parseInt(activeContainer.style.left) || 0;
    initialTop = parseInt(activeContainer.style.top) || 0;
    initialWidth = parseInt(activeContainer.style.width) || 100;
    initialHeight = parseInt(activeContainer.style.height) || 120;
}

function handleMouseMove(e) {
    if (activeDragElement) {
        const dx = e.clientX - initialMouseX;
        const dy = e.clientY - initialMouseY;
        
        activeDragElement.style.left = initialLeft + dx + 'px';
        activeDragElement.style.top = initialTop + dy + 'px';
    }
    
    if (activeResizeHandle) {
        const dx = e.clientX - initialMouseX;
        const dy = e.clientY - initialMouseY;
        
        const handle = activeResizeHandle.dataset.handle;
        
        switch (handle) {
            case 'top-left':
                activeContainer.style.width = Math.max(MIN_CONTAINER_WIDTH, initialWidth - dx) + 'px';
                activeContainer.style.height = Math.max(MIN_CONTAINER_HEIGHT, initialHeight - dy) + 'px';
                activeContainer.style.left = initialLeft + Math.min(dx, initialWidth - MIN_CONTAINER_WIDTH) + 'px';
                activeContainer.style.top = initialTop + Math.min(dy, initialHeight - MIN_CONTAINER_HEIGHT) + 'px';
                break;
                
            case 'top':
                activeContainer.style.height = Math.max(MIN_CONTAINER_HEIGHT, initialHeight - dy) + 'px';
                activeContainer.style.top = initialTop + Math.min(dy, initialHeight - MIN_CONTAINER_HEIGHT) + 'px';
                break;
                
            case 'top-right':
                activeContainer.style.width = Math.max(MIN_CONTAINER_WIDTH, initialWidth + dx) + 'px';
                activeContainer.style.height = Math.max(MIN_CONTAINER_HEIGHT, initialHeight - dy) + 'px';
                activeContainer.style.top = initialTop + Math.min(dy, initialHeight - MIN_CONTAINER_HEIGHT) + 'px';
                break;
                
            case 'right':
                activeContainer.style.width = Math.max(MIN_CONTAINER_WIDTH, initialWidth + dx) + 'px';
                break;
                
            case 'bottom-right':
                activeContainer.style.width = Math.max(MIN_CONTAINER_WIDTH, initialWidth + dx) + 'px';
                activeContainer.style.height = Math.max(MIN_CONTAINER_HEIGHT, initialHeight + dy) + 'px';
                break;
                
            case 'bottom':
                activeContainer.style.height = Math.max(MIN_CONTAINER_HEIGHT, initialHeight + dy) + 'px';
                break;
                
            case 'bottom-left':
                activeContainer.style.width = Math.max(MIN_CONTAINER_WIDTH, initialWidth - dx) + 'px';
                activeContainer.style.height = Math.max(MIN_CONTAINER_HEIGHT, initialHeight + dy) + 'px';
                activeContainer.style.left = initialLeft + Math.min(dx, initialWidth - MIN_CONTAINER_WIDTH) + 'px';
                break;
                
            case 'left':
                activeContainer.style.width = Math.max(MIN_CONTAINER_WIDTH, initialWidth - dx) + 'px';
                activeContainer.style.left = initialLeft + Math.min(dx, initialWidth - MIN_CONTAINER_WIDTH) + 'px';
                break;
        }
        
        generateLetterElements(activeContainer);
    }
}

function handleMouseUp() {
    if (activeDragElement) {
        activeDragElement.classList.remove('dragging');
        activeDragElement = null;
    }
    
    if (activeResizeHandle) {
        activeResizeHandle = null;
        
        const allHandles = document.querySelectorAll('.handle');
        allHandles.forEach(handle => {
            if (!handle.parentElement.matches(':hover')) {
                handle.classList.remove('visible');
            }
        });
    }
    
    activeContainer = null;
}

function updateAllLetters() {
    const containers = document.querySelectorAll('.letter-container');
    containers.forEach(container => {
        generateLetterElements(container);
    });
}