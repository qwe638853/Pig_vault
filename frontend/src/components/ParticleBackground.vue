<template>
  <canvas id="canvas" class="particle-canvas"></canvas>
</template>

<script>
import { onMounted, onUnmounted } from 'vue';

export default {
  name: 'ParticleBackground',
  setup() {
    let cleanup;

    onMounted(() => {
      const canvas = document.getElementById('canvas');
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }

      cleanup = initParticles();
      console.log('Particle effect initialized');
    });

    onUnmounted(() => {
      if (cleanup) cleanup();
      console.log('Particle effect cleaned up');
    });

    function initParticles() {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d', { alpha: true, antialias: false });

      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      class Particle {
        constructor(x, y, color, size) {
          this.x = x;
          this.y = y;
          this.color = color;
          this.size = size;
          this.baseX = x;
          this.baseY = y;
          this.density = (Math.random() * 10) + 5;
        }

        draw() {
          ctx.fillStyle = 'rgba(147, 112, 219, 0.8)';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        }

        update() {
          if (mouse.x !== undefined && mouse.y !== undefined) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouse.radius) {
              let force = (mouse.radius - distance) / mouse.radius;
              let directionX = dx / distance;
              let directionY = dy / distance;

              this.x -= directionX * force;
              this.y -= directionY * force;
            }
          }

          this.x += Math.random() * 2 - 1.5;
          this.y += Math.random() * 2 - 1.5;

          let dx = this.x - this.baseX;
          let dy = this.y - this.baseY;
          this.x -= dx * 0.05;
          this.y -= dy * 0.05;
        }
      }

      const mouse = {
        x: undefined,
        y: undefined,
        radius: 50
      };

      let particleArray = [];

      function init() {
        particleArray = [];
        const image = new Image();
        image.src = '/pig.png';

        image.onload = function () {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');

          const maxWidth = canvas.width / dpr * 0.5;
          const maxHeight = canvas.height / dpr * 0.5;
          const aspectRatio = image.width / image.height;

          let imageWidth, imageHeight;
          if (aspectRatio > 1) {
            imageWidth = maxWidth;
            imageHeight = maxWidth / aspectRatio;
          } else {
            imageHeight = maxHeight;
            imageWidth = maxHeight * aspectRatio;
          }
          imageWidth = Math.floor(imageWidth);
          imageHeight = Math.floor(imageHeight);

          tempCanvas.width = imageWidth;
          tempCanvas.height = imageHeight;

          tempCtx.drawImage(image, 0, 0, imageWidth, imageHeight);

          const imageData = tempCtx.getImageData(0, 0, imageWidth, imageHeight);
          const data = imageData.data;

          const centerX = Math.floor((canvas.width / dpr - imageWidth) / 2);
          const centerY = Math.floor((canvas.height / dpr - imageHeight) / 2);
// 粒子距離
          const particleGap = 5;
          for (let y = 0; y < imageHeight; y += particleGap) {
            for (let x = 0; x < imageWidth; x += particleGap) {
              const i = (y * imageWidth + x) * 4;
              const alpha = data[i + 3];

              if (alpha > 128) {
                particleArray.push( //粒子大小
                  new Particle(centerX + x, centerY + y, 'white', 3)
                );
              }
              if (particleArray.length > 10000) break;
            }
            if (particleArray.length > 10000) break;
          }

          console.log(`生成了 ${particleArray.length} 個粒子`);
        };

        image.onerror = function () {
          console.error('圖片載入失敗');
        };
      }

      function animate() {
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        for (let i = 0; i < particleArray.length; i++) {
          particleArray[i].draw();
          particleArray[i].update();
        }

        requestAnimationFrame(animate);
      }

      const handleMouseMove = (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
      };

      const handleMouseLeave = () => {
        mouse.x = undefined;
        mouse.y = undefined;
      };

      const handleResize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        init();
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('resize', handleResize);

      init();
      animate();

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', handleResize);
      };
    }
  },
};
</script>

<style scoped>
.particle-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
  background: #000;
}

.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>