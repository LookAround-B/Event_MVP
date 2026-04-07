"use client";

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    THREE: any
  }
}

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const sceneRef = useRef<{
    camera: any
    scene: any
    renderer: any
    uniforms: any
    animationId: number | null
    onResize: (() => void) | null
  }>({
    camera: null,
    scene: null,
    renderer: null,
    uniforms: null,
    animationId: null,
    onResize: null,
  })

  useEffect(() => {
    if (initializedRef.current) {
      return
    }

    // Load Three.js dynamically if not already present
    if (window.THREE) {
      initThreeJS()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-threejs-cdn="true"]')

    const handleLoad = () => {
      if (containerRef.current && window.THREE) {
        initThreeJS()
      }
    }

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad)
    } else {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/89/three.min.js"
      script.async = true
      script.dataset.threejsCdn = "true"
      script.addEventListener("load", handleLoad)
      document.head.appendChild(script)
    }

    return () => {
      // Cleanup
      if (sceneRef.current.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId)
      }
      if (sceneRef.current.onResize) {
        window.removeEventListener("resize", sceneRef.current.onResize)
      }
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose()
        if (sceneRef.current.renderer.domElement && sceneRef.current.renderer.domElement.parentNode) {
          sceneRef.current.renderer.domElement.parentNode.removeChild(sceneRef.current.renderer.domElement)
        }
      }
      if (existingScript) {
        existingScript.removeEventListener("load", handleLoad)
      }
      initializedRef.current = false
      // Note: We don't remove the script from head to avoid reloading it on every mount
    }
  }, [])

  const initThreeJS = () => {
    if (!containerRef.current || !window.THREE || initializedRef.current) return

    const THREE = window.THREE
    const container = containerRef.current
    initializedRef.current = true
    container.replaceChildren()

    // Initialize camera
    const camera = new THREE.Camera()
    camera.position.z = 1

    // Initialize scene
    const scene = new THREE.Scene()

    // Create geometry
    const geometry = new THREE.PlaneBufferGeometry(2, 2)

    // Define uniforms
    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    }

    // Vertex shader
    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    // Fragment shader
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;
        
      float random (in float x) {
          return fract(sin(x)*1e4);
      }
      float random (vec2 st) {
          return fract(sin(dot(st.xy,
                                vec2(12.9898,78.233)))*
               43758.5453123);
      }
      
      varying vec2 vUv;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        
        vec2 fMosaicScal = vec2(4.0, 2.0);
        vec2 vScreenSize = vec2(256,256);
        uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
        uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);       
          
        float t = time*0.06+random(uv.x)*0.4;
        float lineWidth = 0.0008;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*1.0 - length(uv));        
          }
        }

        gl_FragColor = vec4(color[2],color[1],color[0],1.0);
      }
    `

    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    })

    // Create mesh and add to scene
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    // Handle resize
    const onWindowResize = () => {
      if (!container || !renderer) return
      const rect = container.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height)
      if (uniforms.resolution.value) {
        uniforms.resolution.value.x = renderer.domElement.width
        uniforms.resolution.value.y = renderer.domElement.height
      }
    }

    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    // Store references
    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms,
      animationId: null,
      onResize: onWindowResize,
    }

    // Animation loop
    const animate = () => {
      if (!sceneRef.current.renderer) return
      sceneRef.current.animationId = requestAnimationFrame(animate)
      if (uniforms.time) {
        uniforms.time.value += 0.05
      }
      sceneRef.current.renderer.render(scene, camera)
    }

    animate()
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full absolute inset-0" 
    />
  )
}
