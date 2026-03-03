export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid CORS issues on export
        image.src = url;
    });

export function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation);

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * This function extracts the cropped portion of an image and returns it as a Base64 string.
 *
 * @param {String} imageSrc - Image File Object / Base64 string / URL
 * @param {Object} pixelCrop - crop dimensions from react-easy-crop
 * @param {Number} rotation - optional rotation in degrees
 * @param {Object} flip - optional flip object { horizontal, vertical }
 * @returns {Promise<String>} Base64 string of cropped area
 */
export default async function getCroppedImg(
    imageSrc,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
        return null;
    }

    // Calculate scaled dimensions (max 800x800 for profile photos)
    const MAX_SIZE = 800;
    let finalWidth = pixelCrop.width;
    let finalHeight = pixelCrop.height;

    if (finalWidth > MAX_SIZE || finalHeight > MAX_SIZE) {
        if (finalWidth > finalHeight) {
            finalHeight = Math.round((finalHeight * MAX_SIZE) / finalWidth);
            finalWidth = MAX_SIZE;
        } else {
            finalWidth = Math.round((finalWidth * MAX_SIZE) / finalHeight);
            finalHeight = MAX_SIZE;
        }
    }

    // Set the size of the cropped canvas
    croppedCanvas.width = finalWidth;
    croppedCanvas.height = finalHeight;

    // Draw the cropped image onto the new canvas scaled down
    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        finalWidth,
        finalHeight
    );

    // Return compressed Base64 string
    return new Promise((resolve) => {
        resolve(croppedCanvas.toDataURL('image/jpeg', 0.85));
    });
}
