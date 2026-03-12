(() => {
  const isMobile = /(phone|pad|pod|iphone|ipod|ios|ipad|android|mobile|blackberry|iemobile|mqqbrowser|juc|fennec|wosbrowser|browserng|webos|symbian|windows phone)/i.test(
    navigator.userAgent
  )

  if (isMobile) return

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) return

  const canvas = document.getElementById('universe')
  if (!canvas) return

  if (window.__universeEffectCleanup) {
    window.__universeEffectCleanup()
  }

  const context = canvas.getContext('2d')
  if (!context) return

  let width = 0
  let height = 0
  let animationId = 0
  let hidden = document.hidden
  let particles = []

  const colors = {
    giant: '180,184,240',
    star: '226,225,142',
    comet: '226,225,224'
  }

  const randomBetween = (min, max) => Math.random() * (max - min) + min
  const chance = value => Math.floor(Math.random() * 1000) + 1 < value * 10
  const isDarkMode = () => document.documentElement.getAttribute('data-theme') === 'dark'

  const resetCanvas = () => {
    const dpr = window.devicePixelRatio || 1
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const createParticle = () => {
    const giant = chance(3)
    const comet = !giant && chance(10)
    const speed = 0.05

    return {
      giant,
      comet,
      x: randomBetween(0, Math.max(width - 10, 1)),
      y: randomBetween(0, Math.max(height, 1)),
      radius: randomBetween(1.1, 2.6),
      dx: randomBetween(speed, 6 * speed) + (comet ? speed * randomBetween(50, 120) : 0) + 2 * speed,
      dy: -randomBetween(speed, 6 * speed) - (comet ? speed * randomBetween(50, 120) : 0),
      opacity: 0,
      opacityThreshold: randomBetween(0.2, comet ? 0.6 : 1),
      opacityDelta: randomBetween(0.0005, 0.002) + (comet ? 0.001 : 0),
      fadingIn: true,
      fadingOut: false
    }
  }

  const rebuildParticles = () => {
    const count = Math.max(36, Math.min(96, Math.floor(width * 0.08)))
    particles = Array.from({ length: count }, createParticle)
  }

  const resetParticle = particle => {
    Object.assign(particle, createParticle())
  }

  const drawParticle = particle => {
    context.beginPath()

    if (particle.giant) {
      context.fillStyle = `rgba(${colors.giant},${particle.opacity})`
      context.arc(particle.x, particle.y, 2, 0, Math.PI * 2, false)
    } else if (particle.comet) {
      context.fillStyle = `rgba(${colors.comet},${particle.opacity})`
      context.arc(particle.x, particle.y, 1.5, 0, Math.PI * 2, false)
      for (let index = 0; index < 24; index += 1) {
        context.fillStyle = `rgba(${colors.comet},${particle.opacity - (particle.opacity / 24) * index})`
        context.fillRect(particle.x - (particle.dx / 4) * index, particle.y - (particle.dy / 4) * index - 2, 2, 2)
      }
    } else {
      context.fillStyle = `rgba(${colors.star},${particle.opacity})`
      context.fillRect(particle.x, particle.y, particle.radius, particle.radius)
    }

    context.closePath()
    context.fill()
  }

  const updateParticle = particle => {
    particle.x += particle.dx
    particle.y += particle.dy

    if (particle.fadingIn) {
      particle.opacity += particle.opacityDelta
      if (particle.opacity > particle.opacityThreshold) {
        particle.fadingIn = false
      }
    } else if (particle.fadingOut) {
      particle.opacity -= particle.opacityDelta / 2
      if (particle.opacity < 0) {
        resetParticle(particle)
      }
    }

    if (particle.x > width - width / 4 || particle.y < 0) {
      particle.fadingOut = true
    }

    if (particle.x > width || particle.y < -10) {
      resetParticle(particle)
    }
  }

  const stop = () => {
    if (animationId) {
      window.cancelAnimationFrame(animationId)
      animationId = 0
    }
    context.clearRect(0, 0, width, height)
  }

  const render = () => {
    if (!isDarkMode() || hidden) {
      stop()
      return
    }

    context.clearRect(0, 0, width, height)
    particles.forEach(particle => {
      updateParticle(particle)
      drawParticle(particle)
    })
    animationId = window.requestAnimationFrame(render)
  }

  const start = () => {
    if (!animationId) {
      render()
    }
  }

  const handleResize = () => {
    resetCanvas()
    rebuildParticles()
    if (isDarkMode() && !hidden) {
      start()
    }
  }

  const handleVisibilityChange = () => {
    hidden = document.hidden
    if (isDarkMode() && !hidden) start()
    else stop()
  }

  const themeObserver = new MutationObserver(() => {
    if (isDarkMode() && !hidden) {
      rebuildParticles()
      start()
    } else {
      stop()
    }
  })

  resetCanvas()
  rebuildParticles()
  if (isDarkMode() && !hidden) {
    start()
  }

  window.addEventListener('resize', handleResize)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })

  window.__universeEffectCleanup = () => {
    stop()
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    themeObserver.disconnect()
  }
})()
