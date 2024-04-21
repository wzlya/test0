
const mobileMenu = document.getElementById("mobile-menu");
const navMenu = document.getElementById("nav-menu");

mobileMenu.addEventListener("click", function () {
  navMenu.classList.toggle("active");
});
const container = document.querySelector(".containerimg");
document.querySelector(".slider").addEventListener("input", (e) => {
  container.style.setProperty("--position", `${e.target.value}%`);
});



const images = document.querySelectorAll('.gallery img');

images.forEach(image => {
  image.addEventListener('mouseover', () => {
    const originalSrc = image.getAttribute('data-original-src');
    image.src = originalSrc.replace('.jpeg', 'e.jpeg').replace('.jpg', 'e.jpg');
  });

  image.addEventListener('mouseout', () => {
    image.src = image.getAttribute('data-original-src');
  });
});


// دالة لتحويل الصورة إلى رمادي
function rgbToGray(imageData) {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;     
      data[i + 1] = avg;  
      data[i + 2] = avg;   
  }

  return imageData;
}


function enhanceImageResolution(imageData) {
  let imageWidth = imageData.width;
  let imageHeight = imageData.height;
  let pixels = imageData.data;

  let kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
  ];

  let sharpenedPixels = [];

  for (let y = 0; y < imageHeight; y++) {
      for (let x = 0; x < imageWidth; x++) {
          let sumR = 0, sumG = 0, sumB = 0;

          for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                  let pixelX = x + kx;
                  let pixelY = y + ky;

                  if (pixelX >= 0 && pixelX < imageWidth && pixelY >= 0 && pixelY < imageHeight) {
                      let index = (pixelY * imageWidth + pixelX) * 4;
                      let kernelValue = kernel[ky + 1][kx + 1];

                      sumR += pixels[index] * kernelValue;
                      sumG += pixels[index + 1] * kernelValue;
                      sumB += pixels[index + 2] * kernelValue;
                  }
              }
          }

          let index = (y * imageWidth + x) * 4;
          sharpenedPixels[index] = Math.min(Math.max(sumR, 0), 255);
          sharpenedPixels[index + 1] = Math.min(Math.max(sumG, 0), 255);
          sharpenedPixels[index + 2] = Math.min(Math.max(sumB, 0), 255);
          sharpenedPixels[index + 3] = pixels[index + 3]; 
      }
  }

  let enhancedImageData = new ImageData(new Uint8ClampedArray(sharpenedPixels), imageWidth, imageHeight);
  return enhancedImageData;
}



function gaussianFilter(imageData, kernelSize = 3) {
 
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const kernel = [];
  const center = Math.floor(kernelSize / 2);
  const sigma = 1.0;

  for (let i = 0; i < kernelSize; i++) {
    kernel[i] = [];
    for (let j = 0; j < kernelSize; j++) {
      const distance = Math.pow(i - center, 2) + Math.pow(j - center, 2);
      kernel[i][j] = Math.exp(-distance / (2 * sigma * sigma));
    }
  }

  let sum = 0;
  for (let i = 0; i < kernelSize; i++) {
    for (let j = 0; j < kernelSize; j++) {
      sum += kernel[i][j];
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let newValue = 0;
      for (let i = 0; i < kernelSize; i++) {
        for (let j = 0; j < kernelSize; j++) {
          const offsetX = x + i - center;
          const offsetY = y + j - center;
          if (
            offsetX >= 0 &&
            offsetX < width &&
            offsetY >= 0 &&
            offsetY < height
          ) {
            const pixelIndex = (offsetY * width + offsetX) * 4;
            const kernelValue = kernel[i][j];
            newValue += data[pixelIndex] * kernelValue;
          }
        }
      }
      const pixelIndex = (y * width + x) * 4;
      data[pixelIndex] = newValue / sum;
      data[pixelIndex + 1] = newValue / sum;
      data[pixelIndex + 2] = newValue / sum;
    }
  }

  return imageData;
}

