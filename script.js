// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const imageList = document.getElementById('imageList');
const fileCount = document.getElementById('fileCount');
const processBtn = document.getElementById('processBtn');
const processBtnWrapper = document.getElementById('processBtnWrapper');
const progressArea = document.getElementById('progressArea');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// State
let uploadedImages = [];
let processedHeadPics = [];
let processedBackpackPics = [];
let gloowallPics = [];
let headPicBackground = [];
let nameMapping = {};

// Load JSZip from CDN
const jszipScript = document.createElement('script');
jszipScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
document.head.appendChild(jszipScript);

// Embedded name mapping
const NAME_DATA = {"A":"34","B":"35","C":"36","D":"37","E":"38","F":"39","G":"40","H":"41","I":"42","J":"43","K":"44","L":"45","M":"46","N":"47","O":"48","P":"49","Q":"50","R":"51","S":"52","T":"53","U":"54","V":"55","W":"56","X":"57","Y":"58","Z":"59","ADAM":"04","EVE":"05","ANDREW":"06","KELLY":"07","FORD":"09","NIKITA":"10","MISHA":"12","MAXIM":"30"};

function loadNameMapping() {
    for (const key in NAME_DATA) {
        nameMapping[key.toUpperCase()] = NAME_DATA[key];
    }
}
loadNameMapping();

function getNewFileName(originalName) {
    const lastDot = originalName.lastIndexOf('.');
    const baseName = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
    const extension = lastDot > 0 ? originalName.substring(lastDot) : '.png';
    const upperBaseName = baseName.toUpperCase();
    if (nameMapping[upperBaseName]) {
        return `9020000${nameMapping[upperBaseName]}${extension}`;
    }
    return originalName;
}

function isSpecialImage(filename) {
    const baseName = filename.toUpperCase().replace(/\.[^/.]+$/, '');
    return baseName === 'GLOO' || baseName === 'HEADBG';
}

function getSpecialImageType(filename) {
    const baseName = filename.toUpperCase().replace(/\.[^/.]+$/, '');
    if (baseName === 'GLOO') return 'gloo';
    if (baseName === 'HEADBG') return 'headbg';
    return null;
}

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(Array.from(e.dataTransfer.files));
});
fileInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
});

processBtn.addEventListener('click', () => {
    if (uploadedImages.length === 0) {
        alert('Please upload images first');
        return;
    }
    processImages();
});

downloadBtn.addEventListener('click', downloadZip);
resetBtn.addEventListener('click', reset);

function handleFiles(files) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    uploadedImages = [...uploadedImages, ...imageFiles];

    if (uploadedImages.length >= 12) {
        displayImages();
        previewSection.classList.remove('hidden');
        processBtnWrapper.classList.remove('hidden');
    } else {
        previewSection.classList.add('hidden');
        processBtnWrapper.classList.add('hidden');
    }

    downloadSection.classList.add('hidden');
    processedHeadPics = [];
    processedBackpackPics = [];
    gloowallPics = [];
    headPicBackground = [];
}

function displayImages() {
    imageList.innerHTML = '';
    fileCount.textContent = uploadedImages.length;
    uploadedImages.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'image-item';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        const number = document.createElement('span');
        number.className = 'number';
        number.textContent = index + 1;
        const newName = document.createElement('div');
        newName.className = 'new-name';
        newName.textContent = getNewFileName(file.name);
        div.appendChild(img);
        div.appendChild(number);
        div.appendChild(newName);
        imageList.appendChild(div);
    });
}

function cropTransparent(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 0) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (maxX < minX || maxY < minY) {
        return { x: 0, y: 0, width: width, height: height };
    }
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function processImages() {
    progressArea.classList.remove('hidden');
    processBtn.disabled = true;
    processedHeadPics = [];
    processedBackpackPics = [];
    gloowallPics = [];
    headPicBackground = [];
    processNextImage(0, 0, 24);
}

