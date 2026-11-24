// ============================================================
// 深空雷达 3D 背景（three.js 原生封装，无 R3F 依赖）
// ============================================================
// 场景构成（呼应产品名「校招雷达」）：
//   1. 星域粒子：远距离缓慢漂移的机会星点（青/蓝/白三色混合）
//   2. 雷达扫描盘：极坐标网格环 + 辐条 + 着色器扫掠光扇（右上角）
//   3. 线框穹顶：大尺度低透明度二十面体线框，营造指挥舱纵深
// 交互：鼠标视差（相机轻微跟随），无任何业务耦合，纯装饰层。
//
// 性能与兼容性约定：
//   - 原生 three + useEffect 挂载，由 /board 页 dynamic(ssr:false) 引入；
//   - DPR 上限 2，粒子数固定 420（中端机可跑满帧）；
//   - prefers-reduced-motion：只渲染单帧静态画面，不启动循环；
//   - 页签隐藏时跳过渲染（rAF 继续空转但零 GPU 开销）；
//   - 卸载时完整释放 geometry/material/GPU 上下文。
// ============================================================
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function RadarScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ---------- 基础三件套 ----------
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 0, 9)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true, // 透明背景：深空底色与氛围光晕交给 CSS 层
        powerPreference: 'low-power',
      })
    } catch {
      // WebGL 不可用（老设备/驱动被禁）：静默降级为纯 CSS 背景
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const disposables: { dispose(): void }[] = []
    const track = <T extends { dispose(): void }>(x: T): T => {
      disposables.push(x)
      return x
    }

    // ---------- 1. 星域粒子 ----------
    const STAR_COUNT = 420
    const starGeometry = track(new THREE.BufferGeometry())
    {
      const positions = new Float32Array(STAR_COUNT * 3)
      const colors = new Float32Array(STAR_COUNT * 3)
      const palette = [
        new THREE.Color('#e8ecf6'), // 星白
        new THREE.Color('#75e6ed'), // 品牌青
        new THREE.Color('#3d6bff'), // 电光蓝
      ]
      for (let i = 0; i < STAR_COUNT; i++) {
        // 分布在相机前方的球壳内，避开正中心遮挡内容
        const radius = 7 + Math.random() * 9
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7
        positions[i * 3 + 2] = -Math.abs(radius * Math.cos(phi)) - 2
        const color = palette[(Math.random() * palette.length) | 0]
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }
      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }
    const starMaterial = track(
      new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    )
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    // ---------- 2. 雷达扫描盘（极坐标网格 + 着色器扫掠扇） ----------
    const radarGroup = new THREE.Group()
    const RADAR_RADIUS = 2.6

    // 同心环：四圈 LineLoop
    const ringMaterial = track(
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#75e6ed'),
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    )
    for (const ratio of [0.25, 0.5, 0.75, 1]) {
      const seg = 96
      const points: THREE.Vector3[] = []
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2
        points.push(
          new THREE.Vector3(
            Math.cos(a) * RADAR_RADIUS * ratio,
            Math.sin(a) * RADAR_RADIUS * ratio,
            0,
          ),
        )
      }
      const ringGeometry = track(new THREE.BufferGeometry().setFromPoints(points))
      radarGroup.add(new THREE.Line(ringGeometry, ringMaterial))
    }

    // 辐条：12 根 LineSegments
    {
      const spokePoints: THREE.Vector3[] = []
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        spokePoints.push(new THREE.Vector3(0, 0, 0))
        spokePoints.push(
          new THREE.Vector3(
            Math.cos(a) * RADAR_RADIUS,
            Math.sin(a) * RADAR_RADIUS,
            0,
          ),
        )
      }
      const spokeGeometry = track(new THREE.BufferGeometry().setFromPoints(spokePoints))
      const spokeMaterial = track(
        new THREE.LineBasicMaterial({
          color: new THREE.Color('#75e6ed'),
          transparent: true,
          opacity: 0.07,
          depthWrite: false,
        }),
      )
      radarGroup.add(new THREE.LineSegments(spokeGeometry, spokeMaterial))
    }

    // 中心点：小实心圆
    {
      const dotGeometry = track(new THREE.CircleGeometry(0.055, 24))
      const dotMaterial = track(
        new THREE.MeshBasicMaterial({
          color: new THREE.Color('#75e6ed'),
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      )
      radarGroup.add(new THREE.Mesh(dotGeometry, dotMaterial))
    }

    // 扫掠光扇：CircleGeometry + 自定义着色器（角度衰减拖尾）
    const sweepUniforms = {
      uAngle: { value: 0 },
      uColor: { value: new THREE.Color('#75e6ed') },
    }
    const sweepMaterial = track(
      new THREE.ShaderMaterial({
        uniforms: sweepUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uAngle;
          uniform vec3 uColor;
          varying vec2 vUv;
          const float PI = 3.141592653589793;
          void main() {
            vec2 p = vUv - 0.5;
            float dist = length(p) * 2.0;               // 0 中心 → 1 外缘
            float ang = atan(p.y, p.x);                 // -PI..PI
            float delta = mod(uAngle - ang, 2.0 * PI);  // 扫掠线后方的拖尾角度
            float trail = exp(-delta * 2.6);            // 指数衰减拖尾
            float rim = smoothstep(1.0, 0.86, dist);    // 外缘渐隐
            float core = smoothstep(0.0, 0.08, dist);   // 中心让位给实心点
            float glow = trail * rim * core * 0.55;
            gl_FragColor = vec4(uColor, glow);
          }
        `,
      }),
    )
    const sweepGeometry = track(new THREE.CircleGeometry(RADAR_RADIUS, 96))
    radarGroup.add(new THREE.Mesh(sweepGeometry, sweepMaterial))

    scene.add(radarGroup)

    // ---------- 3. 线框穹顶 ----------
    const domeGeometry = track(new THREE.IcosahedronGeometry(5.6, 1))
    const domeMaterial = track(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#3d6bff'),
        wireframe: true,
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
      }),
    )
    const dome = new THREE.Mesh(domeGeometry, domeMaterial)
    dome.position.set(0, 0.4, -3)
    scene.add(dome)

    // ---------- 布局：雷达盘贴右上角，随视口自适应 ----------
    const root = container
    function layoutRadar() {
      const width = root.clientWidth
      const height = root.clientHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()

      // 可视视锥在雷达平面(z=0)处的半宽/半高
      const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
      const halfW = halfH * camera.aspect
      const scale = Math.min(1, (halfW * 2) / 14) // 窄屏整体缩放
      radarGroup.scale.setScalar(scale)
      radarGroup.position.set(halfW * 0.66, halfH * 0.52, 0)
    }
    layoutRadar()
    const onResize = () => layoutRadar()
    window.addEventListener('resize', onResize)

    // ---------- 鼠标视差：相机朝指针方向轻移 ----------
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const pointer = { x: 0, y: 0 }
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    if (!reducedMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
    }

    // ---------- 渲染循环 ----------
    const clock = new THREE.Clock()
    const SWEEP_SPEED = 0.9 // 弧度/秒，一次巡天约 7 秒
    let documentHidden = document.hidden
    const onVisibility = () => {
      documentHidden = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)

    function renderFrame(elapsed: number) {
      sweepUniforms.uAngle.value = (elapsed * SWEEP_SPEED) % (Math.PI * 2)
      stars.rotation.y = elapsed * 0.008
      stars.rotation.z = elapsed * 0.003
      dome.rotation.y = elapsed * 0.02
      dome.rotation.x = elapsed * 0.008
      // 相机视差（lerp 到位，帧率无关）
      const t = Math.min(clock.getDelta() * 4, 1)
      camera.position.x += (pointer.x * 0.4 - camera.position.x) * t
      camera.position.y += (pointer.y * 0.25 - camera.position.y) * t
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }

    if (reducedMotion) {
      // 静态降级：单帧画面，无动画
      renderFrame(0)
    } else {
      renderer.setAnimationLoop(() => {
        if (documentHidden) return // 页签隐藏：零 GPU 开销
        renderFrame(clock.getElapsedTime())
      })
    }

    // ---------- 卸载清理 ----------
    return () => {
      renderer.setAnimationLoop(null)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      for (const d of disposables) d.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      // 层叠约定：DOM 顺序位于氛围光晕层之后、内容层(z-10)之前，无需 z-index
    />
  )
}
