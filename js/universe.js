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
  let lastMeteorAt = 0
  let nextMeteorDelay = 0
  let stars = []
  let meteors = []

  const isDarkMode = () => document.documentElement.getAttribute('data-theme') === 'dark'
  const randomBetween = (min, max) => Math.random() * (max - min) + min
  const randomChoice = list => list[Math.floor(Math.random() * list.length)]
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const starPalette = [
    '255,255,255',
    '244,247,255',
    '230,237,255',
    '255,246,236'
  ]

  const meteorPalette = [
    '235,243,255',
    '248,251,255',
    '255,248,236'
  ]

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

  const createStar = () => {
    const bright = Math.random() < 0.05
    const size = bright ? randomBetween(0.95, 1.7) : randomBetween(0.28, 0.92)
    const baseAlpha = bright ? randomBetween(0.52, 0.86) : randomBetween(0.14, 0.72)
    const twinkleDepth = bright ? randomBetween(0.08, 0.18) : randomBetween(0.02, 0.08)

    return {
      x: randomBetween(0, Math.max(width, 1)),
      y: randomBetween(0, Math.max(height, 1)),
      size,
      bright,
      tint: randomChoice(starPalette),
      baseAlpha,
      alpha: baseAlpha,
      targetAlpha: baseAlpha,
      twinkleDepth,
      ease: bright ? randomBetween(0.028, 0.05) : randomBetween(0.012, 0.03),
      nextShiftAt: performance.now() + randomBetween(bright ? 300 : 900, bright ? 1800 : 4200),
      glow: bright ? randomBetween(2.8, 5.2) : randomBetween(0, 1.8)
    }
  }

  const createMeteor = () => {
    const startX = randomBetween(width * 0.58, width * 1.04)
    const startY = randomBetween(-height * 0.08, height * 0.18)
    const angle = randomBetween(2.48, 2.7)
    const speed = randomBetween(11.5, 16.5)

    return {
      x: startX,
      y: startY,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      length: randomBetween(110, 190),
      width: randomBetween(0.9, 1.6),
      alpha: randomBetween(0.72, 0.92),
      glow: randomBetween(4, 8),
      tint: randomChoice(meteorPalette)
    }
  }

  const rebuildScene = () => {
    const count = Math.max(180, Math.min(320, Math.floor(width * 0.19)))
    stars = Array.from({ length: count }, createStar)
    meteors = []
    lastMeteorAt = performance.now()
    nextMeteorDelay = randomBetween(3200, 7200)
  }

  const drawStar = (star, now) => {
    if (now >= star.nextShiftAt) {
      star.targetAlpha = clamp(
        star.baseAlpha + randomBetween(-star.twinkleDepth, star.twinkleDepth),
        star.bright ? 0.34 : 0.08,
        0.96
      )
      star.nextShiftAt = now + randomBetween(star.bright ? 280 : 900, star.bright ? 1800 : 4600)
    }

    star.alpha += (star.targetAlpha - star.alpha) * star.ease

    context.save()
    context.globalAlpha = star.alpha

    if (star.glow > 0.2) {
      const glow = context.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.glow)
      glow.addColorStop(0, `rgba(${star.tint},0.34)`)
      glow.addColorStop(0.4, `rgba(${star.tint},0.1)`)
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = glow
      context.beginPath()
      context.arc(star.x, star.y, star.glow, 0, Math.PI * 2)
      context.fill()
    }

    context.fillStyle = `rgba(${star.tint},1)`
    context.beginPath()
    context.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  const drawMeteor = meteor => {
    const tailX = meteor.x - meteor.dx * 7.5
    const tailY = meteor.y - meteor.dy * 7.5
    const gradient = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY)
    gradient.addColorStop(0, `rgba(${meteor.tint},${meteor.alpha})`)
    gradient.addColorStop(0.16, `rgba(${meteor.tint},${meteor.alpha * 0.34})`)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    context.save()
    context.strokeStyle = gradient
    context.lineWidth = meteor.width
    context.shadowBlur = meteor.glow
    context.shadowColor = `rgba(${meteor.tint},${meteor.alpha * 0.62})`
    context.beginPath()
    context.moveTo(meteor.x, meteor.y)
    context.lineTo(tailX, tailY)
    context.stroke()
    context.restore()
  }

  const updateMeteors = now => {
    if (now - lastMeteorAt >= nextMeteorDelay) {
      meteors.push(createMeteor())
      if (Math.random() < 0.18) {
        meteors.push(createMeteor())
      }
      lastMeteorAt = now
      nextMeteorDelay = randomBetween(3200, 7200)
    }

    meteors = meteors.filter(meteor => {
      meteor.x += meteor.dx
      meteor.y += meteor.dy
      meteor.alpha *= 0.993

      const active =
        meteor.alpha > 0.08 &&
        meteor.x > -meteor.length &&
        meteor.x < width + meteor.length &&
        meteor.y < height + meteor.length

      if (active) drawMeteor(meteor)
      return active
    })
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
    const now = performance.now()
    stars.forEach(star => drawStar(star, now))
    updateMeteors(now)
    animationId = window.requestAnimationFrame(render)
  }

  const start = () => {
    if (!animationId) render()
  }

  const handleResize = () => {
    resetCanvas()
    rebuildScene()
    if (isDarkMode() && !hidden) start()
  }

  const handleVisibilityChange = () => {
    hidden = document.hidden
    if (isDarkMode() && !hidden) start()
    else stop()
  }

  const themeObserver = new MutationObserver(() => {
    if (isDarkMode() && !hidden) {
      rebuildScene()
      start()
    } else {
      stop()
    }
  })

  resetCanvas()
  rebuildScene()
  if (isDarkMode() && !hidden) start()

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
