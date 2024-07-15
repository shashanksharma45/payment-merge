document.addEventListener("DOMContentLoaded", function () {
    const qrDropZone = document.getElementById("qr-drop-zone");
    const qrImageInput = document.getElementById("qr-image");
    const upiIdElement = document.getElementById("upi-id");
    const upiNameElement = document.getElementById("upi-name");
    const currencyElement = document.getElementById("currency");
    const amountElement = document.getElementById("amount");
    const copyButtons = document.querySelectorAll(".copy-btn");
    const combineButton = document.getElementById("combine-button");
    const screenSizeDropdownLaptop = document.getElementById("screen-size-dropdown-laptop");
    const paymentUiElement = document.getElementById("payment-ui");
    combineButton.addEventListener("click", combineAll);
    const recipientNameElement = document.getElementById("payment-upi-name");
    const recipientIdElement = document.getElementById("payment-upi-id");
    const paymentAmountElement = document.getElementById("payment-amount");
    const recipientIconElement = document.getElementById("recipient-icon");

    const newUpiNameInput = document.getElementById("new-upi-name");
    const copyPaymentBtn = document.getElementById("copy-payment-btn");

    let laptopImage = null;
    const laptopCanvas = document.getElementById("laptop-canvas");
    const measureSizeButton = document.getElementById("measure-size-button");
    const screenSizeInfo = document.getElementById("screen-size-info");
    const resultImage = document.getElementById("result-image");

combineButton.addEventListener("click", combineAll);
    copyButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-copy-target");
            const targetElement = document.getElementById(targetId);
            copyToClipboard(targetElement.textContent);
        });
    });

    function copyToClipboard(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    }

    qrDropZone.addEventListener("paste", (event) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                const imageData = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = () => {
                    const imageDataUrl = reader.result;
                    qrImageInput.src = imageDataUrl;
                    qrImageInput.style.display = 'block';
                    scanQrCode(imageDataUrl);
                };
                reader.readAsDataURL(imageData);
            }
        }
    });

    qrDropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    qrDropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        const imageData = event.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const imageDataUrl = reader.result;
            qrImageInput.src = imageDataUrl;
            qrImageInput.style.display = 'block';
            scanQrCode(imageDataUrl);
        };
        reader.readAsDataURL(imageData);
    });

    function scanQrCode(imageDataUrl) {
        const img = document.createElement("img");
        img.src = imageDataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (code) {
                const url = code.data;
                const urlObj = new URL(url);
                const urlParams = urlObj.searchParams;

                const upiId = urlParams.get('pa') || 'N/A';
                const upiName = urlParams.get('pn') || 'N/A';
                const currency = urlParams.get('cu') || 'N/A';
                const amount = urlParams.get('am') || 'N/A';

                upiIdElement.textContent = upiId;
                upiNameElement.textContent = upiName;
                currencyElement.textContent = currency;
                amountElement.textContent = amount;

                // Update payment UI
                recipientNameElement.textContent = upiName;
                recipientIdElement.textContent = upiId;
                paymentAmountElement.textContent = amount;

                // Update icon based on UPI name initials
                const initials = upiName.split(' ').map(word => word[0]).join('');
                recipientIconElement.textContent = initials;
            } else {
                console.error("QR code scan error");
            }
        };
    }

    document.querySelector(".update-button").addEventListener("click", () => {
        const newUpiName = newUpiNameInput.value.trim();
        if (newUpiName) {
            upiNameElement.textContent = newUpiName;
            recipientNameElement.textContent = newUpiName;

            // Update icon based on new UPI name initials
            const initials = newUpiName.split(' ').map(word => word[0]).join('');
            recipientIconElement.textContent = initials;
        }
    });

    copyPaymentBtn.addEventListener("click", () => {
        copyPaymentBtn.style.display = 'none';
        html2canvas(paymentUiElement, { backgroundColor: null, scale: 2 }).then(canvas => {
            copyPaymentBtn.style.display = 'block';
            canvas.toBlob(blob => {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]).then(() => {
                    alert("Payment screen copied to clipboard");
                }).catch(err => {
                    console.error("Could not copy image to clipboard", err);
                });
            });
        });
    });

    laptopCanvas.addEventListener("click", function() {
        selectCanvas(laptopCanvas);
    });

    document.addEventListener("paste", function(event) {
        const clipboardData = event.clipboardData;
        const items = clipboardData.items;
        if (items.length > 0) {
            const imageItem = Array.from(items).find(item => item.type.includes("image"));
            if (imageItem) {
                const imageFile = imageItem.getAsFile();
                const reader = new FileReader();
                reader.onload = function(event) {
                    const image = new Image();
                    image.onload = function() {
                        const focusedElement = document.activeElement;
                        if (focusedElement === laptopCanvas) {
                            laptopImage = image;
                            displayImage(laptopCanvas, image);
                        } else {
                            alert("Select the laptop canvas to paste the screenshot.");
                        }
                    };
                    image.src = event.target.result;
                };
                reader.readAsDataURL(imageFile);
            }
        }
    });

    combineButton.addEventListener("click", combineAll);
    measureSizeButton.addEventListener("click", measureScreenSize);

    function selectCanvas(canvas) {
        laptopCanvas.classList.remove('selected');
        canvas.classList.add('selected');
        canvas.focus();
    }

    function displayImage(canvas, image) {
        const ctx = canvas.getContext("2d");
        const aspectRatio = image.width / image.height;
        const maxWidth = canvas.clientWidth;
        const maxHeight = canvas.clientHeight;
        let newWidth, newHeight;

        if (aspectRatio > 1) {
            newWidth = maxWidth;
            newHeight = newWidth / aspectRatio;
        } else {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, newWidth, newHeight);
    }

    function measureScreenSize() {
        const laptopScreenSize = screenSizeDropdownLaptop.value.split('x');
        const laptopWidth = parseInt(laptopScreenSize[0]);
        const laptopHeight = parseInt(laptopScreenSize[1]);
        const laptopDiagonal = Math.sqrt(laptopWidth ** 2 + laptopHeight ** 2) / 96; // Assuming 96 DPI

        screenSizeInfo.innerHTML = `<strong>Your screen size: ${laptopDiagonal.toFixed(2)} " inches</strong>`;
    }

    function clearCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (canvasId === "laptop-canvas") {
            laptopImage = null;
        }
    }

    const removeButtons = document.querySelectorAll('.remove-button');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const canvasId = this.dataset.canvasId;
            clearCanvas(canvasId);
        });
    });

    function combineAll() {
        if (!laptopImage) {
            alert("Please paste a laptop screenshot first.");
            return;
        }

        const laptopScreenSize = screenSizeDropdownLaptop.value.split('x');
        const laptopCanvasSize = {
            width: parseInt(laptopScreenSize[0]),
            height: parseInt(laptopScreenSize[1])
        };

        html2canvas(paymentUiElement, { 
            backgroundColor: null, 
            scale: 2,
            ignoreElements: (element) => element.id === 'copy-payment-btn'
        }).then(paymentCanvas => {
            const resultCanvas = document.createElement('canvas');
            const ctx = resultCanvas.getContext('2d');

            // Set canvas size (both images will have the same height)
            const scaleFactor = laptopCanvasSize.height / paymentCanvas.height;
            const scaledPaymentWidth = paymentCanvas.width * scaleFactor;

            resultCanvas.width = laptopCanvasSize.width + scaledPaymentWidth;
            resultCanvas.height = laptopCanvasSize.height;

            // Draw laptop screenshot
            ctx.drawImage(laptopImage, 0, 0, laptopCanvasSize.width, laptopCanvasSize.height);

            // Draw payment UI next to the laptop screenshot, scaled to match height
            ctx.drawImage(paymentCanvas, laptopCanvasSize.width, 0, scaledPaymentWidth, laptopCanvasSize.height);

            // Copy to clipboard
            resultCanvas.toBlob(blob => {
                navigator.clipboard.write([new ClipboardItem({'image/png': blob})])
                    .then(() => {
                        console.log("Combined image copied to clipboard");
                        alert("Combined image copied to clipboard.");
                    })
                    .catch(err => {
                        console.error("Could not copy image to clipboard", err);
                        alert("Error copying to clipboard. See console for details.");
                    });
            }, 'image/png');
        }).catch(error => {
            console.error("Error creating combined image:", error);
            alert("Error creating combined image. Please try again.");
        });
    }
});