function processNextImage(index, currentStep, totalSteps) {
    if (index >= uploadedImages.length) {
        finishProcessing();
        return;
    }

    const file = uploadedImages[index];
    const img = new Image();
    const isSpecial = isSpecialImage(file.name);
    const specialType = getSpecialImageType(file.name);

    img.onload = () => {
        if (isSpecial) {
            const nameValues = Object.values(nameMapping);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            nameValues.forEach(value => {
                const newFileName = `9020000${value}.png`;
                if (specialType === 'gloo') {
                    gloowallPics.push({ name: newFileName, data: canvas });
                } else if (specialType === 'headbg') {
                    headPicBackground.push({ name: newFileName, data: canvas });
                }
            });

            currentStep++;
            updateProgress(currentStep, totalSteps);
            setTimeout(() => processNextImage(index + 1, currentStep, totalSteps), 50);
        } else {
            const newFileName = getNewFileName(file.name);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const crop = cropTransparent(imageData);

            const headCanvas = resizeAndCenter(img, crop, 110, 100);
            processedHeadPics.push({ name: newFileName, data: headCanvas });
            currentStep++;
            updateProgress(currentStep, totalSteps);

            const backpackCanvas = resizeAndCenterBackpack(img, crop);
            processedBackpackPics.push({ name: newFileName, data: backpackCanvas });
            currentStep++;
            updateProgress(currentStep, totalSteps);

            setTimeout(() => processNextImage(index + 1, currentStep, totalSteps), 50);
        }
    };

    img.src = URL.createObjectURL(file);
}

function resizeAndCenter(img, crop, canvasSize, fitSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const padding = 10;
    const availableSize = canvasSize - (padding * 2);
    const size = Math.max(crop.width, crop.height);
    const scale = fitSize / size;
    const scaledWidth = crop.width * scale;
    const scaledHeight = crop.height * scale;
    const x = padding + (availableSize - scaledWidth) / 2;
    const y = padding + (availableSize - scaledHeight) / 2;

    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, x, y, scaledWidth, scaledHeight);
    return canvas;
}

function resizeAndCenterBackpack(img, crop) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const canvasSize = 990;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const padding = 10;
    const availableSize = canvasSize - (padding * 2);
    const size = Math.max(crop.width, crop.height);
    const scale = 990 / size;
    const scaledWidth = crop.width * scale;
    const scaledHeight = crop.height * scale;
    const x = padding + (availableSize - scaledWidth) / 2;
    const y = padding + (availableSize - scaledHeight) / 2;

    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, x, y, scaledWidth, scaledHeight);
    return canvas;
}

function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = `Processing... ${current}/${total}`;
}

function finishProcessing() {
    progressFill.style.width = '100%';
    progressText.textContent = 'Processing complete!';
    setTimeout(() => {
        progressArea.classList.add('hidden');
        downloadSection.classList.remove('hidden');
        processBtn.disabled = false;
    }, 500);
}

function downloadZip() {
    if (typeof JSZip === 'undefined') {
        alert('JSZip is still loading. Please wait and try again.');
        return;
    }

    const zip = new JSZip();
    const headFolder = zip.folder('HeadPics');
    const backpackFolder = zip.folder('BackPackPics');
    const gloowallFolder = zip.folder('GloowallPics');
    const headBgFolder = zip.folder('HeadPicBackground');

    processedHeadPics.forEach(image => {
        const base64 = image.data.toDataURL('image/png').split(',')[1];
        headFolder.file(image.name, base64, { base64: true });
    });

    processedBackpackPics.forEach(image => {
        const base64 = image.data.toDataURL('image/png').split(',')[1];
        backpackFolder.file(image.name, base64, { base64: true });
    });

    gloowallPics.forEach(image => {
        const base64 = image.data.toDataURL('image/png').split(',')[1];
        gloowallFolder.file(image.name, base64, { base64: true });
    });

    headPicBackground.forEach(image => {
        const base64 = image.data.toDataURL('image/png').split(',')[1];
        headBgFolder.file(image.name, base64, { base64: true });
    });

    zip.generateAsync({ type: 'blob' }).then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'LogoAssets.zip';
        link.click();
    });
}

function reset() {
    uploadedImages = [];
    processedHeadPics = [];
    processedBackpackPics = [];
    gloowallPics = [];
    headPicBackground = [];
    previewSection.classList.add('hidden');
    processBtnWrapper.classList.add('hidden');
    downloadSection.classList.add('hidden');
    progressArea.classList.add('hidden');
    progressFill.style.width = '0%';
    fileInput.value = '';
    imageList.innerHTML = '';
}