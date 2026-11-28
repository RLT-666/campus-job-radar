'use client'

// 方案四：局部 3D 雷达扫描。坐标系沿用静态 SVG 的 320x172 viewBox，
// 静态 RadarArt 始终渲染作回退，WebGL 初始化成功后淡出。
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import RadarArt from './RadarArt'

export default function Radar3D() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.display = 'block'
    host.appendChild(renderer.domElement)
    // 直接更新 DOM 隐藏静态回退图，避免在 effect 中 setState
    const fallback = host.parentElement?.querySelector<HTMLElement>('[data-radar-fallback]')
    if (fallback) fallback.style.opacity = '0'

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(0, 320, 172, 0, 0.1, 1000)
    camera.position.z = 500

    const disposables: Array<{ dispose: () => void }> = []
    const track = <T extends { dispose: () => void }>(resource: T): T => {
      disposables.push(resource)
      return resource
    }
    const basic = (color: number, opacity = 1) =>
      track(
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      )

    const CX = 146
    const CY = 172 - 96

    // 同心环
    const rings: Array<[number, string]> = [
      [66, '#d5e4fa'],
      [52, '#c2d7f8'],
      [38, '#a9c7f7'],
    ]
    for (const [radius, color] of rings) {
      const geometry = track(new THREE.RingGeometry(radius - 0.9, radius + 0.9, 96))
      const mesh = new THREE.Mesh(geometry, basic(new THREE.Color(color).getHex(), 0.95))
      mesh.position.set(CX, CY, 0)
      scene.add(mesh)
    }

    // 十字线
    const crossGeometry = track(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(CX, 172 - 30, 0),
        new THREE.Vector3(CX, 172 - 162, 0),
        new THREE.Vector3(80, CY, 0),
        new THREE.Vector3(212, CY, 0),
      ]),
    )
    const crossMaterial = track(new THREE.LineBasicMaterial({ color: 0xdbe8fc, transparent: true, opacity: 0.9 }))
    scene.add(new THREE.LineSegments(crossGeometry, crossMaterial))

    // 扫描扇区：绕中心匀速旋转
    const sectorGeometry = track(new THREE.CircleGeometry(66, 48, 0, Math.PI / 3))
    const sector = new THREE.Mesh(sectorGeometry, basic(0x4f82f6, 0.5))
    sector.position.set(CX, CY, 1)
    scene.add(sector)

    // 中心白环 + 蓝点
    const hub = new THREE.Mesh(track(new THREE.CircleGeometry(7, 32)), basic(0xffffff))
    hub.position.set(CX, CY, 2)
    scene.add(hub)
    const dot = new THREE.Mesh(track(new THREE.CircleGeometry(2.4, 24)), basic(0x3b6cf5))
    dot.position.set(CX, CY, 3)
    scene.add(dot)

    // 脉冲环：周期性从中心扩散并淡出
    const pulseMaterial = basic(0x3b6cf5, 0.5)
    const pulse = new THREE.Mesh(track(new THREE.RingGeometry(0.94, 1, 64)), pulseMaterial)
    pulse.position.set(CX, CY, 1.5)
    scene.add(pulse)

    // 信封：白色圆角方片 + 蓝色翻盖线，上下浮动
    const envelope = new THREE.Group()
    envelope.position.set(240, 172 - 42, 4)
    const badge = new THREE.Shape()
    const r = 10
    const s = 17
    badge.moveTo(-s + r, -s)
    badge.lineTo(s - r, -s)
    badge.quadraticCurveTo(s, -s, s, -s + r)
    badge.lineTo(s, s - r)
    badge.quadraticCurveTo(s, s, s - r, s)
    badge.lineTo(-s + r, s)
    badge.quadraticCurveTo(-s, s, -s, s - r)
    badge.lineTo(-s, -s + r)
    badge.quadraticCurveTo(-s, -s, -s + r, -s)
    envelope.add(new THREE.Mesh(track(new THREE.ShapeGeometry(badge)), basic(0xffffff, 0.98)))
    const envelopeLineMaterial = track(new THREE.LineBasicMaterial({ color: 0x4f7df6 }))
    const envelopeRect = track(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-12, 9, 1),
        new THREE.Vector3(12, 9, 1),
        new THREE.Vector3(12, -9, 1),
        new THREE.Vector3(-12, -9, 1),
        new THREE.Vector3(-12, 9, 1),
      ]),
    )
    envelope.add(new THREE.Line(envelopeRect, envelopeLineMaterial))
    const envelopeFlap = track(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-12, 9, 1),
        new THREE.Vector3(0, -1, 1),
        new THREE.Vector3(12, 9, 1),
      ]),
    )
    envelope.add(new THREE.Line(envelopeFlap, envelopeLineMaterial))
    scene.add(envelope)

    // 纸飞机：沿小圆弧缓慢漂移
    const planeShape = new THREE.Shape()
    planeShape.moveTo(0, -9)
    planeShape.lineTo(27, 0)
    planeShape.lineTo(17, -21)
    planeShape.lineTo(11, -12)
    planeShape.closePath()
    const plane = new THREE.Group()
    const planeGeometry = track(new THREE.ShapeGeometry(planeShape))
    plane.add(new THREE.Mesh(planeGeometry, basic(0xffffff, 0.96)))
    const planeOutline = track(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -9, 1),
        new THREE.Vector3(27, 0, 1),
        new THREE.Vector3(17, -21, 1),
        new THREE.Vector3(11, -12, 1),
        new THREE.Vector3(0, -9, 1),
      ]),
    )
    plane.add(new THREE.Line(planeOutline, track(new THREE.LineBasicMaterial({ color: 0x6f97ef }))))
    plane.position.set(258, 172 - 84, 5)
    plane.rotation.z = -0.2
    scene.add(plane)

    const resize = () => {
      const width = host.clientWidth
      const height = host.clientHeight
      if (width && height) renderer.setSize(width, height)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(host)

    // 悬停交互：移入加速扫描、脉冲更快、信封浮动加剧；移出平滑恢复
    const container = host.parentElement
    let hovering = false
    let speed = 0.5
    const onEnter = () => {
      hovering = true
    }
    const onLeave = () => {
      hovering = false
    }
    container?.addEventListener('pointerenter', onEnter)
    container?.addEventListener('pointerleave', onLeave)

    // 手动计时，避免 three 0.187 中已弃用的 THREE.Clock
    let last = performance.now()
    let raf = 0
    let elapsed = 0
    const frame = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05)
      last = now
      elapsed += delta
      speed += ((hovering ? 1.8 : 0.5) - speed) * 0.08
      sector.rotation.z -= delta * speed
      const period = hovering ? 1.6 : 2.8
      const p = (elapsed % period) / period
      pulse.scale.setScalar(8 + p * 58)
      pulseMaterial.opacity = (hovering ? 0.6 : 0.45) * (1 - p)
      envelope.position.y = 172 - 42 + Math.sin(elapsed * 1.1) * (hovering ? 6 : 4)
      plane.position.set(258 + Math.cos(elapsed * 0.4) * 8, 172 - 84 + Math.sin(elapsed * 0.4) * 5)
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
      container?.removeEventListener('pointerenter', onEnter)
      container?.removeEventListener('pointerleave', onLeave)
      observer.disconnect()
      for (const resource of disposables) resource.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      if (fallback) fallback.style.opacity = '1'
    }
  }, [])

  return (
    <div className="lgc-float relative">
      <div data-radar-fallback className="transition-opacity duration-500">
        <RadarArt />
      </div>
      <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />
    </div>
  )
}
