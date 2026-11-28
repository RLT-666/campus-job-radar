'use client'

// 背景动效：shader 流体渐变（方案一）+ 粒子点阵（方案二）+ 3D 丝带（方案三）。
// 单一 WebGLRenderer 分层渲染；静态 CSS 背景保留作首屏与 WebGL 失败回退。
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const bgVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// 色块锚点/半径/透明度与静态 CSS 渐变一致，仅叠加时间漂移与呼吸
const bgFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;

  float blob(vec2 uv, vec2 c, vec2 r, float soft) {
    float d = length((uv - c) / r);
    return clamp(1.0 - d / soft, 0.0, 1.0);
  }

  void main() {
    float t = uTime * 0.05;
    vec2 uv = vUv;
    uv += 0.008 * vec2(sin(uv.y * 8.0 + t * 2.0), cos(uv.x * 8.0 + t * 1.6));
    vec2 drift = uMouse * 0.03;

    vec3 col = vec3(0.933, 0.957, 0.992); // #eef4fd

    // 左上淡蓝
    vec2 c = vec2(0.0, 1.0) + vec2(sin(t * 0.7), cos(t * 0.6)) * 0.02 + drift;
    col = mix(col, vec3(0.620, 0.761, 0.980), 0.60 * blob(uv, c, vec2(0.46, 0.56), 0.70));
    // 右上淡蓝
    c = vec2(1.0, 1.0) + vec2(cos(t * 0.5), sin(t * 0.8)) * 0.02 + drift;
    col = mix(col, vec3(0.659, 0.796, 0.988), 0.65 * blob(uv, c, vec2(0.44, 0.54), 0.70));
    // 底部中央淡青
    c = vec2(0.45, 0.0) + vec2(sin(t * 0.6), 0.0) * 0.03 + drift;
    col = mix(col, vec3(0.588, 0.882, 0.922), 0.50 * blob(uv, c, vec2(0.42, 0.46), 0.70));
    // 右下蓝
    c = vec2(1.0, 0.08) + vec2(cos(t * 0.4), sin(t * 0.7)) * 0.025 + drift;
    col = mix(col, vec3(0.392, 0.549, 0.961), 0.95 * (0.92 + 0.08 * sin(t * 2.0)) * blob(uv, c, vec2(0.60, 0.92), 0.68));
    // 左下紫
    c = vec2(0.10, 0.14) + vec2(sin(t * 0.9), cos(t * 0.5)) * 0.025 + drift;
    col = mix(col, vec3(0.667, 0.490, 0.961), 0.90 * blob(uv, c, vec2(0.52, 0.62), 0.66));
    // 左下青绿
    c = vec2(0.0, 0.0) + vec2(cos(t * 0.6), sin(t * 0.9)) * 0.02 + drift;
    col = mix(col, vec3(0.431, 0.910, 0.784), 0.95 * blob(uv, c, vec2(0.46, 0.56), 0.65));
    // 中部淡紫
    c = vec2(0.38, 0.55) + drift;
    col = mix(col, vec3(0.804, 0.765, 0.980), 0.28 * blob(uv, c, vec2(0.40, 0.50), 0.70));
    // 中央留白
    c = vec2(0.45, 0.62) + drift * 0.5;
    col = mix(col, vec3(1.0), 0.60 * blob(uv, c, vec2(0.55, 0.65), 0.72));

    gl_FragColor = vec4(col, 1.0);
  }
`

const ribbonVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying float vFade;
  void main() {
    vec3 p = position;
    p.y += sin(p.x * 2.5 + uTime * 0.4) * uAmp + sin(p.x * 5.0 - uTime * 0.25) * uAmp * 0.5;
    vFade = 1.0 - abs(uv.y - 0.5) * 2.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const ribbonFragment = /* glsl */ `
  precision mediump float;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, uOpacity * vFade);
  }
