<template>
  <div ref="containerRef" class="wave-background"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

// Props 定义
interface Props {
  colorA?: string // 主色调
  colorB?: string // 高光色
  colorC?: string // 暗部色
  waveHeight?: number // 波浪高度
  waveSpeed?: number // 波浪速度
  fps?: number // 帧率限制
}

const props = withDefaults(defineProps<Props>(), {
  colorA: '#c93756', // 主色 - 胭脂红
  colorB: '#ff6b8a', // 高光 - 浅粉
  colorC: '#6b1a2e', // 暗部 - 深红
  waveHeight: 0.4,
  waveSpeed: 0.6,
  fps: 60,
})

const containerRef = ref<HTMLDivElement | null>(null)

// Three.js 相关变量
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let material: THREE.ShaderMaterial
let mesh: THREE.Mesh
let geometry: THREE.PlaneGeometry
let animationId: number
let isRunning = true
let lastTime = 0

// 顶点着色器 - 更逼真的波浪效果
const vertexShader = `
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveSpeed;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // 改进的 Simplex 噪声
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                   + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // FBM (分形布朗运动) - 更自然的噪声叠加
  float fbm(vec2 p, float time) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency + time * 0.2);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  // Gerstner 波浪 - 更真实的水波
  vec3 gerstnerWave(vec2 coord, float wavelength, float steepness, vec2 direction, float time) {
    float k = 2.0 * 3.14159 / wavelength;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(direction);
    float f = k * (dot(d, coord) - c * time);
    float a = steepness / k;

    return vec3(
      d.x * a * cos(f),
      a * sin(f),
      d.y * a * cos(f)
    );
  }

  void main() {
    vUv = uv;

    float time = uTime * uWaveSpeed;
    vec2 pos = position.xy;

    // 多个 Gerstner 波叠加 - 模拟真实水面
    vec3 wave = vec3(0.0);

    // 主波浪
    wave += gerstnerWave(pos, 3.0, 0.15, vec2(1.0, 0.3), time);
    wave += gerstnerWave(pos, 2.0, 0.12, vec2(0.8, 0.6), time * 1.1);
    wave += gerstnerWave(pos, 1.5, 0.08, vec2(-0.5, 0.8), time * 0.9);

    // 中等波浪
    wave += gerstnerWave(pos, 0.8, 0.05, vec2(0.3, -0.7), time * 1.3);
    wave += gerstnerWave(pos, 0.5, 0.03, vec2(-0.6, 0.4), time * 1.5);

    // 细小涟漪 (用噪声)
    float ripple = fbm(pos * 2.0, time) * 0.08;
    wave.y += ripple;

    // 应用波浪高度
    wave *= uWaveHeight;

    vElevation = wave.y;

    // 计算新位置 - 平面正对相机，波浪在Z轴上起伏
    vec3 newPosition = position;
    newPosition.z += wave.y * uWaveHeight;  // 波浪朝向相机

    vPosition = newPosition;

    // 计算法线 (用于光照)
    float delta = 0.01;
    vec3 wave1 = gerstnerWave(pos + vec2(delta, 0.0), 3.0, 0.15, vec2(1.0, 0.3), time) * uWaveHeight;
    vec3 wave2 = gerstnerWave(pos + vec2(0.0, delta), 3.0, 0.15, vec2(1.0, 0.3), time) * uWaveHeight;

    vec3 tangent = normalize(vec3(delta, wave1.y - wave.y, wave1.z - wave.z));
    vec3 bitangent = normalize(vec3(wave2.x - wave.x, delta, wave2.z - wave.z));
    vNormal = normalize(cross(tangent, bitangent));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

// 片元着色器 - 更逼真的水面光效
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uWaveSpeed;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // 菲涅尔效果
  float fresnel(vec3 viewDir, vec3 normal, float power) {
    return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
  }

  void main() {
    float time = uTime * uWaveSpeed;

    // 视线方向（简化）
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));

    // 菲涅尔反射 - 边缘更亮
    float fresnelFactor = fresnel(viewDir, normalize(vNormal), 2.0);

    // 基于高度的颜色混合
    float heightFactor = smoothstep(-0.15, 0.25, vElevation);

    // 深浅颜色混合
    vec3 deepColor = uColorC;  // 波谷暗色
    vec3 midColor = uColorA;   // 中间主色
    vec3 peakColor = uColorB;  // 波峰亮色

    vec3 color = mix(deepColor, midColor, smoothstep(0.0, 0.5, heightFactor));
    color = mix(color, peakColor, smoothstep(0.5, 1.0, heightFactor));

    // 菲涅尔高光
    color = mix(color, peakColor, fresnelFactor * 0.4);

    // 动态高光 - 模拟阳光反射
    vec3 lightDir = normalize(vec3(
      sin(time * 0.3) * 0.5,
      cos(time * 0.2) * 0.3 + 0.7,
      0.5
    ));

    float specular = pow(max(dot(reflect(-lightDir, normalize(vNormal)), viewDir), 0.0), 32.0);

    // 焦散效果 (水下光斑)
    float caustic1 = pow(0.5 + 0.5 * sin(vUv.x * 30.0 + time * 2.0 + vElevation * 10.0), 4.0);
    float caustic2 = pow(0.5 + 0.5 * sin(vUv.y * 25.0 - time * 1.5 + vElevation * 8.0), 4.0);
    float caustic = caustic1 * caustic2;

    // 波光粼粼效果
    float sparkle = pow(max(0.0, sin(vUv.x * 60.0 + time * 3.0) * sin(vUv.y * 60.0 + time * 2.5)), 16.0);
    sparkle *= smoothstep(0.1, 0.3, vElevation); // 只在波峰闪烁

    // 组合所有效果
    color += specular * 0.5 * peakColor;
    color += caustic * 0.12 * peakColor;
    color += sparkle * 0.4;

    // 轻微的颜色偏移动画
    float colorShift = sin(time * 0.1 + vUv.x * 2.0) * 0.05;
    color.r += colorShift;
    color.b -= colorShift * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`

