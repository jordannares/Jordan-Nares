export interface ParticleImageData {
  positions: Float32Array;
  startPositions: Float32Array;
  sizes: Float32Array;
  brightness: Float32Array;
  seeds: Float32Array;
  count: number;
  aspect: number;
}

export function extractParticleImageData(
  image: HTMLImageElement,
  step: number,
  maxParticles: number,
): ParticleImageData {
  if (!Number.isFinite(step) || step < 1) {
    throw new RangeError("Particle sampling step must be a positive number.");
  }
  if (!Number.isFinite(maxParticles) || maxParticles < 1) {
    throw new RangeError("Maximum particle count must be a positive number.");
  }

  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) {
    throw new Error("The portrait image has no intrinsic dimensions.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Could not create a 2D context for portrait sampling.");
  }

  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const luminance = new Float32Array(width * height);
  for (let index = 0; index < luminance.length; index += 1) {
    const pixel = index * 4;
    luminance[index] =
      (pixels[pixel] * 0.2126 +
        pixels[pixel + 1] * 0.7152 +
        pixels[pixel + 2] * 0.0722) /
      255;
  }

  const positions: number[] = [];
  const startPositions: number[] = [];
  const sizes: number[] = [];
  const brightness: number[] = [];
  const seeds: number[] = [];
  const aspect = width / height;
  const particleLimit = Math.max(1, Math.floor(maxParticles));
  const requestedStep = Math.max(1, Math.floor(step));
  const sampleStep = Math.max(
    requestedStep,
    Math.ceil(Math.sqrt((width * height) / (particleLimit * 0.8))),
  );
  const sampleAt = (x: number, y: number, edge: number) => {
    const light = luminance[y * width + x];
    if (light < 0.035 && edge < 0.055) return;

    const value = Math.max(0, Math.min(1, (light - 0.025) * 1.35));
    const detail = Math.min(edge, 0.35);
    const seed = Math.random();
    const jitter = sampleStep * 0.34;
    const u = Math.max(
      0,
      Math.min(
        1,
        (x + (Math.random() - 0.5) * jitter) / Math.max(1, width - 1),
      ),
    );
    const v = Math.max(
      0,
      Math.min(
        1,
        (y + (Math.random() - 0.5) * jitter) / Math.max(1, height - 1),
      ),
    );

    positions.push(
      (u - 0.5) * aspect,
      0.5 - v,
      (value - 0.35) * 0.16 + detail * 0.1 + (seed - 0.5) * 0.012,
    );
    startPositions.push(
      (Math.random() - 0.5) * aspect * 2.8,
      (Math.random() - 0.5) * 2.4,
      (Math.random() - 0.5) * 2.2,
    );
    sizes.push(1.05 + Math.pow(value, 0.82) * 1.75 + detail * 1.7);
    brightness.push(value);
    seeds.push(seed);
  };
  const luminanceAt = (x: number, y: number) =>
    luminance[Math.min(height - 1, y) * width + Math.min(width - 1, x)];

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const horizontal = Math.abs(
        luminanceAt(Math.min(width - 1, x + sampleStep), y) -
          luminanceAt(Math.max(0, x - sampleStep), y),
      );
      const vertical = Math.abs(
        luminanceAt(x, Math.min(height - 1, y + sampleStep)) -
          luminanceAt(x, Math.max(0, y - sampleStep)),
      );
      const edge = (horizontal + vertical) * 0.5;
      sampleAt(x, y, edge);

      if (edge > 0.14 && sampleStep > 2) {
        const detailX = Math.min(width - 1, x + Math.floor(sampleStep / 2));
        const detailY = Math.min(height - 1, y + Math.floor(sampleStep / 2));
        sampleAt(detailX, detailY, edge);
      }
    }
  }

  let finalPositions = new Float32Array(positions);
  let finalStartPositions = new Float32Array(startPositions);
  let finalSizes = new Float32Array(sizes);
  let finalBrightness = new Float32Array(brightness);
  let finalSeeds = new Float32Array(seeds);
  if (sizes.length > particleLimit) {
    finalPositions = new Float32Array(particleLimit * 3);
    finalStartPositions = new Float32Array(particleLimit * 3);
    finalSizes = new Float32Array(particleLimit);
    finalBrightness = new Float32Array(particleLimit);
    finalSeeds = new Float32Array(particleLimit);

    for (let index = 0; index < particleLimit; index += 1) {
      const sourceIndex = Math.floor((index * sizes.length) / particleLimit);
      for (let axis = 0; axis < 3; axis += 1) {
        finalPositions[index * 3 + axis] = positions[sourceIndex * 3 + axis];
        finalStartPositions[index * 3 + axis] =
          startPositions[sourceIndex * 3 + axis];
      }
      finalSizes[index] = sizes[sourceIndex];
      finalBrightness[index] = brightness[sourceIndex];
      finalSeeds[index] = seeds[sourceIndex];
    }
  }

  return {
    positions: finalPositions,
    startPositions: finalStartPositions,
    sizes: finalSizes,
    brightness: finalBrightness,
    seeds: finalSeeds,
    count: finalSizes.length,
    aspect,
  };
}