`

export default function AnimatedBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      // WebGL 不可用：不挂 canvas，静态 CSS 背景继续生效
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.autoClear = false
    renderer.domElement.style.display = 'block'
    host.appendChild(renderer.domElement)

    // 背景渐变：独立 scene + 全屏 quad
    const bgScene = new THREE.Scene()
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const bgMaterial = new THREE.ShaderMaterial({
      vertexShader: bgVertex,
      fragmentShader: bgFragment,
      uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } },
      depthTest: false,
      depthWrite: false,
    })
    const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial)
    bgScene.add(bgQuad)

    // 粒子 + 丝带：主 scene，正交相机按宽高比适配
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.z = 5

    // 粒子点阵：上浮 + 呼吸 + 鼠标推开回弹；base 坐标与渲染坐标分离
    const count = Math.min(900, Math.max(260, Math.floor(host.clientWidth / 1.6)))
    const positions = new Float32Array(count * 3)
    const baseX = new Float32Array(count)
    const baseY = new Float32Array(count)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)
    const offsets = new Float32Array(count * 2)
    const aspect0 = host.clientWidth / Math.max(host.clientHeight, 1)
    for (let i = 0; i < count; i++) {
      baseX[i] = (Math.random() * 2 - 1) * aspect0
      baseY[i] = Math.random() * 2 - 1
      positions[i * 3] = baseX[i]
      positions[i * 3 + 1] = baseY[i]
      positions[i * 3 + 2] = 0
      speeds[i] = 0.025 + Math.random() * 0.06
      phases[i] = Math.random() * Math.PI * 2
    }
    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x7f9ccb,
      size: 3,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.62,
      depthTest: false,
      depthWrite: false,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    particles.renderOrder = 2
    scene.add(particles)

    // 3D 丝带：顶点正弦起伏，上下边缘渐隐
    const ribbonMaterials: THREE.ShaderMaterial[] = []
    const ribbonGeometry = new THREE.PlaneGeometry(7, 0.09, 160, 1)
    const ribbons = [
      { y: -0.6, opacity: 0.5, amp: 0.045 },
      { y: -0.74, opacity: 0.28, amp: 0.06 },
    ].map(({ y, opacity, amp }) => {
      const material = new THREE.ShaderMaterial({
        vertexShader: ribbonVertex,
        fragmentShader: ribbonFragment,
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: amp },
          uOpacity: { value: opacity },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(ribbonGeometry, material)
      mesh.position.y = y
      mesh.renderOrder = 3
      scene.add(mesh)
      ribbonMaterials.push(material)
      return mesh
    })

    const mouse = new THREE.Vector2()
    const mouseTarget = new THREE.Vector2()
    const pointer = { x: 0, y: 0, active: false }
    const onPointerMove = (event: PointerEvent) => {
      mouseTarget.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      )
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
    }
    // 指针移出窗口：粒子回弹、色块回中
    const onPointerLeave = () => {
      pointer.active = false
      mouseTarget.set(0, 0)
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)

    let width = host.clientWidth
    let height = host.clientHeight
    const resize = () => {
      width = host.clientWidth
      height = host.clientHeight
      if (!width || !height) return
      const aspect = width / height
      camera.left = -aspect
      camera.right = aspect
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(host)

    // 手动计时，避免 three 0.187 中已弃用的 THREE.Clock
    let last = performance.now()
    let raf = 0
    let elapsed = 0
    const frame = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05)
      last = now
      elapsed += delta
      mouse.lerp(mouseTarget, 0.07)
      bgMaterial.uniforms.uTime.value = elapsed
      bgMaterial.uniforms.uMouse.value.copy(mouse)
      camera.position.x = mouse.x * 0.03
      camera.position.y = mouse.y * 0.02

      const attr = particleGeometry.getAttribute('position') as THREE.BufferAttribute
      const aspect = width / Math.max(height, 1)
      const rect = host.getBoundingClientRect()
      const mwX = ((pointer.x - rect.left) / rect.width * 2 - 1) * aspect
      const mwY = -(((pointer.y - rect.top) / rect.height) * 2 - 1)
      const radius = 0.22
      for (let i = 0; i < count; i++) {
        baseY[i] += speeds[i] * delta
        if (baseY[i] > 1.05) baseY[i] = -1.05
        baseX[i] += Math.sin(elapsed * 0.3 + phases[i]) * delta * 0.02
        if (Math.abs(baseX[i]) > aspect + 0.05) baseX[i] = -aspect

        // 指针附近粒子被推开，离开后缓慢回弹
        let ox = offsets[i * 2]
        let oy = offsets[i * 2 + 1]
        if (pointer.active) {
          const dx = baseX[i] + ox - mwX
          const dy = baseY[i] + oy - mwY
          const d2 = dx * dx + dy * dy
          if (d2 < radius * radius) {
            const d = Math.sqrt(d2) || 0.0001
            const force = (1 - d / radius) * 1.1 * delta
            ox += (dx / d) * force
            oy += (dy / d) * force
          }
        }
        ox *= 0.94
        oy *= 0.94
        offsets[i * 2] = ox
        offsets[i * 2 + 1] = oy

        attr.setX(i, baseX[i] + ox)
        attr.setY(i, baseY[i] + oy)
      }
      attr.needsUpdate = true
      particleMaterial.opacity = 0.5 + 0.18 * Math.sin(elapsed * 0.6)
      for (const material of ribbonMaterials) material.uniforms.uTime.value = elapsed

      renderer.clear()
      renderer.render(bgScene, bgCamera)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      observer.disconnect()
      bgQuad.geometry.dispose()
      bgMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      ribbonGeometry.dispose()
      for (const material of ribbonMaterials) material.dispose()
      for (const mesh of ribbons) scene.remove(mesh)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />
}