// 将 hex 颜色转为 THREE.Color
const hexToThreeColor = (hex: string): THREE.Color => {
  return new THREE.Color(hex)
}

// 初始化 Three.js 场景
const initScene = () => {
  if (!containerRef.value) return

  const width = window.innerWidth
  const height = window.innerHeight

  // 创建场景
  scene = new THREE.Scene()

  // 使用透视相机，直接正对平面
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  // 计算能完全覆盖屏幕的平面尺寸
  const fov = 75 * (Math.PI / 180)
  const planeHeight = 2 * Math.tan(fov / 2) * 5 * 1.5 // 额外放大确保覆盖
  const planeWidth = planeHeight * (width / height) * 1.5

  geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 200, 200)

  // 创建着色器材质
  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWaveHeight: { value: props.waveHeight },
      uWaveSpeed: { value: props.waveSpeed },
      uColorA: { value: hexToThreeColor(props.colorA) },
      uColorB: { value: hexToThreeColor(props.colorB) },
      uColorC: { value: hexToThreeColor(props.colorC) },
    },
    side: THREE.DoubleSide,
  })

  // 创建网格 - 平面正对相机
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
}

// 动画循环
const animate = (currentTime: number) => {
  if (!isRunning) return

  animationId = requestAnimationFrame(animate)

  // 帧率限制
  const interval = 1000 / props.fps
  if (currentTime - lastTime < interval) return
  lastTime = currentTime

  // 更新时间 uniform
  if (material?.uniforms?.uTime) {
    material.uniforms.uTime.value = currentTime * 0.001
  }

  // 渲染
  renderer.render(scene, camera)
}

// 处理窗口大小变化
const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return

  const width = window.innerWidth
  const height = window.innerHeight

  // 更新透视相机
  const perspCamera = camera as THREE.PerspectiveCamera
  perspCamera.aspect = width / height
  perspCamera.updateProjectionMatrix()

  // 重新计算平面尺寸
  if (geometry && mesh) {
    const fov = 75 * (Math.PI / 180)
    const planeHeight = 2 * Math.tan(fov / 2) * 5 * 1.5
    const planeWidth = planeHeight * (width / height) * 1.5

    geometry.dispose()
    geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 200, 200)
    mesh.geometry = geometry
  }

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

// 处理页面可见性变化
const handleVisibilityChange = () => {
  if (document.hidden) {
    isRunning = false
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  } else {
    isRunning = true
    lastTime = 0
    animate(0)
  }
}

// 监听 props 变化
watch(
  () => [props.colorA, props.colorB, props.colorC],
  () => {
    if (material?.uniforms?.uColorA && material?.uniforms?.uColorB && material?.uniforms?.uColorC) {
      material.uniforms.uColorA.value = hexToThreeColor(props.colorA)
      material.uniforms.uColorB.value = hexToThreeColor(props.colorB)
      material.uniforms.uColorC.value = hexToThreeColor(props.colorC)
    }
  }
)

watch(
  () => props.waveHeight,
  (newValue) => {
    if (material?.uniforms?.uWaveHeight) {
      material.uniforms.uWaveHeight.value = newValue
    }
  }
)

watch(
  () => props.waveSpeed,
  (newValue) => {
    if (material?.uniforms?.uWaveSpeed) {
      material.uniforms.uWaveSpeed.value = newValue
    }
  }
)

// 生命周期钩子
onMounted(() => {
  initScene()
  animate(0)

  window.addEventListener('resize', handleResize)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  isRunning = false

  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  // 清理 Three.js 资源
  if (geometry) geometry.dispose()
  if (material) material.dispose()
  if (renderer) {
    renderer.dispose()
    if (containerRef.value && renderer.domElement) {
      containerRef.value.removeChild(renderer.domElement)
    }
  }
})
</script>

<style scoped>
.wave-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}
</style>
