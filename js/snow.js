(() => {
  const isMobile = /(phone|pad|pod|iphone|ipod|ios|ipad|android|mobile|blackberry|iemobile|mqqbrowser|juc|fennec|wosbrowser|browserng|webos|symbian|windows phone)/i.test(
    navigator.userAgent
  )

  if (isMobile) return

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) return

  const initSnow = () => {
    const canvas = document.getElementById('snow')
    if (!canvas) return

    if (window.__snowEffectCleanup) {
      window.__snowEffectCleanup()
    }

    const context = canvas.getContext('2d')
    if (!context) return

    let width = 0
    let height = 0
    let animationId = 0
    let pointerX = -9999
    let pointerY = -9999
    let flakes = []

    const baseConfig = {
      light: { count: 260, size: 2.55, speed: 1.75, opacity: 0.88 },
      dark: { count: 320, size: 2.75, speed: 1.95, opacity: 0.94 },
      repelDistance: 140
    }

    const currentTheme = () => document.documentElement.getAttribute('data-theme') || 'light'
    const randomBetween = (min, max) => Math.random() * (max - min) + min

    const createFlake = (spawnAtTop = false) => {
      const themeConfig = currentTheme() === 'dark' ? baseConfig.dark : baseConfig.light

      return {
        x: Math.random() * width,
        y: spawnAtTop ? randomBetween(-height * 0.2, 0) : Math.random() * height,
        radius: randomBetween(themeConfig.size * 0.55, themeConfig.size * 1.35),
        speed: randomBetween(themeConfig.speed * 0.7, themeConfig.speed * 1.4),
        opacity: randomBetween(themeConfig.opacity * 0.5, themeConfig.opacity),
        drift: randomBetween(0.15, 0.55),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: randomBetween(0.01, 0.035),
        vx: randomBetween(-0.2, 0.2),
        vy: randomBetween(themeConfig.speed * 0.7, themeConfig.speed * 1.2)
      }
    }

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

    const rebuildFlakes = () => {
      const themeConfig = currentTheme() === 'dark' ? baseConfig.dark : baseConfig.light
      flakes = Array.from({ length: themeConfig.count }, () => createFlake(false))
    }

    const recycleFlake = flake => {
      const nextFlake = createFlake(true)
      flake.x = nextFlake.x
      flake.y = nextFlake.y
      flake.radius = nextFlake.radius
      flake.speed = nextFlake.speed
      flake.opacity = nextFlake.opacity
      flake.drift = nextFlake.drift
      flake.wobble = nextFlake.wobble
      flake.wobbleSpeed = nextFlake.wobbleSpeed
      flake.vx = nextFlake.vx
      flake.vy = nextFlake.vy
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)

      flakes.forEach(flake => {
        const dx = pointerX - flake.x
        const dy = pointerY - flake.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1

        if (distance < baseConfig.repelDistance) {
          const force = (baseConfig.repelDistance - distance) / baseConfig.repelDistance
          flake.vx -= (dx / distance) * force * 0.04
          flake.vy -= (dy / distance) * force * 0.05
        }

        flake.wobble += flake.wobbleSpeed
        flake.vx *= 0.985
        flake.vy += (flake.speed - flake.vy) * 0.02
        flake.x += flake.vx + Math.sin(flake.wobble) * flake.drift
        flake.y += flake.vy

        if (flake.y > height + 8 || flake.x < -8 || flake.x > width + 8) {
          recycleFlake(flake)
        }

        context.beginPath()
        context.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`
        context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2)
        context.fill()
      })

      animationId = window.requestAnimationFrame(draw)
    }

    const handleResize = () => {
      resetCanvas()
      rebuildFlakes()
    }

    const handleMouseMove = event => {
      pointerX = event.clientX
      pointerY = event.clientY
    }

    const handleMouseLeave = () => {
      pointerX = -9999
      pointerY = -9999
    }

    const themeObserver = new MutationObserver(() => {
      rebuildFlakes()
    })

    resetCanvas()
    rebuildFlakes()
    draw()

    window.addEventListener('resize', handleResize)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    window.__snowEffectCleanup = () => {
      window.cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      themeObserver.disconnect()
      context.clearRect(0, 0, width, height)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSnow, { once: true })
  } else {
    initSnow()
  }
})()


