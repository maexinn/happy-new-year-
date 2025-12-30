// Lightweight confetti implementation using a canvas overlay.
// Exposes spawnConfetti(x, y, opts) globally. Works on desktop and mobile (Android/iOS).
(function(){
  const colors = [
    '#ff3b81','#ffb86b','#ffd166','#4ade80','#60a5fa','#a78bfa'
  ];

  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let DPR = Math.max(1, window.devicePixelRatio || 1);
  function resize(){
    DPR = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * DPR);
    canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Particle pool
  const particles = [];
  const maxParticles = 800;

  function rand(min, max){ return Math.random()*(max-min)+min }

  function createParticle(x,y){
    return {
      x: x,
      y: y,
      vx: rand(-6,6),
      vy: rand(-12,-4),
      size: rand(6,14),
      life: rand(60,120),
      hue: colors[Math.floor(Math.random()*colors.length)],
      tilt: rand(-0.5,0.5),
      rotation: rand(0,Math.PI*2),
      angularVelocity: rand(-0.2,0.2),
      drag: 0.99,
      gravity: 0.35
    };
  }

  function spawnConfetti(x, y, opts){
    opts = opts || {};
    const count = opts.count || Math.floor(rand(18,34));
    for(let i=0;i<count;i++){
      if(particles.length >= maxParticles) break;
      const p = createParticle(x, y);
      // give a directional bias based on optional angle
      if(opts.angle !== undefined){
        const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        p.vx = Math.cos(opts.angle)*speed;
        p.vy = Math.sin(opts.angle)*speed;
      }
      particles.push(p);
    }
  }

  // Expose globally
  window.spawnConfetti = spawnConfetti;

  // Animation
  let last = performance.now();
  function step(now){
    const dt = Math.min(40, now - last);
    last = now;
    // clear
    ctx.clearRect(0,0,canvas.width, canvas.height);

    for(let i = particles.length-1; i >= 0; i--){
      const p = particles[i];
      // physics
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity * (dt/16.67);
      p.x += p.vx * (dt/16.67);
      p.y += p.vy * (dt/16.67);
      p.rotation += p.angularVelocity * (dt/16.67);
      p.life -= dt/3;

      // draw as rotated rectangle to look like paper
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const alpha = Math.max(0, Math.min(1, p.life/100));
      ctx.fillStyle = p.hue;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
      ctx.restore();

      // remove if offscreen or dead
      if(p.life <= 0 || p.y > window.innerHeight + 60 || p.x < -100 || p.x > window.innerWidth + 100){
        particles.splice(i,1);
      }
    }

    // keep animating while there are particles
    if(particles.length > 0) requestAnimationFrame(step);
  }

  // Start empty loop so canvas stays ready but doesn't burn CPU
  let rafRunning = false;
  const startLoopIfNeeded = function(){
    if(!rafRunning){
      rafRunning = true;
      last = performance.now();
      requestAnimationFrame(function loop(now){
        step(now);
        if(particles.length>0) requestAnimationFrame(loop);
        else rafRunning = false;
      });
    }
  };

  // Wrap spawn to make sure animation loop runs
  const origSpawn = spawnConfetti;
  window.spawnConfetti = function(x,y,opts){
    origSpawn(x,y,opts);
    startLoopIfNeeded();
  };

  // For convenience, support taps on mobile with coordinates from event
  // (The page script will call spawnConfetti directly.)
})();