function adjustContrast(imageData, alpha, beta) {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let newValue = alpha * data[i] + beta;
    newValue = Math.min(Math.max(newValue, 0), 255);
    data[i] = newValue;
    data[i + 1] = newValue;
    data[i + 2] = newValue;
  }

  return imageData;
}

function histogram(imageData) {
  const data = imageData.data;
  const histogram = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const intensity = data[i];
    histogram[intensity]++;
  }

  return histogram;
}

function normalizedHistogram(hist, width, height) {
  const normalizedHist = [];
  const totalPixels = width * height;

  for (let i = 0; i < 256; i++) {
    normalizedHist.push(hist[i] / totalPixels);
  }

  return normalizedHist;
}

function otsu(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const hist = histogram(imageData);
  const nhist = normalizedHistogram(hist, width, height);

  let vmax = 0;
  let tmax = 1;

  for (let t = 1; t < 256; t++) {
    let q1 = 0;
    for (let i = 0; i < t; i++) {
      q1 += nhist[i];
    }
    let q2 = 1 - q1;

    let u1 = 0;
    for (let i = 0; i < t; i++) {
      u1 += i * nhist[i];
    }
    u1 /= q1;

    let u2 = 0;
    for (let i = t; i < 256; i++) {
      u2 += i * nhist[i];
    }
    u2 /= q2;

    let vb = q1 * q2 * (u1 - u2) * (u1 - u2);
    if (vb > vmax) {
      vmax = vb;
      tmax = t;
    }
  }

  return tmax ;
}

function thresholdImage(imageData, tmax) {
  const data = imageData.data;
  const binaryImageData = new ImageData(imageData.width, imageData.height);

  for (let i = 0; i < data.length; i += 4) {
    const intensity = data[i];
    const binaryValue = intensity > tmax ? 255 : 0;

    binaryImageData.data[i] = binaryValue;
    binaryImageData.data[i + 1] = binaryValue;
    binaryImageData.data[i + 2] = binaryValue;
    binaryImageData.data[i + 3] = 255; 
  }

  return binaryImageData;
}


function displayImage(imageUrl) {
  let image = document.getElementById("image-after");
  image.src = imageUrl;
}

let fileInput = document.getElementById("file-upload");
fileInput.addEventListener("change", function (event) {
  let file = event.target.files[0];
  let reader = new FileReader();
  reader.onload = function () {
    let img = new Image();
    img.onload = function () {
      let canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let grayData = rgbToGray(imageData);

      let enhance = enhanceImageResolution(grayData);

      let gaussi = gaussianFilter(enhance);

      let alpha_value = 1.1;
      let beta_value = 15;
      let adjust =adjustContrast(gaussi, alpha_value, beta_value);
      let ou = otsu(adjust);
      let th = thresholdImage(adjust, ou);

      let grayCanvas = document.createElement("canvas");
      grayCanvas.width = canvas.width;
      grayCanvas.height = canvas.height;
      grayCanvas.getContext("2d").putImageData(th, 0, 0);
      let grayImageUrl = grayCanvas.toDataURL("image/png");
      console.log(grayImageUrl);
      displayImage(grayImageUrl);
    };
    img.src = reader.result;
    let image = document.getElementById("image-before");
    image.src = reader.result;

    const hiddenContent = document.getElementById("hiddenContent");
    if (hiddenContent.style.display === "none") {
      hiddenContent.style.display = "block";
      this.textContent = "Hide Content";
    } else {
      hiddenContent.style.display = "none";
      this.textContent = "Show Content";
    }
    window.scrollTo(0, document.body.scrollHeight);
  };
  reader.readAsDataURL(file);
});

// Function to download the grayscale image
function downloadImage() {
  let imageAfter = document.getElementById("image-after");
  let downloadLink = document.createElement("a");
  downloadLink.href = imageAfter.src;
  downloadLink.download = "grayscale_image.png";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Add event listener to the download button
document.getElementById("download-btn").addEventListener("click", function () {
  downloadImage();
});

